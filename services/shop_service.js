// services/shop.service.js

import prisma from "../lib/prisma.js"; // Assuming this path is correct
import promiseAsyncWrapper from "../lib/wrappers/promise_async_wrapper.js";

// --- Helper function to build include objects for Prisma queries ---
const getShopIncludeRelations = () => ({
    address: true,
    contact_info: true,
    social_links: true,
    currency_info: true,
    business_info: true,
    shop_theme: true,
    // Add other relations you frequently need to fetch with a shop
    // e.g., products: { take: 10, orderBy: { created_at: 'desc' } }
});

// --- Read Operations ---

export const getShops = (queryOptions = {}) => promiseAsyncWrapper(async (resolve, reject) => {
    try {
        const { page = 1, limit = 10, status, searchTerm, sortBy = 'created_at', sortOrder = 'desc', ...otherFilters } = queryOptions;
        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        const take = parseInt(limit, 10);

        const where = {};
        if (status) {
            where.status = status;
        }
        if (searchTerm) {
            where.OR = [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { slug: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } },
            ];
        }
        // Add other filters from otherFilters if needed

        const shops = await prisma.shops.findMany({
            where,
            include: getShopIncludeRelations(),
            skip: isNaN(skip) ? undefined : skip,
            take: isNaN(take) ? undefined : take,
            orderBy: {
                [sortBy]: sortOrder,
            },
        });

        const totalShops = await prisma.shops.count({ where });

        return resolve({
            data: shops,
            pagination: {
                total: totalShops,
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                totalPages: Math.ceil(totalShops / parseInt(limit, 10)),
            },
        });
    } catch (error) {
        console.error("Error in getShops service:", error);
        return reject(error);
    }
});

export const getShopById = (id) => promiseAsyncWrapper(async (resolve, reject) => {
    try {
        if (!id || isNaN(parseInt(id))) {
            return reject(new Error("Invalid shop ID provided."));
        }
        const shop = await prisma.shops.findUnique({
            where: { id: parseInt(id, 10) },
            include: getShopIncludeRelations(),
        });
        if (!shop) {
            return reject(new Error(`Shop with ID ${id} not found.`));
        }
        return resolve(shop);
    } catch (error) {
        console.error(`Error in getShopById service for ID ${id}:`, error);
        return reject(error);
    }
});

export const getShopBySlug = (slug) => promiseAsyncWrapper(async (resolve, reject) => {
    try {
        if (!slug) {
            return reject(new Error("Slug must be provided."));
        }
        const shop = await prisma.shops.findUnique({
            where: { slug },
            include: getShopIncludeRelations(),
        });
        if (!shop) {
            return reject(new Error(`Shop with slug "${slug}" not found.`));
        }
        return resolve(shop);
    } catch (error) {
        console.error(`Error in getShopBySlug service for slug ${slug}:`, error);
        return reject(error);
    }
});


// --- Create Operation ---

export const createShop = (shopData) => promiseAsyncWrapper(async (resolve, reject) => {
    try {
        const {
            address,
            contact_info,
            social_links,
            currency_info,
            business_info,
            shop_theme,
            ...mainShopData
        } = shopData;

        // Basic validation (you'll want more robust validation, e.g., with Joi or Zod)
        if (!mainShopData.name || !mainShopData.slug || !currency_info || !business_info || !shop_theme) {
            return reject(new Error("Missing required fields for shop creation (name, slug, currency_info, business_info, shop_theme)."));
        }

        // Ensure slug is unique before attempting to create
        const existingShopBySlug = await prisma.shops.findUnique({ where: { slug: mainShopData.slug } });
        if (existingShopBySlug) {
            return reject(new Error(`Shop with slug "${mainShopData.slug}" already exists.`));
        }

        const createdShop = await prisma.shops.create({
            data: {
                ...mainShopData,
                // Nested writes for one-to-one relations
                ...(address && { address: { create: address } }),
                ...(contact_info && { contact_info: { create: contact_info } }),
                ...(social_links && { social_links: { create: social_links } }),
                currency_info: { create: currency_info }, // Required
                business_info: { create: business_info }, // Required
                shop_theme: { create: shop_theme },       // Required
            },
            include: getShopIncludeRelations(),
        });
        return resolve(createdShop);
    } catch (error) {
        console.error("Error in createShop service:", error);
        if (error.code === 'P2002' && error.meta?.target?.includes('slug')) { // Prisma unique constraint violation
             return reject(new Error(`Shop with slug "${shopData.slug}" already exists.`));
        }
        return reject(error);
    }
});


// --- Update Operation ---

export const updateShop = (id, shopUpdateData) => promiseAsyncWrapper(async (resolve, reject) => {
    try {
        if (!id || isNaN(parseInt(id))) {
            return reject(new Error("Invalid shop ID provided for update."));
        }
        const shopId = parseInt(id, 10);

        const {
            address,
            contact_info,
            social_links,
            currency_info,
            business_info,
            shop_theme,
            ...mainShopUpdateData
        } = shopUpdateData;

        // Ensure shop exists
        const existingShop = await prisma.shops.findUnique({ where: { id: shopId } });
        if (!existingShop) {
            return reject(new Error(`Shop with ID ${shopId} not found for update.`));
        }

        // If slug is being updated, ensure it remains unique (excluding the current shop)
        if (mainShopUpdateData.slug && mainShopUpdateData.slug !== existingShop.slug) {
            const conflictingShop = await prisma.shops.findFirst({
                where: {
                    slug: mainShopUpdateData.slug,
                    NOT: { id: shopId },
                },
            });
            if (conflictingShop) {
                return reject(new Error(`Another shop with slug "${mainShopUpdateData.slug}" already exists.`));
            }
        }

        const updatedShop = await prisma.shops.update({
            where: { id: shopId },
            data: {
                ...mainShopUpdateData,
                // Nested updates for one-to-one.
                // `upsert` is useful if you want to create if not exists, or update if exists.
                // `update` requires the related record to exist.
                // `connectOrCreate` can also be an option.
                // For simplicity, using `update` assuming related records are managed alongside the shop.
                // If the related record might not exist, you'd use `upsert` or handle creation separately.

                ...(address && {
                    address: existingShop.address_id
                        ? { update: { where: { id: existingShop.address_id }, data: address } }
                        : { create: address } // If no address_id, create a new one
                }),
                ...(contact_info && {
                    contact_info: existingShop.contact_info_id
                        ? { update: { where: { id: existingShop.contact_info_id }, data: contact_info } }
                        : { create: contact_info }
                }),
                ...(social_links && {
                    social_links: existingShop.social_links_id
                        ? { update: { where: { id: existingShop.social_links_id }, data: social_links } }
                        : { create: social_links }
                }),
                ...(currency_info && {
                    currency_info: { update: { where: { id: existingShop.currency_info_id }, data: currency_info } }
                }), // Assuming currency_info_id always exists after creation
                ...(business_info && {
                    business_info: { update: { where: { id: existingShop.business_info_id }, data: business_info } }
                }), // Assuming business_info_id always exists
                ...(shop_theme && {
                    shop_theme: { update: { where: { id: existingShop.shop_theme_id }, data: shop_theme } }
                }), // Assuming shop_theme_id always exists
            },
            include: getShopIncludeRelations(),
        });
        return resolve(updatedShop);
    } catch (error) {
        console.error(`Error in updateShop service for ID ${id}:`, error);
         if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
             return reject(new Error(`Another shop with slug "${shopUpdateData.slug}" already exists.`));
        }
        return reject(error);
    }
});


// --- Delete Operation ---

export const deleteShop = (id) => promiseAsyncWrapper(async (resolve, reject) => {
    try {
        if (!id || isNaN(parseInt(id))) {
            return reject(new Error("Invalid shop ID provided for deletion."));
        }
        const shopId = parseInt(id, 10);

        // Ensure shop exists
        const existingShop = await prisma.shops.findUnique({
            where: { id: shopId },
            // Include related IDs to delete them explicitly if cascade delete isn't set up
            // or if you want to perform additional logic before deleting.
            // Prisma's default for 1-to-1 on the side holding the foreign key is usually restrictive.
            // You might need to delete related records first or adjust your schema for cascading deletes.
            select: {
                address_id: true,
                contact_info_id: true,
                social_links_id: true,
                currency_info_id: true,
                business_info_id: true,
                shop_theme_id: true,
                // Check for related orders, products etc. if you have deletion rules
                _count: {
                    select: { orders: true /*, products: true */ }
                }
            }
        });

        if (!existingShop) {
            return reject(new Error(`Shop with ID ${shopId} not found for deletion.`));
        }

        // Example: Prevent deletion if there are associated orders (adjust business logic as needed)
        if (existingShop._count.orders > 0) {
            return reject(new Error(`Cannot delete shop with ID ${shopId} as it has associated orders. Consider deactivating it instead.`));
        }

        // Transaction to delete shop and its direct one-to-one related records
        // This is safer. If your schema is set up with ON DELETE CASCADE for these,
        // deleting `shops` directly might be enough.
        // However, explicit deletion in a transaction gives more control.
        await prisma.$transaction(async (tx) => {
            if (existingShop.address_id) {
                await tx.addresses.delete({ where: { id: existingShop.address_id } });
            }
            if (existingShop.contact_info_id) {
                await tx.contact_infos.delete({ where: { id: existingShop.contact_info_id } });
            }
            if (existingShop.social_links_id) {
                await tx.social_links.delete({ where: { id: existingShop.social_links_id } });
            }
            // These are required and should always exist if the shop exists
            await tx.shop_theme.delete({ where: { id: existingShop.shop_theme_id } });
            await tx.business_infos.delete({ where: { id: existingShop.business_info_id } });
            await tx.currency_infos.delete({ where: { id: existingShop.currency_info_id } });

            // Finally, delete the shop itself
            await tx.shops.delete({ where: { id: shopId } });
        });

        return resolve({ message: `Shop with ID ${shopId} and its associated data deleted successfully.` });
    } catch (error) {
        console.error(`Error in deleteShop service for ID ${id}:`, error);
        return reject(error);
    }
});

// --- Additional Utility Functions (Examples) ---

export const updateShopStatus = (id, status) => promiseAsyncWrapper(async (resolve, reject) => {
    try {
        if (!id || isNaN(parseInt(id))) {
            return reject(new Error("Invalid shop ID."));
        }
        if (!status || !Object.values(prisma.ShopStatus).includes(status)) { // Assuming prisma generates enums like this
             return reject(new Error("Invalid status value."));
        }
        const shopId = parseInt(id, 10);
        const updatedShop = await prisma.shops.update({
            where: { id: shopId },
            data: { status },
            select: { id: true, status: true } // Only select what's needed
        });
        return resolve(updatedShop);
    } catch (error) {
        console.error(`Error updating status for shop ID ${id}:`, error);
        return reject(error);
    }
});

// You could add more specific functions like:
// - incrementOrdersCount(shopId)
// - updateLastSaleAt(shopId)
// - getShopsByStatus(status)
// - etc.