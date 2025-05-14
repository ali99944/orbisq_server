import express from "express";
import {
    createOrderController,
    getAllOrdersController,
    getOrderByIdController,
    addItemsToOrderController,
    updateOrderStatusController,
    updateOrderGeneralInfoController,
    updateOrderItemController,
    removeOrderItemController,
    deleteOrderController
} from "../controllers/order_controller.js";

const router = express.Router();

// Order level routes
router.post('/orders', createOrderController);
router.get('/orders', getAllOrdersController);
router.get('/orders/:orderId', getOrderByIdController);
router.put('/orders/:orderId/status', updateOrderStatusController); // Specific for status
router.put('/orders/:orderId', updateOrderGeneralInfoController); // For other fields
router.delete('/orders/:orderId', deleteOrderController);


// Routes for adding items to an EXISTING order (e.g. customer adds more to dine-in)
router.post('/orders/:orderId/items', addItemsToOrderController);

// Order Item specific routes (nested under an order)
// These operate on an item within a specific order.
router.put('/orders/:orderId/items/:itemId', updateOrderItemController);
router.delete('/orders/:orderId/items/:itemId', removeOrderItemController);


export default router;