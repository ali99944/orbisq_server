import { CREATED, OK } from "../lib/status_codes.js";
import asyncWrapper from "../lib/wrappers/async_wrapper.js";
import {
    createOrderService,
    getAllOrdersService,
    getOrderByIdService,
    updateOrderStatusService,
    updateOrderGeneralInfoService,
    addItemsToOrderService, // This is specifically for merged/existing orders
    updateOrderItemService,
    removeOrderItemService,
    deleteOrderService,
    updateOrderPaymentService,
    getOrdersByPhoneService
} from "../services/order_service.js";
import { SOCKET_EVENTS } from "../utils/socket_constants.js";

import { io } from '../server.js'


export const createOrderController = asyncWrapper(
    async (req, res) => {
        const { items, ...orderData } = req.body; // Separate items from other order data
        const order = await createOrderService(orderData, items);
        io.emit(SOCKET_EVENTS.ORDER_CREATED, order)
        return res.status(CREATED).json(order);
    }
);

export const getAllOrdersController = asyncWrapper(
    async (req, res) => {
        const shop_id = req.portal.shopId
        const orders = await getAllOrdersService(req.query, +shop_id);
        return res.json(orders);
    }
);

export const getOrderByIdController = asyncWrapper(
    async (req, res) => {
        const { orderId } = req.params;
        const order = await getOrderByIdService(orderId);
        return res.json(order);
    }
);

// Controller to add items to an *existing* order (used by merge logic or explicitly)
export const addItemsToOrderController = asyncWrapper(
    async (req, res) => {
        const { orderId } = req.params;
        const { items, ...orderUpdateData } = req.body; // items to add, and potentially other order fields to update
        const updatedOrder = await addItemsToOrderService(orderId, items, orderUpdateData);
        io.emit(SOCKET_EVENTS.ORDER_UPDATED, updatedOrder)
        return res.status(OK).json(updatedOrder);
    }
);

const getCustomerPhone = (order) => {
    switch(order.order_type) {
        case 'dine_in':
            return order.customer_phone
        case 'takeaway':
            return order.takeaway_customer_phone
        case 'delivery':
            return order.delivery_customer_phone

        default:
            return null
    }
}

export const updateOrderStatusController = asyncWrapper(
    async (req, res) => {
        const { orderId } = req.params;
        const { status, ...details } = req.body; // status and other details like cancellation_reason
        const updatedOrder = await updateOrderStatusService(orderId, status, details);
        io.emit(SOCKET_EVENTS.ORDER_UPDATED, {
            order: updatedOrder,
            phone_number: getCustomerPhone(updatedOrder),
            shop_id: updatedOrder.shop_id
        })
        return res.json(updatedOrder);
    }
);

export const updateOrderGeneralInfoController = asyncWrapper(
    async (req, res) => {
        const { orderId } = req.params;
        const updatedOrder = await updateOrderGeneralInfoService(orderId, req.body);
        return res.json(updatedOrder);
    }
);

export const updateOrderItemController = asyncWrapper(
    async (req, res) => {
        const { orderId, itemId } = req.params; // orderId might not be strictly needed if itemId is globally unique
        // For consistency and ensuring item belongs to order, you could use orderId too.
        const updatedOrder = await updateOrderItemService(itemId, req.body);
        return res.json(updatedOrder); // Returns the whole updated order
    }
);

export const removeOrderItemController = asyncWrapper(
    async (req, res) => {
        const { orderId, itemId } = req.params;
        const updatedOrder = await removeOrderItemService(itemId);
        return res.json(updatedOrder); // Returns the whole updated order
    }
);

export const deleteOrderController = asyncWrapper(
    async (req, res) => {
        const { orderId } = req.params;
        const result = await deleteOrderService(orderId);
        return res.json(result);
    }
);

export const updateOrderPaymentController = asyncWrapper(
    async (req, res) => {
        const { orderId } = req.params;
        const updatedOrder = await updateOrderPaymentService(orderId, req.body);
        return res.json(updatedOrder);
    }
);

export const getOrdersByPhoneController = asyncWrapper(
    async (req, res) => {
        const { phoneNumber } = req.params;
        const orders = await getOrdersByPhoneService(phoneNumber);
        return res.json(orders);
    }
);