export const getProducts = async () => promiseAsyncWrapper(async (resolve, reject) => {
    const products = await prisma.products.findMany();
    return resolve(products);
})

export const createProduct = async (data) => promiseAsyncWrapper(async (resolve, reject) => {
    const product = await prisma.products.create({data});
    return resolve(product);
})

export const updateProduct = async (id, data) => promiseAsyncWrapper(async (resolve, reject) => {
    const product = await prisma.products.update({where: {id}, data});
    return resolve(product);
})

export const deleteProduct = async (id) => promiseAsyncWrapper(async (resolve, reject) => {
    const product = await prisma.products.delete({where: {id}});
    return resolve(product);
})