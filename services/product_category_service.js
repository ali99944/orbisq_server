import prisma from '../lib/prisma.js';
import { generateReferenceCode } from '../lib/generator.js';
import { BAD_REQUEST, NOT_FOUND } from '../lib/status_codes.js';
import CustomError from '../utils/custom_error.js';
import Validator from '../lib/validator.js';
import promiseAsyncWrapper from '../lib/wrappers/promise_async_wrapper.js';

export const createCategory = async (categoryData, imagePath, shop_id) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        // Validate required fields
        await Validator.validateNotNull({
            name: categoryData.name,
            shop_id: +categoryData.shop_id
        });

        // Check if shop exists
        const shopExists = await prisma.shops.findUnique({
            where: { id: +categoryData.shop_id }
        });

        if (!shopExists) {
            throw new CustomError('Shop not found', NOT_FOUND);
        }

        // Generate slug if not provided
        if (!categoryData.slug) {
            categoryData.slug = categoryData.name.toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^\w-]+/g, '');
        }

        // Generate reference code if not provided
        if (!categoryData.reference_code) {
            categoryData.reference_code = generateReferenceCode('CAT');
        }

        // Create category
        const category = await prisma.product_categories.create({
            data: {
                name: categoryData.name,
                description: categoryData.description,
                image: imagePath,
                reference_code: categoryData.reference_code,
                is_active: !!+categoryData.is_active || false,
                sort_order: categoryData.sort_order || 0,
                slug: categoryData.slug,
                shop_id: shop_id
            }
        });

        return resolve(category);
    })
);

export const updateCategory = async (categoryId, updateData, imagePath) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        // Check if category exists
        const existingCategory = await prisma.product_categories.findUnique({
            where: { id: categoryId }
        });

        if (!existingCategory) {
            throw new CustomError('Category not found', NOT_FOUND);
        }

        // If changing slug, check for conflicts
        if (updateData.slug && updateData.slug !== existingCategory.slug) {
            const slugConflict = await prisma.product_categories.findFirst({
                where: {
                    slug: updateData.slug,
                    shop_id: existingCategory.shop_id,
                    NOT: { id: categoryId }
                }
            });

            if (slugConflict) {
                throw new CustomError('Category with this slug already exists in this shop', BAD_REQUEST);
            }
        }

        // Prepare update data
        const updatePayload = {
            name: updateData.name,
            description: updateData.description,
            is_active: updateData.is_active == 1,
            sort_order: updateData.sort_order,
            slug: updateData.slug
        };

        // Only update image if new one is provided
        if (imagePath) {
            updatePayload.image = imagePath;
        }

        const updatedCategory = await prisma.product_categories.update({
            where: { id: categoryId },
            data: updatePayload
        });

        return resolve(updatedCategory);
    })
);

export const getCategoryById = async (categoryId) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        const category = await prisma.product_categories.findUnique({
            where: { id: categoryId },
            include: {
                shop: true,
                products: {
                    where: { is_active: true },
                    orderBy: { sort_order: 'asc' }
                }
            }
        });

        if (!category) {
            throw new CustomError('Category not found', NOT_FOUND);
        }

        return resolve(category);
    })
);

export const getCategoryBySlug = async (slug, shopId) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        const category = await prisma.product_categories.findFirst({
            where: {
                slug,
                shop_id: shopId
            },
            include: {
                products: {
                    where: { is_active: true },
                    orderBy: { sort_order: 'asc' }
                }
            }
        });

        if (!category) {
            throw new CustomError('Category not found', NOT_FOUND);
        }

        return resolve(category);
    })
);

export const getShopCategories = async (shopId, filters = {}) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        // const { activeOnly = true, sortBy = 'sort_order', sortDirection = 'asc' } = filters;

        // const where = {
        //     shop_id: shopId
        // };

        // if (activeOnly) {
        //     where.is_active = true;
        // }

        // const categories = await prisma.product_categories.findMany({
        //     where,
        //     include: {
        //         _count: {
        //             select: { products: true }
        //         }
        //     },
        //     orderBy: {
        //         [sortBy]: sortDirection
        //     }
        // });

        // // Map to include product count
        // const result = categories.map(category => ({
        //     ...category,
        //     total_products: category._count.products
        // }));

        const categories = await prisma.product_categories.findMany({
            where: {
                shop_id: shopId
            },
        });

        return resolve(categories);
    })
);

export const deleteCategory = async (categoryId) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        // Check if category exists
        const category = await prisma.product_categories.findUnique({
            where: { id: categoryId },
            include: {
                products: {
                    select: { id: true }
                }
            }
        });

        if (!category) {
            throw new CustomError('Category not found', NOT_FOUND);
        }

        // Check if category has products
        if (category.products.length > 0) {
            throw new CustomError('Cannot delete category with products', BAD_REQUEST);
        }

        // Delete category
        await prisma.product_categories.delete({
            where: { id: categoryId }
        });

        return resolve({ success: true });
    })
);

export const updateCategoryImage = async (categoryId, imagePath) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        const updatedCategory = await prisma.product_categories.update({
            where: { id: categoryId },
            data: { image: imagePath }
        });

        return resolve(updatedCategory);
    })
);

export const updateCategoryStatus = async (categoryId, isActive) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        const updatedCategory = await prisma.product_categories.update({
            where: { id: categoryId },
            data: { is_active: isActive }
        });

        return resolve(updatedCategory);
    })
);