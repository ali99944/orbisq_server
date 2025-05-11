import { generateReferenceCode } from "../lib/generator.js";
import prisma from "../lib/prisma.js";
import { BAD_REQUEST, NOT_FOUND, INTERNAL_SERVER } from "../lib/status_codes.js";
import Validator from "../lib/validator.js";
import promiseAsyncWrapper from "../lib/wrappers/promise_async_wrapper.js";
import CustomError from "../utils/custom_error.js";

// Helper to parse float or return null
const parseFloatOrNull = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
};

// Helper to parse int or return null
const parseIntOrNull = (value) => {
    const num = parseInt(value, 10);
    return isNaN(num) ? null : num;
};


export const createProductService = async (productData, file, shop_id) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            // --- Validation ---
            await Validator.validateNotNull({
                name: productData.name,
                product_category_id: productData.product_category_id,
                shop_id: +shop_id, // Assuming shop_id is mandatory
                // price: productData.price // Price might be optional depending on pricing_type
            });

            await Validator.isText(productData.name);
            await Validator.isNumber(parseInt(productData.product_category_id));
            // await Validator.isNumber(parseInt(productData.shop_id));

            if (productData.price) await Validator.isNumber(parseFloat(productData.price));
            if (productData.cost_price) await Validator.isNumber(parseFloat(productData.cost_price));
            if (productData.stock) await Validator.isNumber(parseInt(productData.stock));
            if (productData.low_stock_threshold) await Validator.isNumber(parseInt(productData.low_stock_threshold));
            if (productData.sort_order) await Validator.isNumber(parseInt(productData.sort_order));
            if (productData.calories) await Validator.isNumber(parseFloat(productData.calories));
            if (productData.prepare_time) await Validator.isNumber(parseInt(productData.prepare_time));
            if (productData.protein) await Validator.isNumber(parseFloat(productData.protein));
            if (productData.carbohydrates) await Validator.isNumber(parseFloat(productData.carbohydrates));
            if (productData.fat) await Validator.isNumber(parseFloat(productData.fat));

            if (productData.description) await Validator.isText(productData.description);
            if (productData.short_description) await Validator.isText(productData.short_description);
            if (productData.allergens) await Validator.isText(productData.allergens);
            if (productData.sku_number) await Validator.isText(productData.sku_number);
            if (productData.barcode) await Validator.isText(productData.barcode);

            if (productData.pricing_type) {
                await Validator.isEnum(productData.pricing_type, ['fixed', 'dynamic']);
            }
            if (productData.sales_unit_type) {
                await Validator.isEnum(productData.sales_unit_type, ['piece', 'weight', 'volume', 'length']);
            }
            if (productData.cost_calculation_unit) {
                await Validator.isEnum(productData.cost_calculation_unit, ['ingredient', 'operation', 'time_based']);
            }

            // Check if related entities exist
            const categoryExists = await prisma.product_categories.findUnique({
                where: { id: parseInt(productData.product_category_id) }
            });
            if (!categoryExists) {
                return reject(new CustomError(`Product category with ID ${productData.product_category_id} not found.`, NOT_FOUND));
            }

            const shopExists = await prisma.shops.findUnique({
                where: { id: parseInt(+shop_id) }
            });
            if (!shopExists) {
                return reject(new CustomError(`Shop with ID ${+shop_id} not found.`, NOT_FOUND));
            }

            if (productData.tax_id) {
                const taxExists = await prisma.taxes.findUnique({ where: { id: parseInt(productData.tax_id) } });
                if (!taxExists) return reject(new CustomError(`Tax with ID ${productData.tax_id} not found.`, NOT_FOUND));
            }
            if (productData.discount_id) {
                const discountExists = await prisma.discounts.findUnique({ where: { id: parseInt(productData.discount_id) } });
                if (!discountExists) return reject(new CustomError(`Discount with ID ${productData.discount_id} not found.`, NOT_FOUND));
            }

            // --- Prepare Data ---
            const dataToCreate = {
                name: productData.name,
                description: productData.description || null,
                short_description: productData.short_description || null,
                calories: parseFloatOrNull(productData.calories),
                prepare_time: parseIntOrNull(productData.prepare_time),
                protein: parseFloatOrNull(productData.protein),
                carbohydrates: parseFloatOrNull(productData.carbohydrates),
                fat: parseFloatOrNull(productData.fat),
                allergens: productData.allergens || null,
                
                product_category_id: parseInt(productData.product_category_id),
                shop_id: parseInt(+shop_id),

                tax_id: productData.tax_id ? parseInt(productData.tax_id) : null,
                discount_id: productData.discount_id ? parseInt(productData.discount_id) : null,

                is_active: productData.is_active !== undefined ? Boolean(JSON.parse(productData.is_active)) : true,
                is_featured: productData.is_featured !== undefined ? Boolean(JSON.parse(productData.is_featured)) : false,
                is_retail: productData.is_retail !== undefined ? Boolean(JSON.parse(productData.is_retail)) : false,
                
                sku_number: productData.sku_number || null,
                reference_code: generateReferenceCode('PROD'),
                barcode: productData.barcode || null,

                price: parseFloatOrNull(productData.price),
                cost_price: parseFloatOrNull(productData.cost_price),
                pricing_type: productData.pricing_type || 'fixed',
                sales_unit_type: productData.sales_unit_type || 'piece',
                cost_calculation_unit: productData.cost_calculation_unit || 'ingredient',

                stock: productData.stock ? parseInt(productData.stock) : 0,
                low_stock_threshold: productData.low_stock_threshold ? parseInt(productData.low_stock_threshold) : 5,
                sort_order: productData.sort_order ? parseInt(productData.sort_order) : 0,
                
                has_variants: productData.has_variants !== undefined ? Boolean(JSON.parse(productData.has_variants)) : false,
            };

            if (file) {
                await Validator.requiredSingleImage(file); // Validates if 'image' fieldname
                dataToCreate.image = file.path; // Store path from multer
            }

            const product = await prisma.products.create({
                data: dataToCreate
            });
            return resolve(product);

        } catch (error) {
            if (error instanceof CustomError) {
                return reject(error);
            }
            console.error("Error in createProductService:", error);
            return reject(new CustomError("Failed to create product.", INTERNAL_SERVER));
        }
    })
);

export const getAllProductsService = async (queryParams) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            const products = await prisma.products.findMany({
                include: {
                    product_category: true
                }
            })
            return resolve(products);
            // const { 
            //     shop_id, 
            //     category_id, 
            //     is_featured, 
            //     is_active, 
            //     page = 1, 
            //     limit = 10, 
            //     sortBy = 'created_at', 
            //     sortOrder = 'desc',
            //     search // for name, sku, barcode
            // } = queryParams;

            // const filters = {};
            // if (shop_id) filters.shop_id = parseInt(shop_id);
            // if (category_id) filters.product_category_id = parseInt(category_id);
            // if (is_featured !== undefined) filters.is_featured = Boolean(JSON.parse(is_featured));
            // if (is_active !== undefined) filters.is_active = Boolean(JSON.parse(is_active));

            // if (search) {
            //     filters.OR = [
            //         { name: { contains: search, mode: 'insensitive' } },
            //         { sku_number: { contains: search, mode: 'insensitive' } },
            //         { barcode: { contains: search, mode: 'insensitive' } }
            //     ];
            // }
            
            // const products = await prisma.products.findMany({
            //     where: filters,
            //     include: {
            //         product_category: true,
            //         tax: true,
            //         discount: true,
            //         shop: true,
            //     },
            //     orderBy: {
            //         [sortBy]: sortOrder
            //     },
            //     skip: (parseInt(page) - 1) * parseInt(limit),
            //     take: parseInt(limit)
            // });

            // const totalProducts = await prisma.products.count({ where: filters });
            
            // return resolve({
            //     data: products,
            //     meta: {
            //         total: totalProducts,
            //         page: parseInt(page),
            //         limit: parseInt(limit),
            //         totalPages: Math.ceil(totalProducts / parseInt(limit))
            //     }
            // });
        } catch (error) {
            console.error("Error in getAllProductsService:", error);
            return reject(new CustomError("Failed to retrieve products.", INTERNAL_SERVER));
        }
    })
);

export const getProductByIdService = async (productId) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            await Validator.isNumber(parseInt(productId));

            const product = await prisma.products.findUnique({
                where: { id: parseInt(productId) },
                include: {
                    product_category: true,
                    // tax: true,
                    discount: true,
                    shop: true,
                    // modifier_groups: { include: { modifiers: true } }, // Example of deeper include
                    // addon_groups: { include: { addons: true } }       // Example of deeper include
                }
            });

            if (!product) {
                return reject(new CustomError(`Product with ID ${productId} not found.`, NOT_FOUND));
            }
            return resolve(product);
        } catch (error) {
            if (error instanceof CustomError) {
                return reject(error);
            }
            console.error("Error in getProductByIdService:", error);
            return reject(new CustomError("Failed to retrieve product.", INTERNAL_SERVER));
        }
    })
);

export const updateProductService = async (productId, updateData, file) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            await Validator.isNumber(parseInt(productId));

            const existingProduct = await prisma.products.findUnique({
                where: { id: parseInt(productId) }
            });

            if (!existingProduct) {
                return reject(new CustomError(`Product with ID ${productId} not found to update.`, NOT_FOUND));
            }

            // --- Validate only provided fields ---
            const dataToUpdate = {};
            if (updateData.name !== undefined) {
                await Validator.isText(updateData.name);
                dataToUpdate.name = updateData.name;
            }
            if (updateData.product_category_id !== undefined) {
                await Validator.isNumber(parseInt(updateData.product_category_id));
                const categoryExists = await prisma.product_categories.findUnique({ where: { id: parseInt(updateData.product_category_id) } });
                if (!categoryExists) return reject(new CustomError(`Product category with ID ${updateData.product_category_id} not found.`, NOT_FOUND));
                dataToUpdate.product_category_id = parseInt(updateData.product_category_id);
            }
            // Similar validation for other fields as in create, but only if present in updateData
            // For brevity, I'll list a few more:
            if (updateData.price !== undefined) {
                await Validator.isNumber(parseFloat(updateData.price));
                dataToUpdate.price = parseFloatOrNull(updateData.price);
            }
            if (updateData.cost_price !== undefined) {
                await Validator.isNumber(parseFloat(updateData.cost_price));
                dataToUpdate.cost_price = parseFloatOrNull(updateData.cost_price);
            }
            if (updateData.stock !== undefined) {
                await Validator.isNumber(parseInt(updateData.stock));
                dataToUpdate.stock = parseIntOrNull(updateData.stock);
            }
            if (updateData.shop_id !== undefined) { // if you allow changing shop
                await Validator.isNumber(parseInt(updateData.shop_id));
                const shopExists = await prisma.shops.findUnique({ where: { id: parseInt(updateData.shop_id) } });
                if (!shopExists) return reject(new CustomError(`Shop with ID ${updateData.shop_id} not found.`, NOT_FOUND));
                dataToUpdate.shop_id = parseInt(updateData.shop_id);
            }

            if (updateData.description !== undefined) dataToUpdate.description = updateData.description;
            if (updateData.short_description !== undefined) dataToUpdate.short_description = updateData.short_description;
            if (updateData.calories !== undefined) dataToUpdate.calories = parseFloatOrNull(updateData.calories);
            if (updateData.prepare_time !== undefined) dataToUpdate.prepare_time = parseIntOrNull(updateData.prepare_time);
            // ... and so on for all other mutable fields
            
            if (updateData.tax_id !== undefined) {
                if (updateData.tax_id === null || updateData.tax_id === '') {
                    dataToUpdate.tax_id = null;
                } else {
                    await Validator.isNumber(parseInt(updateData.tax_id));
                    const taxExists = await prisma.taxes.findUnique({ where: { id: parseInt(updateData.tax_id) } });
                    if (!taxExists) return reject(new CustomError(`Tax with ID ${updateData.tax_id} not found.`, NOT_FOUND));
                    dataToUpdate.tax_id = parseInt(updateData.tax_id);
                }
            }
            // Similar for discount_id

            if (updateData.is_active !== undefined) dataToUpdate.is_active = Boolean(JSON.parse(updateData.is_active));
            if (updateData.is_featured !== undefined) dataToUpdate.is_featured = Boolean(JSON.parse(updateData.is_featured));
            // ... and so on for booleans

            if (updateData.pricing_type !== undefined) {
                await Validator.isEnum(updateData.pricing_type, ['fixed', 'dynamic']);
                dataToUpdate.pricing_type = updateData.pricing_type;
            }
            // ... and so on for enums

            if (file) {
                await Validator.requiredSingleImage(file);
                dataToUpdate.image = file.path;
                // TODO: Consider deleting the old image from storage if existingProduct.image exists
            }

            if (Object.keys(dataToUpdate).length === 0) {
                return reject(new CustomError("No valid fields provided for update.", BAD_REQUEST));
            }
            
            dataToUpdate.updated_at = new Date(); // Manually set updated_at

            const updatedProduct = await prisma.products.update({
                where: { id: parseInt(productId) },
                data: dataToUpdate
            });
            return resolve(updatedProduct);

        } catch (error) {
            if (error instanceof CustomError) {
                return reject(error);
            }
            console.error("Error in updateProductService:", error);
            return reject(new CustomError("Failed to update product.", INTERNAL_SERVER));
        }
    })
);

export const deleteProductService = async (productId) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            await Validator.isNumber(parseInt(productId));

            const existingProduct = await prisma.products.findUnique({
                where: { id: parseInt(productId) }
            });

            if (!existingProduct) {
                return reject(new CustomError(`Product with ID ${productId} not found to delete.`, NOT_FOUND));
            }

            // Add checks here if product is part of an order or has other critical relations preventing deletion
            // For example, check product_modifier_groups or product_addon_groups if they should be deleted or handled.
            // For now, we'll proceed with a simple delete.

            await prisma.products.delete({
                where: { id: parseInt(productId) }
            });
            
            // TODO: Consider deleting the product image from storage if existingProduct.image exists

            return resolve({ message: "Product deleted successfully." });
        } catch (error) {
            if (error instanceof CustomError) {
                return reject(error);
            }
            console.error("Error in deleteProductService:", error);
            // Prisma error P2014: The change you are trying to make would violate the required relation '...'
            // This can happen if other tables have foreign keys to this product.
            if (error.code === 'P2014' || error.code === 'P2003') { // P2003 is foreign key constraint failed on delete
                 return reject(new CustomError("Cannot delete product. It is referenced by other records (e.g., orders, modifiers).", BAD_REQUEST));
            }
            return reject(new CustomError("Failed to delete product.", INTERNAL_SERVER));
        }
    })
);