import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config.js';
import { BAD_REQUEST } from '../lib/status_codes.js';
import CustomError from '../utils/custom_error.js';
import Validator from '../lib/validator.js';
import promiseAsyncWrapper from '../lib/wrappers/promise_async_wrapper.js';
import prisma from '../lib/prisma.js';

const SALT_ROUNDS = 10;

export const createShopAccessPortal = async (shopId, portalData) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        // Validate required fields
        await Validator.validateNotNull({
            username: portalData.username,
            password: portalData.password
        });

        // Check if shop exists
        const shop = await prisma.shops.findUnique({
            where: { id: shopId }
        });

        if (!shop) {
            throw new CustomError('Shop not found', BAD_REQUEST);
        }

        // Check if username already exists
        const existingPortal = await prisma.shop_access_portal.findUnique({
            where: { username: portalData.username }
        });

        if (existingPortal) {
            throw new CustomError('Username already exists', BAD_REQUEST);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(portalData.password, SALT_ROUNDS);

        // Create portal
        const portal = await prisma.shop_access_portal.create({
            data: {
                username: portalData.username,
                password: hashedPassword,
                shop_id: shopId,
                permissions: portalData.permissions || {}
            }
        });

        return resolve(portal);
    })
);

export const loginShopPortal = async (username, password) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        await Validator.validateNotNull({ username, password });

        const portal = await prisma.shop_access_portal.findUnique({
            where: { username },
            include: { shop: true }
        });

        if (!portal) {
            throw new CustomError('Invalid credentials', UNAUTHORIZED);
        }

        if (!portal.is_active) {
            throw new CustomError('Portal account is not active', UNAUTHORIZED);
        }

        const passwordMatch = await bcrypt.compare(password, portal.password);
        if (!passwordMatch) {
            throw new CustomError('Invalid credentials', UNAUTHORIZED);
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: portal.id, shop_id: portal.shop_id, type: 'portal' },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Update last login
        await prisma.shop_access_portal.update({
            where: { id: portal.id },
            data: { last_login_at: new Date() }
        });

        // Create access token record
        const accessToken = await prisma.shop_access_token.create({
            data: {
                token,
                portal_id: portal.id,
                expires_at: new Date(Date.now() + JWT_EXPIRES_IN * 1000)
            }
        });

        return resolve({
            portal: {
                id: portal.id,
                username: portal.username,
                shop_id: portal.shop_id,
                shop_name: portal.shop.name,
                permissions: portal.permissions
            },
            token
        });
    })
);

export const verifyPortalToken = async (token) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            
            if (decoded.type !== 'portal') {
                throw new CustomError('Invalid token type', UNAUTHORIZED);
            }

            // Check if token exists in database
            const accessToken = await prisma.shop_access_token.findFirst({
                where: {
                    token,
                    portal_id: decoded.id,
                    expires_at: { gt: new Date() }
                },
                include: {
                    portal: {
                        include: {
                            shop: true
                        }
                    }
                }
            });

            if (!accessToken) {
                throw new CustomError('Token expired or invalid', UNAUTHORIZED);
            }

            // Update last used at
            await prisma.shop_access_token.update({
                where: { id: accessToken.id },
                data: { last_used_at: new Date() }
            });

            return resolve({
                portalId: decoded.id,
                shopId: decoded.shop_id,
                permissions: accessToken.portal.permissions
            });
        } catch (error) {
            throw new CustomError('Invalid token', UNAUTHORIZED);
        }
    })
);

export const getShopPortals = async (shopId) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        const portals = await prisma.shop_access_portal.findMany({
            where: { shop_id: shopId },
            select: {
                id: true,
                username: true,
                is_active: true,
                last_login_at: true,
                created_at: true
            }
        });

        return resolve(portals);
    })
);

export const updateShopPortal = async (portalId, updateData) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        // Check if portal exists
        const existingPortal = await prisma.shop_access_portal.findUnique({
            where: { id: portalId }
        });

        if (!existingPortal) {
            throw new CustomError('Portal not found', BAD_REQUEST);
        }

        // Hash new password if provided
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, SALT_ROUNDS);
        }

        const updatedPortal = await prisma.shop_access_portal.update({
            where: { id: portalId },
            data: updateData
        });

        // Remove sensitive data
        delete updatedPortal.password;

        return resolve(updatedPortal);
    })
);