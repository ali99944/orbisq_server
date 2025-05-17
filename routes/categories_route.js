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
import { authenticatePortal } from "../middlewares/shop_auth_middleware.js";

const router = express.Router();
const categoryImageUpload = createMulterStorage('categories', 'images').single('image');

// Public routes
router.get('/shops/:shopId/categories', getShopCategoriesController);
router.get('/shops/:shopId/categories/:slug', getCategoryBySlugController);

// Owner-protected routes
router.post('/categories', authenticatePortal, categoryImageUpload, createCategoryController);
router.get('/categories/:id', getCategoryController);
router.put('/categories/:id', categoryImageUpload, updateCategoryController);
router.patch('/categories/:id/image', categoryImageUpload, updateCategoryImageController);
router.delete('/categories/:id', deleteCategoryController);

router.post('/categories/:id/toggle-status', updateCategoryStatusController);

export default router;