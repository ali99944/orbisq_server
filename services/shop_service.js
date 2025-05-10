
import prisma from '../lib/prisma.js';
import { BAD_REQUEST } from '../lib/status_codes.js';
import Validator from '../lib/validator.js';
import promiseAsyncWrapper from '../lib/wrappers/promise_async_wrapper.js';
import CustomError from '../utils/custom_error.js';

export const createShop = async (shopData) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        // Validate required fields
        await Validator.validateNotNull({
            name: shopData.name,
            description: shopData.description
        });

        // Generate unique slug if not provided
        if (!shopData.slug) {
            shopData.slug = shopData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
        }

        // Check if slug already exists
        const existingShop = await prisma.shops.findUnique({
            where: { slug: shopData.slug }
        });

        if (existingShop) {
            throw new CustomError('Shop with this slug already exists', BAD_REQUEST);
        }

        // Create shop with all related data in a transaction
        const shop = await prisma.$transaction(async (prisma) => {
            // Create address if provided
            let address;
            if (shopData.address) {
                address = await prisma.addresses.create({
                    data: {
                        ...shopData.address,
                        country: shopData.address.country || 'Egypt'
                    }
                });
            }

            // Create contact info if provided
            let contactInfo;
            if (shopData.contact_info) {
                contactInfo = await prisma.contact_infos.create({
                    data: shopData.contact_info
                });
            }

            // Create social links if provided
            let socialLinks;
            if (shopData.social_links) {
                socialLinks = await prisma.social_links.create({
                    data: shopData.social_links
                });
            }

            // Create currency info (required)
            const currencyInfo = await prisma.currency_infos.create({
                data: {
                    ...shopData.currency_info,
                    currency: shopData.currency_info?.currency || 'LE',
                    currency_symbol: shopData.currency_info?.currency_symbol || 'L.E',
                    currency_code: shopData.currency_info?.currency_code || 'EGP'
                }
            });

            // Create business info (required)
            const businessInfo = await prisma.business_infos.create({
                data: {
                    ...shopData.business_info,
                    vat_type: shopData.business_info?.vat_type || 'inclusive'
                }
            });

            // Create shop theme (required)
            const shopTheme = await prisma.shop_theme.create({
                data: {
                    primary_color: shopData.shop_theme?.primary_color || '#000000',
                    secondary_color: shopData.shop_theme?.secondary_color || '#000000',
                    background_color: shopData.shop_theme?.background_color || '#000000',
                    background_image: shopData.shop_theme?.background_image,
                    accent_color: shopData.shop_theme?.accent_color || '#000000',
                    text_color: shopData.shop_theme?.text_color || '#000000'
                }
            });

            // Create the main shop record
            return await prisma.shops.create({
                data: {
                    name: shopData.name,
                    slug: shopData.slug,
                    description: shopData.description,
                    status: shopData.status || 'active',
                    opening_hours: shopData.opening_hours,
                    timezone: shopData.timezone || 'Africa/Cairo',
                    language: shopData.language || 'ar-EG',
                    payment_methods: shopData.payment_methods || [],
                    fulfillment_types: shopData.fulfillment_types || ['dine-in'],
                    
                    // Relations
                    address_id: address?.id,
                    contact_info_id: contactInfo?.id,
                    social_links_id: socialLinks?.id,
                    currency_info_id: currencyInfo.id,
                    business_info_id: businessInfo.id,
                    shop_theme_id: shopTheme.id
                },
                include: {
                    address: true,
                    contact_info: true,
                    social_links: true,
                    currency_info: true,
                    business_info: true,
                    shop_theme: true
                }
            });
        });

        return resolve(shop);
    })
);

export const updateShop = async (shopId, updateData) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        // Check if shop exists
        const existingShop = await prisma.shops.findUnique({
            where: { id: shopId },
            include: {
                address: true,
                contact_info: true,
                social_links: true,
                currency_info: true,
                business_info: true,
                shop_theme: true
            }
        });

        if (!existingShop) {
            throw new CustomError('Shop not found', BAD_REQUEST);
        }

        // Update shop and related data in a transaction
        const updatedShop = await prisma.$transaction(async (prisma) => {
            // Update address if provided
            if (updateData.address) {
                await prisma.addresses.update({
                    where: { id: existingShop.address_id },
                    data: updateData.address
                });
            }

            // Update contact info if provided
            if (updateData.contact_info) {
                await prisma.contact_infos.update({
                    where: { id: existingShop.contact_info_id },
                    data: updateData.contact_info
                });
            }

            // Update social links if provided
            if (updateData.social_links) {
                await prisma.social_links.update({
                    where: { id: existingShop.social_links_id },
                    data: updateData.social_links
                });
            }

            // Update currency info if provided
            if (updateData.currency_info) {
                await prisma.currency_infos.update({
                    where: { id: existingShop.currency_info_id },
                    data: updateData.currency_info
                });
            }

            // Update business info if provided
            if (updateData.business_info) {
                await prisma.business_infos.update({
                    where: { id: existingShop.business_info_id },
                    data: updateData.business_info
                });
            }

            // Update shop theme if provided
            if (updateData.shop_theme) {
                await prisma.shop_theme.update({
                    where: { id: existingShop.shop_theme_id },
                    data: updateData.shop_theme
                });
            }

            // Update the main shop record
            return await prisma.shops.update({
                where: { id: shopId },
                data: {
                    name: updateData.name,
                    description: updateData.description,
                    status: updateData.status,
                    opening_hours: updateData.opening_hours,
                    timezone: updateData.timezone,
                    language: updateData.language,
                    payment_methods: updateData.payment_methods,
                    fulfillment_types: updateData.fulfillment_types
                },
                include: {
                    address: true,
                    contact_info: true,
                    social_links: true,
                    currency_info: true,
                    business_info: true,
                    shop_theme: true
                }
            });
        });

        return resolve(updatedShop);
    })
);

export const getShopById = async (shopId) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        const shop = await prisma.shops.findUnique({
            where: { id: shopId },
            include: {
                address: true,
                contact_info: true,
                social_links: true,
                currency_info: true,
                business_info: true,
                shop_theme: true,
                categories: true,
                products: true,
                discounts: true,
                desks: true,
                branches: true
            }
        });

        if (!shop) {
            throw new CustomError('Shop not found', BAD_REQUEST);
        }

        return resolve(shop);
    })
);

export const getShopBySlug = async (slug) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        const shop = await prisma.shops.findUnique({
            where: { slug },
            include: {
                address: true,
                contact_info: true,
                social_links: true,
                currency_info: true,
                business_info: true,
                shop_theme: true,
                categories: {
                    where: { is_active: true },
                    orderBy: { sort_order: 'asc' }
                },
                products: {
                    where: { is_active: true },
                    orderBy: { sort_order: 'asc' }
                },
                discounts: {
                    where: { is_active: true }
                },
                desks: {
                    where: { status: 'free' }
                }
            }
        });

        if (!shop) {
            throw new CustomError('Shop not found', BAD_REQUEST);
        }

        return resolve(shop);
    })
);

export const getAllShops = async (filters = {}) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        const { status, search } = filters;
        
        const where = {};
        
        if (status) {
            where.status = status;
        }
        
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        const shops = await prisma.shops.findMany({
            where,
            include: {
                address: true,
                contact_info: true,
                currency_info: true,
                business_info: true
            },
            orderBy: { created_at: 'desc' }
        });

        return resolve(shops);
    })
);

export const deleteShop = async (shopId) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        // Check if shop exists
        const shop = await prisma.shops.findUnique({
            where: { id: shopId },
            include: {
                address: true,
                contact_info: true,
                social_links: true,
                currency_info: true,
                business_info: true,
                shop_theme: true
            }
        });

        if (!shop) {
            throw new CustomError('Shop not found', BAD_REQUEST);
        }

        // Delete all related data in transaction
        await prisma.$transaction(async (prisma) => {
            if (shop.address_id) {
                await prisma.addresses.delete({ where: { id: shop.address_id } });
            }
            if (shop.contact_info_id) {
                await prisma.contact_infos.delete({ where: { id: shop.contact_info_id } });
            }
            if (shop.social_links_id) {
                await prisma.social_links.delete({ where: { id: shop.social_links_id } });
            }
            if (shop.currency_info_id) {
                await prisma.currency_infos.delete({ where: { id: shop.currency_info_id } });
            }
            if (shop.business_info_id) {
                await prisma.business_infos.delete({ where: { id: shop.business_info_id } });
            }
            if (shop.shop_theme_id) {
                await prisma.shop_theme.delete({ where: { id: shop.shop_theme_id } });
            }

            await prisma.shops.delete({ where: { id: shopId } });
        });

        return resolve({ success: true });
    })
);

export const updateShopLogo = async (shopId, logoPath) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        const updatedShop = await prisma.shops.update({
            where: { id: shopId },
            data: { logo: logoPath }
        });

        return resolve(updatedShop);
    })
);

export const updateShopCover = async (shopId, coverPath) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        const updatedShop = await prisma.shops.update({
            where: { id: shopId },
            data: { cover: coverPath }
        });

        return resolve(updatedShop);
    })
);