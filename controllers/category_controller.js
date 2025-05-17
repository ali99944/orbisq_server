import asyncWrapper from '../lib/wrappers/async_wrapper.js';
import { 
    createCategory,
    updateCategory,
    getCategoryById,
    getCategoryBySlug,
    getShopCategories,
    deleteCategory,
    updateCategoryImage,
    updateCategoryStatus
} from '../services/product_category_service.js';


export const createCategoryController = asyncWrapper(
    async (req, res) => {
        const categoryData = req.body;
        const imagePath = req.file?.path;
        const shop_id = +req.portal.shopId
        const category = await createCategory(categoryData, imagePath, shop_id);
        return res.status(201).json(category);
    }
);

export const updateCategoryController = asyncWrapper(
    async (req, res) => {
        const { id } = req.params;
        const updateData = req.body;
        const imagePath = req.file?.path;
        const category = await updateCategory(parseInt(id), updateData, imagePath);
        return res.json(category);
    }
);

export const getCategoryController = asyncWrapper(
    async (req, res) => {
        const { id } = req.params;
        const category = await getCategoryById(parseInt(id));
        return res.json(category);
    }
);

export const getCategoryBySlugController = asyncWrapper(
    async (req, res) => {
        const { slug, shopId } = req.params;
        const category = await getCategoryBySlug(slug, parseInt(shopId));
        return res.json(category);
    }
);

export const getShopCategoriesController = asyncWrapper(
    async (req, res) => {
        const { shopId } = req.params;
        const categories = await getShopCategories(parseInt(shopId), req.query);
        return res.json(categories);
    }
);

export const deleteCategoryController = asyncWrapper(
    async (req, res) => {
        const { id } = req.params;
        await deleteCategory(parseInt(id));
        return res.json({ success: true });
    }
);

export const updateCategoryImageController = asyncWrapper(
    async (req, res) => {
        const { id } = req.params;
        const imagePath = req.file.path;
        const category = await updateCategoryImage(parseInt(id), imagePath);
        return res.json(category);
    }
);

export const updateCategoryStatusController = asyncWrapper(
    async (req, res) => {
        const { id } = req.params;
        const { is_active } = req.body;
        const category = await updateCategoryStatus(parseInt(id), is_active);
        return res.json(category);
    }
);