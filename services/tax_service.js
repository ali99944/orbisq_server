import prisma from "../lib/prisma.js";
import promiseAsyncWrapper from "../lib/wrappers/promise_async_wrapper";

export const getTaxes = promiseAsyncWrapper(async (resolve, reject) => {
    const taxes = await prisma.;
    return resolve(taxes);
})