import CustomError from "../utils/custom_error.js";
import prisma from "./prisma.js";
import { BAD_REQUEST } from "./status_codes.js";
import promiseAsyncWrapper from "./wrappers/promise_async_wrapper.js";

/**
 * 
 * @param {string} token 
 * @returns {Promise<import('@prisma/client').Shop>}
 */
export const getShopByToken = async (token) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        const shop = await prisma.shops.findUnique({
            where: { token },
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

        return resolve(shop);
    })
);