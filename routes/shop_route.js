import express from "express";
import {
    createShopController,
    updateShopController,
    getShopController,
    getShopBySlugController,
    getAllShopsController,
    deleteShopController,
    updateShopLogoController,
    updateShopCoverController
} from "../controllers/shop_controller.js";
import { createMulterStorage } from "../lib/multer_storage.js";

const router = express.Router();

// Shop CRUD routesim
router.post('/shop-owners/:id/shops', createShopController);
router.get('/shops', getAllShopsController);
router.get('/shops/:id', getShopController);
router.get('/shops/slug/:slug', getShopBySlugController);
router.put('/shops/:id', updateShopController);
router.delete('/shops/:id', deleteShopController);

// Shop media routes
router.post('/shops/:id/logo', createMulterStorage('shops', 'logos').single('image'), updateShopLogoController);
router.post('/shops/:id/cover', createMulterStorage('shops', 'covers').single('image'), updateShopCoverController);

export default router;