import { BAD_REQUEST, NOT_FOUND, INTERNAL_SERVER, CONFLICT } from "../lib/status_codes.js";
import { parseIntOrNull, parseFloatOrNull, parseDateOrNull, parseDecimalOrNull } from "../lib/parser.js"; // Adjust path
// import { generateOrderNumber } from "../utils/generateOrderNumbergenerators.js"; // Adjust path
import { ACTIVE_ORDER_STATUSES, ORDER_STATUS_ENUM, ORDER_TYPE_ENUM, PAYMENT_METHOD_ENUM, PAYMENT_STATUS_ENUM, ITEM_STATUS_ENUM } from "../lib/constants.js"; // Adjust path
import { generateOrderNumber } from "../lib/generator.js";
import Validator from "../lib/validator.js";
import promiseAsyncWrapper from "../lib/wrappers/promise_async_wrapper.js";
import CustomError from "../utils/custom_error.js";
import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma.js";


// --- Internal Helper Functions ---
const findActiveOrderForDesk = async (desk_number, shop_id) => {
    return prisma.orders.findFirst({
        where: {
            desk_number: desk_number,
            shop_id: shop_id,
            status: { in: ACTIVE_ORDER_STATUSES },
        },
        include: { order_items: true } // Include items for merging
    });
};

const calculateOrderTotals = (items, taxAmount = 0, discountAmount = 0, serviceCharge = 0, tipAmount = 0) => {
    const subtotal = items.reduce((sum, item) => {
        // Assuming item.total_price is (item.quantity * item.unit_price)
        // If item-specific discounts are applied to item.total_price, this is fine.
        return sum + item.total_price;
    }, 0);

    const finalTaxAmount = taxAmount;
    const finalDiscountAmount = discountAmount;
    const finalServiceCharge = serviceCharge || 0;
    const finalTipAmount = tipAmount || 0;

    const total = subtotal
        + finalTaxAmount
        - finalDiscountAmount
        + finalServiceCharge
        + finalTipAmount;

    return {
        subtotal: subtotal,
        tax_amount: finalTaxAmount,
        discount_amount: finalDiscountAmount,
        service_charge: finalServiceCharge,
        tip_amount: finalTipAmount,
        total: total,
    };
};


// --- Main Services ---

export const createOrderService = async (orderInput, itemsInput) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        const { shop_id, order_type, desk_number } = orderInput;

        try {
            // --- Basic Validations ---
            await Validator.validateNotNull({ shop_id, order_type, items: itemsInput });
            await Validator.isNumber(parseInt(shop_id));
            await Validator.isEnum(order_type, ORDER_TYPE_ENUM);
            await Validator.minArrayLength(itemsInput, 1, "Order must have at least one item.");

            const shopExists = await prisma.shops.findUnique({ where: { id: parseInt(shop_id) } });
            if (!shopExists) return reject(new CustomError(`Shop with ID ${shop_id} not found.`, NOT_FOUND));

            // Add more validations for waiter_id, chef_id if provided

            // --- Dine-In Merge Logic ---
            if (order_type === 'dine_in' && desk_number) {
                const parsedDeskNumber = parseInt(desk_number);
                await Validator.isNumber(parsedDeskNumber);
                const deskExists = await prisma.desks.findFirst({ where: {
                    desk_number: +desk_number,
                    shop_id: +shop_id
                }});
                if(!deskExists) return reject(new CustomError(`Desk with ID ${parsedDeskNumber} not found.`, NOT_FOUND));

                const activeOrder = await findActiveOrderForDesk(parsedDeskNumber, parseInt(shop_id));
                if (activeOrder) {
                    // Merge: Add items to existing active order
                    const updatedOrder = await addItemsToOrderService(activeOrder.id, itemsInput, {
                        waiter_id: orderInput.waiter_id ? parseInt(orderInput.waiter_id) : activeOrder.waiter_id,
                        notes: orderInput.notes || activeOrder.notes,
                    });
                    return resolve(updatedOrder);
                }
            }

            // --- Create New Order ---
            const order_number = await generateOrderNumber(prisma, parseInt(shop_id));

            const newOrderData = {
                order_number,
                status: orderInput.status || 'pending', // Default status
                // customer_id: customer_id ? parseInt(customer_id) : null,
                desk_number: (order_type === 'dine_in' && desk_number) ? parseInt(desk_number) : null,
                order_type,
                customer_name: order_type === 'dine_in' ? orderInput.customer_name : null,
                customer_phone: order_type === 'dine_in' ? orderInput.customer_phone : null,
                takeaway_pickup_time: order_type === 'takeaway' ? parseDateOrNull(orderInput.takeaway_pickup_time) : null,
                takeaway_customer_name: order_type === 'takeaway' ? orderInput.takeaway_customer_name : null,
                // ... fill all other order fields from orderInput with parsing ...
                delivery_address: order_type === 'delivery' ? orderInput.delivery_address : null,
                delivery_fee: order_type === 'delivery' ? parseFloatOrNull(orderInput.delivery_fee) : null,
                waiter_id: orderInput.waiter_id ? parseInt(orderInput.waiter_id) : null,
                chef_id: orderInput.chef_id ? parseInt(orderInput.chef_id) : null,
                
                subtotal: 0, // Initial
                tax_amount: parseDecimalOrNull(orderInput.tax_amount) || 0,
                discount_amount: parseDecimalOrNull(orderInput.discount_amount) || 0,
                service_charge: parseDecimalOrNull(orderInput.service_charge),
                tip_amount: parseDecimalOrNull(orderInput.tip_amount),
                total: 0, // Initial

                payment_status: orderInput.payment_status || 'unpaid',
                payment_method: orderInput.payment_method || null,
                transaction_id: orderInput.transaction_id || null,
                paid_at: parseDateOrNull(orderInput.paid_at),

                placed_at: new Date(),
                preparation_time: parseIntOrNull(orderInput.preparation_time),
                // ... other timestamps ...
                notes: orderInput.notes || null,
                dietary_restrictions: orderInput.dietary_restrictions || null,
                shop_id: parseInt(shop_id),
            };
            if(newOrderData.payment_method) await Validator.isEnum(newOrderData.payment_method, PAYMENT_METHOD_ENUM);
            await Validator.isEnum(newOrderData.status, ORDER_STATUS_ENUM);
            await Validator.isEnum(newOrderData.payment_status, PAYMENT_STATUS_ENUM);


            // --- Transaction for Order and Items ---
            const resultOrder = await prisma.$transaction(async (tx) => {
                const createdOrder = await tx.orders.create({ data: newOrderData });

                const createdItems = [];
                let runningSubtotal = 0;

                for (const itemInput of itemsInput) {
                    await Validator.validateNotNull({ product_id: itemInput.product_id, quantity: itemInput.quantity });
                    const productId = parseInt(itemInput.product_id);
                    const quantity = parseInt(itemInput.quantity);
                    await Validator.isNumber(productId);
                    await Validator.isNumber(quantity);
                    if (quantity <= 0) throw new CustomError("Item quantity must be positive.", BAD_REQUEST);

                    const product = await tx.products.findUnique({ where: { id: productId } });
                    if (!product) throw new CustomError(`Product with ID ${productId} not found.`, NOT_FOUND);
                    if (!product.price) throw new CustomError(`Product with ID ${productId} does not have a price.`, BAD_REQUEST);
                    
                    const unit_price = +product.price;
                    const total_price = unit_price * +quantity;
                    runningSubtotal = runningSubtotal + total_price;

                    const itemData = {
                        order_id: createdOrder.id, // CRITICAL: Assumes order_id is String
                        product_id: productId,
                        quantity,
                        unit_price,
                        total_price,
                        special_requests: itemInput.special_requests || null,
                        variant_options: itemInput.variant_options || Prisma.JsonNull, // Or handle JSON properly
                        status: itemInput.status || 'pending',
                        // applied_discount_id: itemInput.applied_discount_id ? parseInt(itemInput.applied_discount_id) : null,
                    };
                    await Validator.isEnum(itemData.status, ITEM_STATUS_ENUM);
                    createdItems.push(await tx.order_items.create({ data: itemData }));
                }

                // Calculate final totals
                const finalTotals = calculateOrderTotals(
                    createdItems, // Pass items with their total_price
                    newOrderData.tax_amount,
                    newOrderData.discount_amount,
                    newOrderData.service_charge,
                    newOrderData.tip_amount
                );
                
                const updatedOrderWithTotals = await tx.orders.update({
                    where: { id: createdOrder.id },
                    data: {
                        subtotal: finalTotals.subtotal,
                        total: finalTotals.total,
                        // tax_amount, discount_amount etc. are already set or could be recalculated here too
                    },
                    include: { order_items: true, shop: true, customer: true, desk: true }
                });
                return updatedOrderWithTotals;
            });

            return resolve(resultOrder);

        } catch (error) {
            if (error instanceof CustomError) return reject(error);
            if (error.code === 'P2002' && error.meta?.target?.includes('desk_number')) {
                return reject(new CustomError(
                    `Desk with ID ${desk_number} is already uniquely associated with another order. It might be an old, uncleared order.`,
                    CONFLICT
                ));
            }
            console.error("Error in createOrderService:", error);
            return reject(new CustomError("Failed to create order.", INTERNAL_SERVER));
        }
    })
);

export const addItemsToOrderService = async (orderId, itemsInput, orderUpdateData = {}) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            await Validator.isText(orderId); // Assuming UUID string
            await Validator.minArrayLength(itemsInput, 1, "Must add at least one item.");

            const existingOrder = await prisma.orders.findUnique({
                where: { id: orderId },
                include: { items: true }
            });
            if (!existingOrder) return reject(new CustomError(`Order with ID ${orderId} not found.`, NOT_FOUND));
            if (!ACTIVE_ORDER_STATUSES.includes(existingOrder.status)) {
                return reject(new CustomError(`Cannot add items to an order with status '${existingOrder.status}'.`, BAD_REQUEST));
            }

            const resultOrder = await prisma.$transaction(async (tx) => {
                let currentItems = [...existingOrder.items]; // Current items in the order

                for (const itemInput of itemsInput) {
                    await Validator.validateNotNull({ product_id: itemInput.product_id, quantity: itemInput.quantity });
                    const productId = parseInt(itemInput.product_id);
                    const quantity = parseInt(itemInput.quantity);
                    // ... (validation for product_id, quantity, product existence, price as in createOrderService) ...
                    const product = await tx.products.findUnique({ where: { id: productId } });
                    if (!product) throw new CustomError(`Product with ID ${productId} not found.`, NOT_FOUND);
                    if (!product.price) throw new CustomError(`Product with ID ${productId} does not have a price.`, BAD_REQUEST);

                    const unit_price = new Prisma.Decimal(product.price);
                    const total_price = unit_price.mul(new Prisma.Decimal(quantity));
                    
                    const newItemData = {
                        order_id: +orderId,
                        product_id: productId,
                        quantity,
                        unit_price,
                        total_price,
                        special_requests: itemInput.special_requests || null,
                        variant_options: itemInput.variant_options || Prisma.JsonNull,
                        status: itemInput.status || 'pending',
                    };
                    const createdItem = await tx.order_items.create({ data: newItemData });
                    currentItems.push(createdItem); // Add to the list for total calculation
                }
                
                // Prepare data for updating the order itself (e.g., customer_id, notes from merge)
                const updatePayload = {};
                // if (orderUpdateData.customer_id !== undefined) updatePayload.customer_id = orderUpdateData.customer_id;
                if (orderUpdateData.waiter_id !== undefined) updatePayload.waiter_id = orderUpdateData.waiter_id;
                if (orderUpdateData.notes !== undefined) updatePayload.notes = orderUpdateData.notes;
                // ... other updatable fields ...

                // Recalculate totals based on all items (existing + new)
                const finalTotals = calculateOrderTotals(
                    currentItems,
                    existingOrder.tax_amount,
                    existingOrder.discount_amount,
                    existingOrder.service_charge,
                    existingOrder.tip_amount
                );

                updatePayload.subtotal = finalTotals.subtotal;
                updatePayload.total = finalTotals.total;
                updatePayload.updated_at = new Date();

                const updatedOrder = await tx.orders.update({
                    where: { id: orderId },
                    data: updatePayload,
                    include: { items: true, shop: true, customer: true, desk: true }
                });
                return updatedOrder;
            });
            return resolve(resultOrder);

        } catch (error) {
            if (error instanceof CustomError) return reject(error);
            console.error("Error in addItemsToOrderService:", error);
            return reject(new CustomError("Failed to add items to order.", INTERNAL_SERVER));
        }
    })
);


export const getAllOrdersService = async (queryParams) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            // const {
            //     shop_id, customer_id, desk_id, order_type, status,
            //     payment_status, page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc',
            //     search // For order_number
            // } = queryParams;

            // const filters = {};
            // if (shop_id) filters.shop_id = parseInt(shop_id);
            // if (customer_id) filters.customer_id = parseInt(customer_id);
            // if (desk_id) filters.desk_id = parseInt(desk_id);
            // if (order_type) {
            //     await Validator.isEnum(order_type, ORDER_TYPE_ENUM);
            //     filters.order_type = order_type;
            // }
            // if (status) {
            //     await Validator.isEnum(status, ORDER_STATUS_ENUM);
            //     filters.status = status;
            // }
            // if (payment_status) {
            //      await Validator.isEnum(payment_status, PAYMENT_STATUS_ENUM);
            //     filters.payment_status = payment_status;
            // }
            // if (search) filters.order_number = { contains: search, mode: 'insensitive' };

            // const orders = await prisma.orders.findMany({
            //     where: filters,
            //     include: {
            //         items: { include: { product: true } }, // product name shown on item
            //         shop: true,
            //         customer: true,
            //         desk: true,
            //     },
            //     orderBy: { [sortBy]: sortOrder },
            //     skip: (parseInt(page) - 1) * parseInt(limit),
            //     take: parseInt(limit),
            // });
            // const totalOrders = await prisma.orders.count({ where: filters });

            // return resolve({
            //     data: orders,
            //     meta: {
            //         total: totalOrders,
            //         page: parseInt(page),
            //         limit: parseInt(limit),
            //         totalPages: Math.ceil(totalOrders / parseInt(limit)),
            //     },
            // });

            const orders = await prisma.orders.findMany({})
            return resolve(orders)
        } catch (error) {
            if (error instanceof CustomError) return reject(error);
            console.error("Error in getAllOrdersService:", error);
            return reject(new CustomError("Failed to retrieve orders.", INTERNAL_SERVER));
        }
    })
);

export const getOrderByIdService = async (orderId) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            await Validator.isText(orderId); // Assuming UUID string
            const order = await prisma.orders.findUnique({
                where: { id: orderId },
                include: {
                    items: { include: { product: true /* applied_discount: true */ } },
                    shop: true,
                    customer: true,
                    desk: true,
                }
            });
            if (!order) return reject(new CustomError(`Order with ID ${orderId} not found.`, NOT_FOUND));
            return resolve(order);
        } catch (error) {
            if (error instanceof CustomError) return reject(error);
            console.error("Error in getOrderByIdService:", error);
            return reject(new CustomError("Failed to retrieve order.", INTERNAL_SERVER));
        }
    })
);

export const updateOrderStatusService = async (orderId, newStatus, details = {}) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        // details can include cancellation_reason, staff_id, etc.
        try {
            await Validator.isText(orderId);
            await Validator.isEnum(newStatus, ORDER_STATUS_ENUM);

            const order = await prisma.orders.findUnique({ where: { id: orderId }});
            if(!order) return reject(new CustomError(`Order with ID ${orderId} not found.`, NOT_FOUND));

            const updateData = { status: newStatus, updated_at: new Date() };

            // Handle timestamps based on status
            // if (newStatus === 'preparing' && !order.preparation_start_time) updateData.preparation_start_time = new Date(); // Example custom field
            if (newStatus === 'ready' && !order.ready_at) updateData.ready_at = new Date();
            if (newStatus === 'served' && !order.served_at) updateData.served_at = new Date();
            if (newStatus === 'delivered' && !order.actual_delivery_time) updateData.actual_delivery_time = new Date();
            if (newStatus === 'completed' && !order.completed_at) updateData.completed_at = new Date();
            if (newStatus === 'cancelled' && !order.cancelled_at) {
                updateData.cancelled_at = new Date();
                updateData.cancellation_reason = details.cancellation_reason || "No reason provided";
                // Optionally, cancel all items
                await prisma.order_items.updateMany({
                    where: { order_id: +orderId, status: { notIn: ['cancelled', 'served'] } }, // Don't re-cancel
                    data: { status: 'cancelled' }
                });
            }

            // If order is completed or cancelled, and it had a desk, clear the desk_id
            // This is crucial for the @unique constraint on orders.desk_id
            if (['completed', 'cancelled'].includes(newStatus) && order.desk_number) {
                updateData.desk_number = null; // Free up the desk
            }


            const updatedOrder = await prisma.orders.update({
                where: { id: orderId },
                data: updateData,
                include: { items: true, shop: true, customer: true, desk: true }
            });
            return resolve(updatedOrder);

        } catch (error) {
            if (error instanceof CustomError) return reject(error);
            console.error("Error in updateOrderStatusService:", error);
            return reject(new CustomError("Failed to update order status.", INTERNAL_SERVER));
        }
    })
);

// updateOrderService for general fields (excluding status and complex item changes here for simplicity)
export const updateOrderGeneralInfoService = async (orderId, updateInput) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            await Validator.isText(orderId);
            const order = await prisma.orders.findUnique({ where: { id: orderId }, include: { items: true }});
            if(!order) return reject(new CustomError(`Order with ID ${orderId} not found.`, NOT_FOUND));
            if (!ACTIVE_ORDER_STATUSES.includes(order.status)) {
                 return reject(new CustomError(`Cannot update general info for an order with status '${order.status}'.`, BAD_REQUEST));
            }

            const dataToUpdate = { updated_at: new Date() };

            // Order Type specific fields
            if (order.order_type === 'takeaway') {
                if (updateInput.takeaway_pickup_time !== undefined) dataToUpdate.takeaway_pickup_time = parseDateOrNull(updateInput.takeaway_pickup_time);
                if (updateInput.takeaway_customer_name !== undefined) dataToUpdate.takeaway_customer_name = updateInput.takeaway_customer_name;
            } else if (order.order_type === 'delivery') {
                if (updateInput.delivery_address !== undefined) dataToUpdate.delivery_address = updateInput.delivery_address;
                if (updateInput.delivery_fee !== undefined) dataToUpdate.delivery_fee = parseFloatOrNull(updateInput.delivery_fee);
                if (updateInput.estimated_delivery_time !== undefined) dataToUpdate.estimated_delivery_time = parseDateOrNull(updateInput.estimated_delivery_time);
            }
            
            // Staff
            if (updateInput.waiter_id !== undefined) dataToUpdate.waiter_id = parseIntOrNull(updateInput.waiter_id);
            if (updateInput.chef_id !== undefined) dataToUpdate.chef_id = parseIntOrNull(updateInput.chef_id);

            // Notes
            if (updateInput.notes !== undefined) dataToUpdate.notes = updateInput.notes;
            if (updateInput.dietary_restrictions !== undefined) dataToUpdate.dietary_restrictions = updateInput.dietary_restrictions;

            // Financials (tax, discount, service_charge, tip)
            // Updating these requires recalculating total
            let needsRecalculate = false;
            if (updateInput.tax_amount !== undefined) { dataToUpdate.tax_amount = parseDecimalOrNull(updateInput.tax_amount); needsRecalculate = true; }
            if (updateInput.discount_amount !== undefined) { dataToUpdate.discount_amount = parseDecimalOrNull(updateInput.discount_amount); needsRecalculate = true; }
            if (updateInput.service_charge !== undefined) { dataToUpdate.service_charge = parseDecimalOrNull(updateInput.service_charge); needsRecalculate = true; }
            if (updateInput.tip_amount !== undefined) { dataToUpdate.tip_amount = parseDecimalOrNull(updateInput.tip_amount); needsRecalculate = true; }

            if (needsRecalculate) {
                const totals = calculateOrderTotals(
                    order.items,
                    dataToUpdate.tax_amount !== undefined ? dataToUpdate.tax_amount : order.tax_amount,
                    dataToUpdate.discount_amount !== undefined ? dataToUpdate.discount_amount : order.discount_amount,
                    dataToUpdate.service_charge !== undefined ? dataToUpdate.service_charge : order.service_charge,
                    dataToUpdate.tip_amount !== undefined ? dataToUpdate.tip_amount : order.tip_amount
                );
                dataToUpdate.total = totals.total;
                // subtotal is derived from items, should not change here unless items change
            }
            
            // Payment details
            if (updateInput.payment_status !== undefined) {
                await Validator.isEnum(updateInput.payment_status, PAYMENT_STATUS_ENUM);
                dataToUpdate.payment_status = updateInput.payment_status;
                if(updateInput.payment_status === 'paid' && !order.paid_at) dataToUpdate.paid_at = new Date();
            }
            if (updateInput.payment_method !== undefined) {
                if(updateInput.payment_method === null || updateInput.payment_method === ''){
                    dataToUpdate.payment_method = null;
                } else {
                    await Validator.isEnum(updateInput.payment_method, PAYMENT_METHOD_ENUM);
                    dataToUpdate.payment_method = updateInput.payment_method;
                }
            }
            if (updateInput.transaction_id !== undefined) dataToUpdate.transaction_id = updateInput.transaction_id;


            if (Object.keys(dataToUpdate).length <= 1) { // Only updated_at
                 return reject(new CustomError("No valid fields provided for update.", BAD_REQUEST));
            }

            const updatedOrder = await prisma.orders.update({
                where: { id: orderId },
                data: dataToUpdate,
                include: { items: true, shop: true, customer: true, desk: true }
            });
            resolve(updatedOrder);

        } catch (error) {
            if (error instanceof CustomError) return reject(error);
            console.error("Error in updateOrderGeneralInfoService:", error);
            return reject(new CustomError("Failed to update order general information.", INTERNAL_SERVER));
        }
    })
);


// --- Order Item Specific Services (can be part of order_service.js or separate) ---

export const updateOrderItemService = async (orderItemId, itemUpdateData) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            const id = parseInt(orderItemId);
            await Validator.isNumber(id);

            const item = await prisma.order_items.findUnique({ where: { id }, include: { order: true } });
            if (!item) return reject(new CustomError(`Order item with ID ${id} not found.`, NOT_FOUND));
            if (!ACTIVE_ORDER_STATUSES.includes(item.order.status)){
                 return reject(new CustomError(`Cannot update item for an order with status '${item.order.status}'.`, BAD_REQUEST));
            }


            const dataToUpdate = { updated_at: new Date() }; // Assuming order_items also has updated_at
            let needsOrderTotalRecalculation = false;

            if (itemUpdateData.quantity !== undefined) {
                const quantity = parseInt(itemUpdateData.quantity);
                await Validator.isNumber(quantity);
                if (quantity <= 0) return reject(new CustomError("Quantity must be positive.", BAD_REQUEST));
                dataToUpdate.quantity = quantity;
                dataToUpdate.total_price = item.unit_price.mul(new Prisma.Decimal(quantity));
                needsOrderTotalRecalculation = true;
            }
            if (itemUpdateData.special_requests !== undefined) dataToUpdate.special_requests = itemUpdateData.special_requests;
            if (itemUpdateData.status !== undefined) {
                await Validator.isEnum(itemUpdateData.status, ITEM_STATUS_ENUM);
                dataToUpdate.status = itemUpdateData.status;
                if(itemUpdateData.status === 'preparing' && !item.started_at) dataToUpdate.started_at = new Date();
                if(itemUpdateData.status === 'ready' && !item.completed_at) dataToUpdate.completed_at = new Date();
                // Note: 'served' status for an item might also trigger an order-level timestamp
            }
            // variant_options, applied_discount_id can also be updated

            if (Object.keys(dataToUpdate).length <=1) {
                 return reject(new CustomError("No valid fields provided for item update.", BAD_REQUEST));
            }

            const updatedItem = await prisma.order_items.update({
                where: { id },
                data: dataToUpdate
            });

            if (needsOrderTotalRecalculation) {
                const orderItems = await prisma.order_items.findMany({ where: { order_id: +item.order_id } });
                const order = await prisma.orders.findUnique({where: {id: +item.order_id}}) // fetch fresh order for other amounts
                const totals = calculateOrderTotals(
                    orderItems,
                    order.tax_amount,
                    order.discount_amount,
                    order.service_charge,
                    order.tip_amount
                );
                await prisma.orders.update({
                    where: { id: +item.order_id },
                    data: {
                        subtotal: totals.subtotal,
                        total: totals.total,
                        updated_at: new Date()
                    }
                });
            }
            // Return the full order after item update
            const fullOrder = await getOrderByIdService(+item.order_id);
            return resolve(fullOrder);

        } catch (error) {
            if (error instanceof CustomError) return reject(error);
            console.error("Error in updateOrderItemService:", error);
            return reject(new CustomError("Failed to update order item.", INTERNAL_SERVER));
        }
    })
);

export const removeOrderItemService = async (orderItemId) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            const id = parseInt(orderItemId);
            await Validator.isNumber(id);

            const item = await prisma.order_items.findUnique({ where: { id }, include: { order: true } });
            if (!item) return reject(new CustomError(`Order item with ID ${id} not found.`, NOT_FOUND));
             if (!ACTIVE_ORDER_STATUSES.includes(item.order.status)){
                 return reject(new CustomError(`Cannot remove item from an order with status '${item.order.status}'.`, BAD_REQUEST));
            }
            
            // Check if it's the last item
            const itemCount = await prisma.order_items.count({ where: { order_id: +item.order_id } });
            if (itemCount <= 1) {
                return reject(new CustomError("Cannot remove the last item from an order. Consider cancelling the order instead.", BAD_REQUEST));
            }

            await prisma.order_items.delete({ where: { id } });

            // Recalculate order totals
            const remainingItems = await prisma.order_items.findMany({ where: { order_id: +item.order_id } });
            const order = await prisma.orders.findUnique({where: {id: +item.order_id}}) // fetch fresh order
            const totals = calculateOrderTotals(
                remainingItems,
                order.tax_amount,
                order.discount_amount,
                order.service_charge,
                order.tip_amount
            );
            await prisma.orders.update({
                where: { id: item.order_id },
                data: {
                    subtotal: totals.subtotal,
                    total: totals.total,
                    updated_at: new Date()
                }
            });
             // Return the full order after item removal
            const fullOrder = await getOrderByIdService(item.order_id);
            return resolve(fullOrder);

        } catch (error) {
            if (error instanceof CustomError) return reject(error);
            console.error("Error in removeOrderItemService:", error);
            return reject(new CustomError("Failed to remove order item.", INTERNAL_SERVER));
        }
    })
);

// Delete Order Service (Soft delete by cancellation is preferred)
export const deleteOrderService = async (orderId) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            await Validator.isText(orderId);
            const order = await prisma.orders.findUnique({ where: { id: orderId } });
            if (!order) return reject(new CustomError(`Order with ID ${orderId} not found.`, NOT_FOUND));

            // Usually, orders are cancelled or archived, not hard-deleted, especially if paid.
            // For this example, if status is 'pending' or 'cancelled' maybe allow hard delete.
            if (!['pending', 'cancelled', 'refunded'].includes(order.status) && order.payment_status === 'paid') {
                return reject(new CustomError("Cannot delete a processed or paid order. Consider cancelling or refunding.", BAD_REQUEST));
            }

            await prisma.$transaction(async (tx) => {
                await tx.order_item_modifiers.deleteMany({ where: { order_item: { order_id: orderId } } }); // If you have these
                await tx.order_item_addons.deleteMany({ where: { order_item: { order_id: orderId } } });    // If you have these
                await tx.order_items.deleteMany({ where: { order_id: orderId } });
                await tx.orders.delete({ where: { id: orderId } });
            });

            return resolve({ message: "Order and its items deleted successfully." });
        } catch (error) {
            if (error instanceof CustomError) return reject(error);
            console.error("Error deleting order:", error);
            return reject(new CustomError("Failed to delete order.", INTERNAL_SERVER));
        }
    })
);