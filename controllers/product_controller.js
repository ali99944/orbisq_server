import { CREATED } from "../lib/status_codes.js";
import asyncWrapper from "../lib/wrappers/async_wrapper.js";
import {
    createProductService,
    getAllProductsService,
    getProductByIdService,
    updateProductService,
    deleteProductService
} from "../services/product_service.js";

export const createProductController = asyncWrapper(
    async (req, res) => {
        
        const shop_id = +req.body.shop_id;
        const product = await createProductService(req.body, req.file, shop_id);
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