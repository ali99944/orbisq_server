import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { json_web_token_expires_in, json_web_token_key } from '../lib/configs.js';
import promiseAsyncWrapper from '../lib/wrappers/promise_async_wrapper.js';
import CustomError from '../utils/custom_error.js';
import Validator from '../lib/validator.js';
import prisma from '../lib/prisma.js';
import { BAD_REQUEST, NOT_AUTHORIZED } from '../lib/status_codes.js';

const SALT_ROUNDS = 10;

export const createShopOwner = async (ownerData) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        // Validate required fields
        await Validator.validateNotNull({
            first_name: ownerData.first_name,
            last_name: ownerData.last_name,
            email: ownerData.email,
            phone: ownerData.phone,
            password: ownerData.password
        });

        await Validator.isEmail(ownerData.email);

        // Check if email or phone already exists
        const existingOwner = await prisma.shop_owners.findFirst({
            where: {
                OR: [
                    { email: ownerData.email },
                    { phone: ownerData.phone }
                ]
            }
        });

        if (existingOwner) {
            throw new CustomError('Email or phone already registered', BAD_REQUEST);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(ownerData.password, SALT_ROUNDS);

        // Create owner
        const owner = await prisma.shop_owners.create({
            data: {
                first_name: ownerData.first_name,
                last_name: ownerData.last_name,
                email: ownerData.email,
                phone: ownerData.phone,
                password: hashedPassword,
                is_active: ownerData.is_active || false
            }
        });

        return resolve(owner);
    })
);

export const loginShopOwner = async (email, password) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        await Validator.validateNotNull({ email, password });

        const owner = await prisma.shop_owners.findUnique({
            where: { email }
        });

        if (!owner) {
            throw new CustomError('Invalid credentials', NOT_AUTHORIZED);
        }

        if (!owner.is_active) {
            throw new CustomError('Account is not active', NOT_AUTHORIZED);
        }

        const passwordMatch = await bcrypt.compare(password, owner.password);
        if (!passwordMatch) {
            throw new CustomError('Invalid credentials', NOT_AUTHORIZED);
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: owner.id, type: 'owner' },
            json_web_token_key,
            { expiresIn: json_web_token_expires_in }
        );

        // Update last login
        await prisma.shop_owners.update({
            where: { id: owner.id },
            data: { last_login_at: new Date() }
        });

        // Create access token record
        const accessToken = await prisma.shop_access_token.create({
            data: {
                token,
                owner_id: owner.id,
                expires_at: new Date(Date.now() + json_web_token_expires_in * 1000)
            }
        });

        return resolve({
            owner: {
                id: owner.id,
                first_name: owner.first_name,
                last_name: owner.last_name,
                email: owner.email,
                phone: owner.phone
            },
            token
        });
    })
);

export const getOwnerById = async (ownerId) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        const owner = await prisma.shop_owners.findUnique({
            where: { id: ownerId },
            include: {
                shops: {
                    include: {
                        address: true,
                        currency_info: true,
                        business_info: true
                    }
                }
            }
        });

        if (!owner) {
            throw new CustomError('Owner not found', BAD_REQUEST);
        }

        // Remove sensitive data
        delete owner.password;
        
        return resolve(owner);
    })
);

export const updateOwner = async (ownerId, updateData) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        // Check if owner exists
        const existingOwner = await prisma.shop_owners.findUnique({
            where: { id: ownerId }
        });

        if (!existingOwner) {
            throw new CustomError('Owner not found', BAD_REQUEST);
        }

        // Hash new password if provided
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, SALT_ROUNDS);
        }

        const updatedOwner = await prisma.shop_owners.update({
            where: { id: ownerId },
            data: updateData
        });

        // Remove sensitive data
        delete updatedOwner.password;

        return resolve(updatedOwner);
    })
);

export const verifyOwnerToken = async (token) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            const decoded = jwt.verify(token, json_web_token_key);
            
            if (decoded.type !== 'owner') {
                throw new CustomError('Invalid token type', NOT_AUTHORIZED);
            }

            // Check if token exists in database
            const accessToken = await prisma.shop_access_token.findFirst({
                where: {
                    token,
                    owner_id: decoded.id,
                    expires_at: { gt: new Date() }
                }
            });

            if (!accessToken) {
                throw new CustomError('Token expired or invalid', NOT_AUTHORIZED);
            }

            // Update last used at
            await prisma.shop_access_token.update({
                where: { id: accessToken.id },
                data: { last_used_at: new Date() }
            });

            return resolve(decoded);
        } catch (error) {
            throw new CustomError('Invalid token', NOT_AUTHORIZED);
        }
    })
);