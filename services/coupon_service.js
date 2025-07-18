import prisma from "../lib/prisma.js";
import { BAD_REQUEST, NOT_FOUND, INTERNAL_SERVER, CONFLICT } from "../lib/status_codes.js";
import CustomError from "../utils/custom_error.js";
import promiseAsyncWrapper from "../lib/wrappers/promise_async_wrapper.js";
import Validator from "../lib/validator.js";
import { parseBoolean, parseDateOrNull, parseDecimalOrNull, parseFloatOrNull, parseIntOrNull } from "../lib/parser.js";

const DISCOUNT_TYPE_ENUM_COUPON = ['percentage', 'fixed_amount_off', 'fixed_price', 'free_shipping']; // Same as discount

export const createCouponService = async (couponData, portal) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            // Auto-generate code if not provided? Or make it mandatory.
            // For now, assume code is provided or we can use a generator.
            // Let's make 'code' mandatory from client or generate it if not present.
            if (!couponData.code) {
                // couponData.code = generateReferenceCode('CPN', 8); // Example auto-generation
                return reject(new CustomError("Coupon code is required.", BAD_REQUEST));
            }


            await Validator.validateNotNull({
                code: couponData.code,
                discount_type: couponData.discount_type,
                discount_value: couponData.discount_value,
                shop_id: +portal.shopId,
            });

            console.log('reached here');
            

            await Validator.isText(couponData.code);
            // await Validator.isEnum(couponData.discount_type, DISCOUNT_TYPE_ENUM_COUPON);
            if (isNaN(parseFloatOrNull(couponData.discount_value))) return reject(new CustomError("Discount value must be a number.", BAD_REQUEST));
            // start_date and end_date will be validated by parseDateOrNull implicitly
            // const shopId = parseIntOrNull(couponData.shop_id);
            // await Validator.isNumber(shopId);

            const existingCode = await prisma.coupons.findUnique({ where: { code: couponData.code } });
            if (existingCode) return reject(new CustomError(`Coupon code ${couponData.code} already exists.`, CONFLICT));

            const shopExists = await prisma.shops.findUnique({ where: { id: +portal.shopId } });
            if (!shopExists) return reject(new CustomError(`Shop with ID ${+portal.shopId} not found.`, NOT_FOUND));

            let branchId = null;
            if (couponData.branch_id) {
                branchId = parseIntOrNull(couponData.branch_id);
                await Validator.isNumber(branchId);
                const branchExists = await prisma.branches.findUnique({ where: { id: branchId } });
                if (!branchExists) return reject(new CustomError(`Branch with ID ${branchId} not found.`, NOT_FOUND));
            }

            if (couponData.min_order_amount) if (isNaN(parseFloatOrNull(couponData.min_order_amount))) return reject(new CustomError("Min order amount must be a number.", BAD_REQUEST));
            if (couponData.max_discount) if (isNaN(parseFloatOrNull(couponData.max_discount))) return reject(new CustomError("Max discount must be a number.", BAD_REQUEST));
            if (couponData.usage_limit) await Validator.isNumber(parseIntOrNull(couponData.usage_limit));
            if (couponData.per_user_limit) await Validator.isNumber(parseIntOrNull(couponData.per_user_limit));

            // Date validation
            const expiresAt = parseDateOrNull(couponData.expires_at);
            if (!expiresAt) return reject(new CustomError("Invalid expiration date.", BAD_REQUEST));
            if (expiresAt <= new Date()) return reject(new CustomError("Expiration date must be in the future.", BAD_REQUEST));


            const dataToCreate = {
                code: couponData.code,
                description: couponData.description || null,
                discount_type: couponData.discount_type.toLowerCase(),
                discount_value: parseDecimalOrNull(couponData.discount_value),
                min_order_amount: parseDecimalOrNull(couponData.min_order_amount),
                max_discount: parseDecimalOrNull(couponData.max_discount),
                expires_at: expiresAt,
                is_active: parseBoolean(couponData.is_active, true),
                usage_limit: parseIntOrNull(couponData.usage_limit),
                per_user_limit: couponData.per_user_limit ? parseIntOrNull(couponData.per_user_limit) : 1,
                times_used: 0, // Default
                shop_id: +portal.shopId,
                // user_restrictions and product_restrictions are many-to-many, handled separately
            };

            if (dataToCreate.discount_value === null) return reject(new CustomError("Invalid discount_value provided.", BAD_REQUEST));
            // Similar checks for min_order_amount and max_discount if they were provided but failed to parse

            const coupon = await prisma.coupons.create({ data: dataToCreate });
            return resolve(coupon);

        } catch (error) {
            if (error instanceof CustomError) return reject(error);
            console.error("Error in createCouponService:", error);
             if (error.code === 'P2002') {
                 return reject(new CustomError(`Coupon code ${couponData.code} already exists.`, CONFLICT));
            }
            return reject(new CustomError("Failed to create coupon.", INTERNAL_SERVER));
        }
    })
);

export const getAllCouponsService = async (queryParams) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            // const { 
            //     shop_id, 
            //     branch_id,
            //     is_active, 
            //     discount_type,
            //     page = 1, 
            //     limit = 10, 
            //     sortBy = 'created_at', 
            //     sortOrder = 'desc',
            //     search // for code or description
            // } = queryParams;

            // const filters = {};
            // if (shop_id) filters.shop_id = parsTparseIntOrNullInt(shop_id);
            // if (branch_id) filters.branch_id = parseITparseIntOrNullt(branch_id);
            // if (is_active !== undefined) filters.is_active = parseBoolean(is_active);
            // if (discount_type) {
            //     await Validator.isEnum(discount_type, DISCOUNT_TYPE_ENUM_COUPON);
            //     filters.discount_type = discount_type;
            // }
            
            // if (search) {
            //     filters.OR = [
            //         { code: { contains: search, mode: 'insensitive' } },
            //         { description: { contains: search, mode: 'insensitive' } }
            //     ];
            // }

            // // Filter for active coupons based on date
            // // filters.start_date = { lte: new Date() }; // Start date is in the past or now
            // // filters.end_date = { gte: new Date() };   // End date is in the future or now
            // // ^ This might be too restrictive for admins wanting to see all coupons.
            // // Add a specific query param like `active_now=true` if needed for this.

            // const coupons = await prisma.coupons.findMany({
            //     where: filters,
            //     include: { shop: true, branch: true },
            //     orderBy: { [sortBy]: sortOrder },
            //     skip: (pTparseIntOrNullrseInt(page) - 1) * paTparseIntOrNullseInt(limit),
            //     take: paTparseIntOrNullseInt(limit),
            // });
            // const totalCoupons = await prisma.coupons.count({ where: filters });

            // return resolve({
            //     data: coupons,
            //     meta: {
            //         total: totalCoupons,
            //         page: pTparseIntOrNullrseInt(page),
            //         limit: paTparseIntOrNullseInt(limit),
            //         totalPages: Math.ceil(totalCoupons / paTparseIntOrNullseInt(limit)),
            //     },
            // });

            const coupons = await prisma.coupons.findMany({
                include: { 
                    shop: true,
                    redemptions: true,
                    user_restrictions: true,
                    product_restrictions: true
                },
            });

            return resolve(coupons);
        } catch (error) {
            if (error instanceof CustomError) return reject(error);
            console.error("Error in getAllCouponsService:", error);
            return reject(new CustomError("Failed to retrieve coupons.", INTERNAL_SERVER));
        }
    })
);

export const getCouponByIdService = async (couponId) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            const id = parseIntOrNull(couponId);
            await Validator.isNumber(id);

            const coupon = await prisma.coupons.findUnique({
                where: { id },
                include: { 
                    shop: true,
                    redemptions: true,
                    user_restrictions: true,
                    product_restrictions: true
                },
            });

            if (!coupon) {
                return reject(new CustomError(`Coupon with ID ${id} not found.`, NOT_FOUND));
            }
            return resolve(coupon);
        } catch (error) {
            if (error instanceof CustomError) return reject(error);
            console.error("Error in getCouponByIdService:", error);
            return reject(new CustomError("Failed to retrieve coupon.", INTERNAL_SERVER));
        }
    })
);

// A specific service to get coupon by code (useful for validation)
export const getCouponByCodeService = async (code) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            await Validator.isText(code);

            const coupon = await prisma.coupons.findUnique({
                where: { code },
                include: { 
                    shop: true,
                    redemptions: true,
                    user_restrictions: true,
                    product_restrictions: true
                },
            });

            if (!coupon) {
                return reject(new CustomError(`Coupon with code "${code}" not found.`, NOT_FOUND));
            }
            return resolve(coupon);
        } catch (error) {
            if (error instanceof CustomError) return reject(error);
            console.error("Error in getCouponByCodeService:", error);
            return reject(new CustomError("Failed to retrieve coupon by code.", INTERNAL_SERVER));
        }
    })
);


export const updateCouponService = async (couponId, updateData) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            const id = parseIntOrNull(couponId);
            await Validator.isNumber(id);

            const existingCoupon = await prisma.coupons.findUnique({ where: { id } });
            if (!existingCoupon) {
                return reject(new CustomError(`Coupon with ID ${id} not found to update.`, NOT_FOUND));
            }

            const dataToUpdate = {};

            if (updateData.code !== undefined) {
                await Validator.isText(updateData.code);
                if(updateData.code !== existingCoupon.code) {
                    const conflictingCode = await prisma.coupons.findUnique({ where: { code: updateData.code } });
                    if (conflictingCode) return reject(new CustomError(`Coupon code ${updateData.code} is already in use.`, CONFLICT));
                }
                dataToUpdate.code = updateData.code;
            }
            if (updateData.description !== undefined) dataToUpdate.description = updateData.description === '' ? null : updateData.description;
            if (updateData.discount_type !== undefined) {
                await Validator.isEnum(updateData.discount_type, DISCOUNT_TYPE_ENUM_COUPON);
                dataToUpdate.discount_type = updateData.discount_type;
            }
            if (updateData.discount_value !== undefined) {
                 if (isNaN(parseFloatOrNull(updateData.discount_value))) return reject(new CustomError("Discount value must be a number.", BAD_REQUEST));
                 dataToUpdate.discount_value = parseDecimalOrNull(updateData.discount_value);
                 if (dataToUpdate.discount_value === null) return reject(new CustomError("Invalid discount_value for update.", BAD_REQUEST));
            }
            if (updateData.min_order_amount !== undefined) {
                if(updateData.min_order_amount === null || updateData.min_order_amount === '') {
                    dataToUpdate.min_order_amount = null;
                } else {
                    if (isNaN(parseFloatOrNull(updateData.min_order_amount))) return reject(new CustomError("Min order amount must be a number.", BAD_REQUEST));
                    dataToUpdate.min_order_amount = parseDecimalOrNull(updateData.min_order_amount);
                    if (dataToUpdate.min_order_amount === null) return reject(new CustomError("Invalid min_order_amount for update.", BAD_REQUEST));
                }
            }
            // similar logic for max_discount
            if (updateData.max_discount !== undefined) {
                 if(updateData.max_discount === null || updateData.max_discount === '') {
                    dataToUpdate.max_discount = null;
                } else {
                    if (isNaN(parseFloatOrNull(updateData.max_discount))) return reject(new CustomError("Max discount must be a number.", BAD_REQUEST));
                    dataToUpdate.max_discount = parseDecimalOrNull(updateData.max_discount);
                    if (dataToUpdate.max_discount === null) return reject(new CustomError("Invalid max_discount for update.", BAD_REQUEST));
                }
            }

            let expiresAt = existingCoupon.expires_at;

            if (updateData.expires_at !== undefined) {
                expiresAt = parseDateOrNull(updateData.expires_at);
                if (!expiresAt) return reject(new CustomError("Invalid expiration date for update.", BAD_REQUEST));
                if (expiresAt <= new Date()) return reject(new CustomError("Expiration date must be in the future.", BAD_REQUEST));
                dataToUpdate.expires_at = expiresAt;
            }
            

            if (updateData.is_active !== undefined) dataToUpdate.is_active = parseBoolean(updateData.is_active);
            if (updateData.usage_limit !== undefined) dataToUpdate.usage_limit = parseIntOrNull(updateData.usage_limit);
            if (updateData.per_user_limit !== undefined) dataToUpdate.per_user_limit = parseIntOrNull(updateData.per_user_limit);
            
            if (updateData.shop_id !== undefined) {
                const shopId = parseIntOrNull(updateData.shop_id);
                await Validator.isNumber(shopId);
                const shopExists = await prisma.shops.findUnique({ where: { id: shopId } });
                if (!shopExists) return reject(new CustomError(`Shop with ID ${shopId} not found.`, NOT_FOUND));
                dataToUpdate.shop_id = shopId;
            }
            // Branch ID is no longer part of the coupon model
            // times_used should not be updatable directly via this endpoint.

            if (Object.keys(dataToUpdate).length === 0) {
                return reject(new CustomError("No valid fields provided for update.", BAD_REQUEST));
            }
            dataToUpdate.updated_at = new Date();

            const updatedCoupon = await prisma.coupons.update({
                where: { id },
                data: dataToUpdate,
            });
            return resolve(updatedCoupon);

        } catch (error) {
            if (error instanceof CustomError) return reject(error);
            console.error("Error in updateCouponService:", error);
            if (error.code === 'P2002') {
                 return reject(new CustomError(`Update failed: Coupon code is already in use.`, CONFLICT));
            }
            return reject(new CustomError("Failed to update coupon.", INTERNAL_SERVER));
        }
    })
);

export const deleteCouponService = async (couponId) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            const id = parseIntOrNull(couponId);
            await Validator.isNumber(id);

            const existingCoupon = await prisma.coupons.findUnique({ where: { id } });
            if (!existingCoupon) {
                return reject(new CustomError(`Coupon with ID ${id} not found to delete.`, NOT_FOUND));
            }

            // Check for coupon redemptions
            const redemptions = await prisma.coupon_redemptions.count({ where: { coupon_id: id } });
            if (redemptions > 0) {
                return reject(new CustomError(`Cannot delete coupon. It has ${redemptions} redemption(s). Consider deactivating it instead.`, BAD_REQUEST));
            }
            
            // Disconnect relations for user_restrictions and product_restrictions before deleting
            // This prevents P2003 foreign key constraint errors if CASCADE is not set up, and is cleaner.
            await prisma.coupons.update({
                where: { id },
                data: {
                    user_restrictions: { set: [] }, // Disconnect all users
                    product_restrictions: { set: [] } // Disconnect all products
                }
            });


            await prisma.coupons.delete({ where: { id } });
            return resolve({ message: "Coupon deleted successfully." });

        } catch (error) {
            if (error instanceof CustomError) return reject(error);
            console.error("Error in deleteCouponService:", error);
            if (error.code === 'P2003') { // Should be less likely now with explicit disconnect
                 return reject(new CustomError("Cannot delete coupon. It is referenced by other records (e.g. redemptions).", BAD_REQUEST));
            }
            return reject(new CustomError("Failed to delete coupon.", INTERNAL_SERVER));
        }
    })
);

// --- Services for Managing Coupon Relations (User & Product Restrictions) ---
// Example: Add product restriction to coupon
export const addProductRestrictionToCouponService = async (couponId, productId) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            const cId = parseIntOrNull(couponId);
            const pId = parseIntOrNull(productId);
            await Validator.isNumber(cId);
            await Validator.isNumber(pId);

            const coupon = await prisma.coupons.findUnique({ where: { id: cId } });
            if (!coupon) return reject(new CustomError(`Coupon with ID ${cId} not found.`, NOT_FOUND));
            
            const product = await prisma.products.findUnique({ where: { id: pId } });
            if (!product) return reject(new CustomError(`Product with ID ${pId} not found.`, NOT_FOUND));

            const updatedCoupon = await prisma.coupons.update({
                where: { id: cId },
                data: {
                    product_restrictions: {
                        connect: { id: pId }
                    }
                },
                include: { product_restrictions: true }
            });
            resolve(updatedCoupon);
        } catch (error) {
            if (error instanceof CustomError) return reject(error);
            console.error("Error adding product restriction:", error);
            return reject(new CustomError("Failed to add product restriction to coupon.", INTERNAL_SERVER));
        }
    })
);

// Example: Remove product restriction from coupon
export const removeProductRestrictionFromCouponService = async (couponId, productId) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            const cId = parseIntOrNull(couponId);
            const pId = parseIntOrNull(productId);
            await Validator.isNumber(cId);
            await Validator.isNumber(pId);

            // Ensure both exist before attempting to disconnect
            // ... (validations similar to add)

            const updatedCoupon = await prisma.coupons.update({
                where: { id: cId },
                data: {
                    product_restrictions: {
                        disconnect: { id: pId }
                    }
                },
                include: { product_restrictions: true }
            });
            resolve(updatedCoupon);
        } catch (error) {
            if (error instanceof CustomError) return reject(error);
             if (error.code === 'P2025') { // Record to disconnect not found / not connected
                return reject(new CustomError(`Product ID ${pId} is not restricted for coupon ID ${cId} or one of them does not exist.`, NOT_FOUND));
            }
            console.error("Error removing product restriction:", error);
            return reject(new CustomError("Failed to remove product restriction from coupon.", INTERNAL_SERVER));
        }
    })
);
// Similar services can be created for user_restrictions (addUserRestriction, removeUserRestriction)

// --- Services for Coupon Redemptions ---

/**
 * Creates a coupon redemption record when a coupon is used
 */
export const createCouponRedemptionService = async (redemptionData) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            await Validator.validateNotNull({
                coupon_id: redemptionData.coupon_id,
                discount_amount: redemptionData.discount_amount
            });

            const couponId = parseIntOrNull(redemptionData.coupon_id);
            await Validator.isNumber(couponId);

            // Verify coupon exists
            const coupon = await prisma.coupons.findUnique({ where: { id: couponId } });
            if (!coupon) return reject(new CustomError(`Coupon with ID ${couponId} not found.`, NOT_FOUND));

            // Verify coupon is active
            if (!coupon.is_active) return reject(new CustomError(`Coupon ${coupon.code} is not active.`, BAD_REQUEST));

            // Verify coupon has not expired
            if (coupon.expires_at && coupon.expires_at < new Date()) {
                return reject(new CustomError(`Coupon ${coupon.code} has expired.`, BAD_REQUEST));
            }

            // Verify usage limits
            if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) {
                return reject(new CustomError(`Coupon ${coupon.code} has reached its usage limit.`, BAD_REQUEST));
            }

            // Optional order_id validation if provided
            let orderId = null;
            if (redemptionData.order_id) {
                orderId = parseIntOrNull(redemptionData.order_id);
                await Validator.isNumber(orderId);
                // Could add order existence check here if needed
            }

            // Validate discount amount
            if (isNaN(parseFloatOrNull(redemptionData.discount_amount))) {
                return reject(new CustomError("Discount amount must be a number.", BAD_REQUEST));
            }

            // Create the redemption record
            const redemption = await prisma.$transaction(async (prisma) => {
                // Increment the times_used counter on the coupon
                await prisma.coupons.update({
                    where: { id: couponId },
                    data: { times_used: { increment: 1 } }
                });

                // Create the redemption record
                return prisma.coupon_redemptions.create({
                    data: {
                        coupon_id: couponId,
                        order_id: orderId,
                        discount_amount: parseDecimalOrNull(redemptionData.discount_amount),
                        redeemed_at: new Date()
                    }
                });
            });

            return resolve(redemption);
        } catch (error) {
            if (error instanceof CustomError) return reject(error);
            console.error("Error in createCouponRedemptionService:", error);
            return reject(new CustomError("Failed to create coupon redemption.", INTERNAL_SERVER));
        }
    })
);

/**
 * Gets all redemptions for a specific coupon
 */
export const getCouponRedemptionsService = async (couponId) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            const id = parseIntOrNull(couponId);
            await Validator.isNumber(id);

            const coupon = await prisma.coupons.findUnique({ 
                where: { id },
                include: { redemptions: true }
            });

            if (!coupon) {
                return reject(new CustomError(`Coupon with ID ${id} not found.`, NOT_FOUND));
            }

            return resolve(coupon.redemptions);
        } catch (error) {
            if (error instanceof CustomError) return reject(error);
            console.error("Error in getCouponRedemptionsService:", error);
            return reject(new CustomError("Failed to retrieve coupon redemptions.", INTERNAL_SERVER));
        }
    })
);