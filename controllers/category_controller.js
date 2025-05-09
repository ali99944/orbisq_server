import asyncWrapper from "../lib/wrappers/async_wrapper.js";
import { createCategory, getShopCategories } from "../services/product_category_service.js";

export const getCategoriesController = asyncWrapper(
    async (req, res) => {
        const categories = await getShopCategories();
        res.json(categories)
    }
);

export const getCategoryController = asyncWrapper(
    async (req, res) => {
        const category = await getShopCategories(req.params.id);
        res.json(category)
    }
);

export const updateCategoryController = asyncWrapper(
    async (req, res) => {
        const category = await updateCategory(req.params.id, req.body);
        res.json(category)
    }
)

export const createCategoryController = asyncWrapper(
    async (req, res) => {
        const category = await createCategory(req.body);
        res.json(category);
    }
);

export const deleteCategoryController = asyncWrapper(
    async (req, res) => {
        const category = await deleteCategory(req.params.id);
        res.json(category);
    }
);