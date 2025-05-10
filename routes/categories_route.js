import express from "express";
import {
    createCategoryController,
    updateCategoryController,
    getCategoryController,
    getCategoryBySlugController,
    getShopCategoriesController,
    deleteCategoryController,
    updateCategoryImageController,
    updateCategoryStatusController
} from "../controllers/category_controller.js";
import { createMulterStorage } from "../lib/multer_storage.js";
import { authenticateOwner } from "../middlewares/shop_auth_middleware.js";

const router = express.Router();
const categoryImageUpload = createMulterStorage('categories', 'images').single('image');

// Public routes
router.get('/shops/:shopId/categories', getShopCategoriesController);
router.get('/shops/:shopId/categories/:slug', getCategoryBySlugController);

// Owner-protected routes
router.post('/categories', authenticateOwner, categoryImageUpload, createCategoryController);
router.get('/categories/:id', authenticateOwner, getCategoryController);
router.put('/categories/:id', authenticateOwner, categoryImageUpload, updateCategoryController);
router.patch('/categories/:id/status', authenticateOwner, updateCategoryStatusController);
router.patch('/categories/:id/image', authenticateOwner, categoryImageUpload, updateCategoryImageController);
router.delete('/categories/:id', authenticateOwner, deleteCategoryController);

export default router;