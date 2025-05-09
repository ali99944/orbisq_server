import promiseAsyncWrapper from "../lib/wrappers/promise_async_wrapper";

export const getShopCategories = async () => promiseAsyncWrapper(async (resolve, reject) => {
    const categories = await prisma.product_categories.findMany();
    return resolve(categories);
})

export const createCategory = async (data) => promiseAsyncWrapper(async (resolve, reject) => {
    const category = await prisma.product_categories.create({data});
    return resolve(category);
})

export const updateCategory = async (id, data) => promiseAsyncWrapper(async (resolve, reject) => {
    const category = await prisma.product_categories.update({where: {id}, data});
    return resolve(category);
})

export const deleteCategory = async (id) => promiseAsyncWrapper(async (resolve, reject) => {
    const category = await prisma.product_categories.delete({where: {id}});
    return resolve(category);
})