import express from "express";
import {
    createDiscountController,
    getAllDiscountsController,
    getDiscountByIdController,
    updateDiscountController,
    deleteDiscountController
} from "../controllers/discount_controller.js";

const router = express.Router();

router.post('/discounts', createDiscountController);
router.get('/discounts', getAllDiscountsController);
router.get('/discounts/:id', getDiscountByIdController);
router.put('/discounts/:id', updateDiscountController);
router.delete('/discounts/:id', deleteDiscountController);

export default router;