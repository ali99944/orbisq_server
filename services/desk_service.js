export const getAllDesks = (prisma) => promiseAsyncWrapper(
    async (resolve, reject) => {
        const desks = await prisma.desks.findMany();
        return resolve(desks);
    }
);