import {
    createProductService,
    getAllProductsService,
    getProductByIdService,
    updateProductService,
    deleteProductService
} from "../services/product_service.js";
import asyncWrapper from "../utils/wrappers/async_wrapper.js"; // Assuming your asyncWrapper is here
import { CREATED } from "../utils/status_codes.js";

export const createProductController = asyncWrapper(
    async (req, res) => {
        // req.body will contain text fields
        // req.file will contain the uploaded image (if using multer with .single('image'))
        const product = await createProductService(req.body, req.file);
        return res.status(CREATED).json(product);
    }
);

export const getAllProductsController = asyncWrapper(
    async (req, res) => {
        const products = await getAllProductsService(req.query); // Pass query params for filtering/pagination
        return res.json(products);
    }
);

export const getProductByIdController = asyncWrapper(
    async (req, res) => {
        const { id } = req.params;
        const product = await getProductByIdService(id);
        return res.json(product);
    }
);

export const updateProductController = asyncWrapper(
    async (req, res) => {
        const { id } = req.params;
        const updatedProduct = await updateProductService(id, req.body, req.file);
        return res.json(updatedProduct);
    }
);

export const deleteProductController = asyncWrapper(
    async (req, res) => {
        const { id } = req.params;
        const result = await deleteProductService(id);
        return res.json(result);
    }
);