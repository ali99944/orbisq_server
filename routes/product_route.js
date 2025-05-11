import express from "express";
import {
    createProductController,
    getAllProductsController,
    getProductByIdController,
    updateProductController,
    deleteProductController
} from "../controllers/product_controller.js";
import { createMulterStorage } from "../lib/multer_storage.js"; // Your multer setup
import { authenticatePortal } from "../middlewares/shop_auth_middleware.js";

const router = express.Router();

// Configure multer for product images, stored in 'uploads/images/products'
const productUpload = createMulterStorage('images/products', 'product').single('image');
// Note: 'image' is the field name expected in the form-data

router.post('/products', authenticatePortal, productUpload, createProductController);
router.get('/products', getAllProductsController);
router.get('/products/:id', getProductByIdController);
router.put('/products/:id', productUpload, updateProductController);
router.delete('/products/:id', deleteProductController);

export default router;