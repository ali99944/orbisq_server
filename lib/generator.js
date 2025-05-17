export const generateReferenceCode = (prefix, length = 8) => `${prefix}-${Math.random().toString(36).substring(2, length)}`;

export const generateOrderNumber = async (prisma, shopId) => {
    // Example: ORD-SHOPID-YYYYMMDD-NNNN (daily sequence per shop)
    // This is a simplified example. A robust sequential generator needs careful handling of concurrency
    // or use a timestamp-random based approach if strict sequence isn't critical.
    // const today = new Date();
    // const year = today.getFullYear();
    // const month = (today.getMonth() + 1).toString().padStart(2, '0');
    // const day = today.getDate().toString().padStart(2, '0');
    // const datePrefix = `${year}${month}${day}`;

    // Find the last order number for this shop today to increment
    // This part is complex for true sequential, race-condition-free generation.
    // For now, let's use a simpler timestamp-based one for easier implementation here.
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    // return `ORD-${shopId}-${datePrefix}-${randomSuffix}`;
    return `ORD-${shopId}-${randomSuffix}`;

    // A more robust sequential approach might involve a separate sequence table or retry logic.
};