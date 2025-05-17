import express from "express";
import {
    getDashboardOverviewController,
    getTopDishesController,
    getTopCategoriesController
} from "../controllers/dashboard_controller.js";
import { authenticatePortal } from "../middlewares/shop_auth_middleware.js";

const router = express.Router();

// Dashboard routes
router.get('/dashboard/overview', authenticatePortal, getDashboardOverviewController);
router.get('/dashboard/top-dishes', authenticatePortal, getTopDishesController);
router.get('/dashboard/top-categories', authenticatePortal, getTopCategoriesController);

export default router;