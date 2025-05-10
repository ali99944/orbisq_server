import prisma, { Prisma } from "../lib/prisma.js";
import CustomError from "../utils/custom_error.js";
import { BAD_REQUEST, NOT_FOUND, INTERNAL_SERVER_ERROR, CONFLICT } from "../utils/status_codes.js";
import promiseAsyncWrapper from "../utils/wrappers/promise_async_wrapper.js";
import Validator from "../utils/validator.js";

// --- Re-using Helper Parsers from above or a common utility ---
const parseIntOrNull = (value) => { /* ... */ };
const parseDateOrNull = (value) => { /* ... */ };
const parseBoolean = (value, defaultValue = undefined) => { /* ... */ }; // Defined in desk_service.js

const parseDecimalOrNull = (value) => {
    if (value === null || value === undefined || value === '') return null;
    try {
        // Ensure Prisma.Decimal is correctly available
        return new Prisma.Decimal(value.toString()); // Convert to string first for safety
    } catch (e) {
        // console.error("Failed to parse Decimal:", e);
        return null; // Or throw specific validation error
    }
};
// --- End Helper Parsers ---


const DISCOUNT_TYPE_ENUM = ['percentage', 'fixed_amount_off', 'fixed_price', 'free_shipping'];
const CUSTOMER_ELIGIBILITY_ENUM = ['all', 'specific_groups', 'specific_customers', 'first_time_buyers', 'returning_customers'];

export const createDiscountService = async (discountData) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            await Validator.validateNotNull({
                name: discountData.name,
                type: discountData.type,
                value: discountData.value,
                shop_id: discountData.shop_id,
            });

            await Validator.isText(discountData.name);
            await Validator.isEnum(discountData.type, DISCOUNT_TYPE_ENUM);
            // Value validation depends on type, for now, just ensure it's a number-like for Decimal
            if (isNaN(parseFloat(discountData.value))) return reject(new CustomError("Discount value must be a number.", BAD_REQUEST));
            
            const shopId = parseInt(discountData.shop_id);
            await Validator.isNumber(shopId);

            const shopExists = await prisma.shops.findUnique({ where: { id: shopId } });
            if (!shopExists) return reject(new CustomError(`Shop with ID ${shopId} not found.`, NOT_FOUND));

            if (discountData.coupon_code) {
                await Validator.isText(discountData.coupon_code);
                const existingCouponCode = await prisma.discounts.findUnique({ where: { coupon_code: discountData.coupon_code }});
                if(existingCouponCode) return reject(new CustomError(`Coupon code ${discountData.coupon_code} already exists.`, CONFLICT));
            }
            if (discountData.customer_eligibility) {
                await Validator.isEnum(discountData.customer_eligibility, CUSTOMER_ELIGIBILITY_ENUM);
            }
            if (discountData.customer_ids) {
                await Validator.isArray(discountData.customer_ids);
                for(const custId of discountData.customer_ids){
                    await Validator.isNumber(parseInt(custId)); // Ensure each ID is a number
                }
            }
            if (discountData.min_order) if (isNaN(parseFloat(discountData.min_order))) return reject(new CustomError("Min order must be a number.", BAD_REQUEST));
            if (discountData.max_discount) if (isNaN(parseFloat(discountData.max_discount))) return reject(new CustomError("Max discount must be a number.", BAD_REQUEST));
            if (discountData.usage_limit) await Validator.isNumber(parseInt(discountData.usage_limit));


            const dataToCreate = {
                name: discountData.name,
                description: discountData.description || null,
                type: discountData.type,
                value: parseDecimalOrNull(discountData.value),
                is_active: parseBoolean(discountData.is_active, true),
                start_date: parseDateOrNull(discountData.start_date),
                end_date: parseDateOrNull(discountData.end_date),
                coupon_code: discountData.coupon_code || null,
                min_order: parseDecimalOrNull(discountData.min_order),
                max_discount: parseDecimalOrNull(discountData.max_discount),
                usage_limit: parseIntOrNull(discountData.usage_limit),
                times_used: 0, // Default
                customer_eligibility: discountData.customer_eligibility || 'all',
                customer_ids: discountData.customer_ids ? discountData.customer_ids.map(id => parseInt(id)) : [],
                shop_id: shopId,
            };

            if (dataToCreate.value === null) return reject(new CustomError("Invalid discount value provided.", BAD_REQUEST));
            if (dataToCreate.min_order === null && discountData.min_order) return reject(new CustomError("Invalid min_order value provided.", BAD_REQUEST));
            if (dataToCreate.max_discount === null && discountData.max_discount) return reject(new CustomError("Invalid max_discount value provided.", BAD_REQUEST));


            const discount = await prisma.discounts.create({ data: dataToCreate });
            return resolve(discount);

        } catch (error) {
            if (error instanceof CustomError) return reject(error);
            console.error("Error in createDiscountService:", error);
             if (error.code === 'P2002' && error.meta?.target?.includes('coupon_code')) {
                 return reject(new CustomError(`Coupon code ${discountData.coupon_code} already exists.`, CONFLICT));
            }
            return reject(new CustomError("Failed to create discount.", INTERNAL_SERVER_ERROR));
        }
    })
);

export const getAllDiscountsService = async (queryParams) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            const { 
                shop_id, 
                type, 
                is_active, 
                page = 1, 
                limit = 10, 
                sortBy = 'created_at', 
                sortOrder = 'desc',
                search // for name or coupon_code
            } = queryParams;

            const filters = {};
            if (shop_id) filters.shop_id = parseInt(shop_id);
            if (type) {
                await Validator.isEnum(type, DISCOUNT_TYPE_ENUM);
                filters.type = type;
            }
            if (is_active !== undefined) filters.is_active = parseBoolean(is_active);
            
            if (search) {
                filters.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { coupon_code: { contains: search, mode: 'insensitive' } }
                ];
            }

            const discounts = await prisma.discounts.findMany({
                where: filters,
                include: { shop: true },
                orderBy: { [sortBy]: sortOrder },
                skip: (parseInt(page) - 1) * parseInt(limit),
                take: parseInt(limit),
            });
            const totalDiscounts = await prisma.discounts.count({ where: filters });

            return resolve({
                data: discounts,
                meta: {
                    total: totalDiscounts,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(totalDiscounts / parseInt(limit)),
                },
            });
        } catch (error) {
            if (error instanceof CustomError) return reject(error);
            console.error("Error in getAllDiscountsService:", error);
            return reject(new CustomError("Failed to retrieve discounts.", INTERNAL_SERVER_ERROR));
        }
    })
);

export const getDiscountByIdService = async (discountId) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            const id = parseInt(discountId);
            await Validator.isNumber(id);

            const discount = await prisma.discounts.findUnique({
                where: { id },
                include: { shop: true /* , products: true, desks: true */ }, // Include relations if needed
            });

            if (!discount) {
                return reject(new CustomError(`Discount with ID ${id} not found.`, NOT_FOUND));
            }
            return resolve(discount);
        } catch (error) {
            if (error instanceof CustomError) return reject(error);
            console.error("Error in getDiscountByIdService:", error);
            return reject(new CustomError("Failed to retrieve discount.", INTERNAL_SERVER_ERROR));
        }
    })
);

export const updateDiscountService = async (discountId, updateData) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            const id = parseInt(discountId);
            await Validator.isNumber(id);

            const existingDiscount = await prisma.discounts.findUnique({ where: { id } });
            if (!existingDiscount) {
                return reject(new CustomError(`Discount with ID ${id} not found to update.`, NOT_FOUND));
            }

            const dataToUpdate = {};

            if (updateData.name !== undefined) {
                await Validator.isText(updateData.name);
                dataToUpdate.name = updateData.name;
            }
            if (updateData.description !== undefined) dataToUpdate.description = updateData.description === '' ? null : updateData.description;
            if (updateData.type !== undefined) {
                await Validator.isEnum(updateData.type, DISCOUNT_TYPE_ENUM);
                dataToUpdate.type = updateData.type;
            }
            if (updateData.value !== undefined) {
                 if (isNaN(parseFloat(updateData.value))) return reject(new CustomError("Discount value must be a number.", BAD_REQUEST));
                 dataToUpdate.value = parseDecimalOrNull(updateData.value);
                 if (dataToUpdate.value === null) return reject(new CustomError("Invalid discount value provided for update.", BAD_REQUEST));
            }
            if (updateData.is_active !== undefined) dataToUpdate.is_active = parseBoolean(updateData.is_active);
            if (updateData.start_date !== undefined) dataToUpdate.start_date = parseDateOrNull(updateData.start_date);
            if (updateData.end_date !== undefined) dataToUpdate.end_date = parseDateOrNull(updateData.end_date);
            
            if (updateData.coupon_code !== undefined) {
                if(updateData.coupon_code === null || updateData.coupon_code === ''){
                    dataToUpdate.coupon_code = null;
                } else {
                    await Validator.isText(updateData.coupon_code);
                    if (updateData.coupon_code !== existingDiscount.coupon_code) {
                        const conflictingCode = await prisma.discounts.findUnique({ where: { coupon_code: updateData.coupon_code } });
                        if (conflictingCode) return reject(new CustomError(`Coupon code ${updateData.coupon_code} is already in use.`, CONFLICT));
                    }
                    dataToUpdate.coupon_code = updateData.coupon_code;
                }
            }

            if (updateData.min_order !== undefined) {
                if (updateData.min_order === null || updateData.min_order === '') {
                     dataToUpdate.min_order = null;
                } else {
                    if (isNaN(parseFloat(updateData.min_order))) return reject(new CustomError("Min order must be a number.", BAD_REQUEST));
                    dataToUpdate.min_order = parseDecimalOrNull(updateData.min_order);
                    if (dataToUpdate.min_order === null) return reject(new CustomError("Invalid min_order value provided for update.", BAD_REQUEST));
                }
            }
            if (updateData.max_discount !== undefined) {
                // similar logic for max_discount
                if (updateData.max_discount === null || updateData.max_discount === '') {
                     dataToUpdate.max_discount = null;
                } else {
                    if (isNaN(parseFloat(updateData.max_discount))) return reject(new CustomError("Max discount must be a number.", BAD_REQUEST));
                    dataToUpdate.max_discount = parseDecimalOrNull(updateData.max_discount);
                    if (dataToUpdate.max_discount === null) return reject(new CustomError("Invalid max_discount value provided for update.", BAD_REQUEST));
                }
            }
            if (updateData.usage_limit !== undefined) dataToUpdate.usage_limit = parseIntOrNull(updateData.usage_limit);
            if (updateData.customer_eligibility !== undefined) {
                await Validator.isEnum(updateData.customer_eligibility, CUSTOMER_ELIGIBILITY_ENUM);
                dataToUpdate.customer_eligibility = updateData.customer_eligibility;
            }
            if (updateData.customer_ids !== undefined) {
                await Validator.isArray(updateData.customer_ids);
                 dataToUpdate.customer_ids = updateData.customer_ids.map(cid => {
                    const parsedCid = parseInt(cid);
                    if(isNaN(parsedCid)) throw new CustomError(`Invalid customer ID in list: ${cid}`, BAD_REQUEST);
                    return parsedCid;
                 });
            }
             if (updateData.shop_id !== undefined) {
                const shopId = parseInt(updateData.shop_id);
                await Validator.isNumber(shopId);
                const shopExists = await prisma.shops.findUnique({ where: { id: shopId } });
                if (!shopExists) return reject(new CustomError(`Shop with ID ${shopId} not found.`, NOT_FOUND));
                dataToUpdate.shop_id = shopId;
            }


            if (Object.keys(dataToUpdate).length === 0) {
                return reject(new CustomError("No valid fields provided for update.", BAD_REQUEST));
            }
            dataToUpdate.updated_at = new Date();

            const updatedDiscount = await prisma.discounts.update({
                where: { id },
                data: dataToUpdate,
            });
            return resolve(updatedDiscount);

        } catch (error) {
            if (error instanceof CustomError) return reject(error);
            console.error("Error in updateDiscountService:", error);
             if (error.code === 'P2002' && error.meta?.target?.includes('coupon_code')) {
                 return reject(new CustomError(`Update failed: Coupon code is already in use.`, CONFLICT));
            }
            return reject(new CustomError("Failed to update discount.", INTERNAL_SERVER_ERROR));
        }
    })
);

export const deleteDiscountService = async (discountId) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            const id = parseInt(discountId);
            await Validator.isNumber(id);

            const existingDiscount = await prisma.discounts.findUnique({ where: { id } });
            if (!existingDiscount) {
                return reject(new CustomError(`Discount with ID ${id} not found to delete.`, NOT_FOUND));
            }

            // Check if discount is actively used by products or desks or orders (order_items)
            const productUsage = await prisma.products.count({ where: { discount_id: id }});
            if(productUsage > 0) return reject(new CustomError(`Cannot delete discount. It is used by ${productUsage} product(s).`, BAD_REQUEST));
            
            const deskUsage = await prisma.desks.count({ where: { discount_id: id }});
            if(deskUsage > 0) return reject(new CustomError(`Cannot delete discount. It is used by ${deskUsage} desk(s).`, BAD_REQUEST));

            const orderItemUsage = await prisma.order_items.count({ where: { discount_id: id }}); // Assuming direct discount_id on order_items
             if(orderItemUsage > 0) return reject(new CustomError(`Cannot delete discount. It is used in ${orderItemUsage} order item(s).`, BAD_REQUEST));


            await prisma.discounts.delete({ where: { id } });
            return resolve({ message: "Discount deleted successfully." });

        } catch (error) {
            if (error instanceof CustomError) return reject(error);
            console.error("Error in deleteDiscountService:", error);
             if (error.code === 'P2003') {
                 return reject(new CustomError("Cannot delete discount. It is referenced by other records.", BAD_REQUEST));
            }
            return reject(new CustomError("Failed to delete discount.", INTERNAL_SERVER_ERROR));
        }
    })
);