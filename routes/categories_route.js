import express from "express";
import { createCategoryController, deleteCategoryController, getCategoriesController, getCategoryController } from "../controllers/category_controller.js";

const router = express.Router();

router.get('/categories', getCategoriesController)
router.get('/categories/:id', getCategoryController)
router.post('/categories', createCategoryController)
router.delete('/categories/:id', deleteCategoryController)


export default router