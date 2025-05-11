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
    deleteOrderService
} from "../services/order_service.js";


export const createOrderController = asyncWrapper(
    async (req, res) => {
        const { items, ...orderData } = req.body; // Separate items from other order data
        const order = await createOrderService(orderData, items);
        return res.status(CREATED).json(order);
    }
);

export const getAllOrdersController = asyncWrapper(
    async (req, res) => {
        const orders = await getAllOrdersService(req.query);
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
        return res.status(OK).json(updatedOrder);
    }
);


export const updateOrderStatusController = asyncWrapper(
    async (req, res) => {
        const { orderId } = req.params;
        const { status, ...details } = req.body; // status and other details like cancellation_reason
        const updatedOrder = await updateOrderStatusService(orderId, status, details);
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