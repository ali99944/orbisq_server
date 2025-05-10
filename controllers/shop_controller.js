import asyncWrapper from '../lib/wrappers/async_wrapper.js';
import { 
    createShop,
    updateShop,
    getShopById,
    getShopBySlug,
    getAllShops,
    deleteShop,
    updateShopLogo,
    updateShopCover
} from '../services/shop_service.js';

export const createShopController = asyncWrapper(
    async (req, res) => {
        const shopData = req.body;
        const { id: owner_id } = req.params;
        shopData.shop_owner_id = owner_id;
        const shop = await createShop(shopData);
        return res.status(201).json(shop);
    }
);

export const updateShopController = asyncWrapper(
    async (req, res) => {
        const { id } = req.params;
        const updateData = req.body;
        const shop = await updateShop(parseInt(id), updateData);
        return res.json(shop);
    }
);

export const getShopController = asyncWrapper(
    async (req, res) => {
        const { id } = req.params;
        const shop = await getShopById(parseInt(id));
        return res.json(shop);
    }
);

export const getShopBySlugController = asyncWrapper(
    async (req, res) => {
        const { slug } = req.params;
        const shop = await getShopBySlug(slug);
        return res.json(shop);
    }
);

export const getAllShopsController = asyncWrapper(
    async (req, res) => {
        const shops = await getAllShops(req.query);
        return res.json(shops);
    }
);

export const deleteShopController = asyncWrapper(
    async (req, res) => {
        const { id } = req.params;
        await deleteShop(parseInt(id));
        return res.json({ success: true });
    }
);

export const updateShopLogoController = asyncWrapper(
    async (req, res) => {
        const { id } = req.params;
        const logoPath = req.file.path;
        const shop = await updateShopLogo(parseInt(id), logoPath);
        return res.json(shop);
    }
);

export const updateShopCoverController = asyncWrapper(
    async (req, res) => {
        const { id } = req.params;
        const coverPath = req.file.path;
        const shop = await updateShopCover(parseInt(id), coverPath);
        return res.json(shop);
    }
);