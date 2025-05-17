import prisma from '../lib/prisma.js';
import { BAD_REQUEST, NOT_FOUND, INTERNAL_SERVER } from '../lib/status_codes.js';
import CustomError from '../utils/custom_error.js';
import promiseAsyncWrapper from '../lib/wrappers/promise_async_wrapper.js';
import { parseIntOrNull, parseDateOrNull } from '../lib/parser.js';

// Helper function to get date range based on timeframe
const getDateRange = (timeframe, startDate, endDate) => {
    const now = new Date();
    let start, end;

    if (startDate && endDate) {
        // Custom date range
        start = parseDateOrNull(startDate);
        end = parseDateOrNull(endDate);
        if (!start || !end) {
            throw new CustomError('Invalid date format for start_date or end_date', BAD_REQUEST);
        }
        // For custom date range, set end date to end of day
        end.setHours(23, 59, 59, 999);
    } else {
        // Predefined timeframes
        switch (timeframe) {
            case 'today':
                start = new Date(now);
                start.setHours(0, 0, 0, 0);
                end = new Date(now);
                end.setHours(23, 59, 59, 999);
                break;
            case 'this_week':
                start = new Date(now);
                start.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
                start.setHours(0, 0, 0, 0);
                end = new Date(now);
                end.setHours(23, 59, 59, 999);
                break;
            case 'this_month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                start.setHours(0, 0, 0, 0);
                end = new Date(now);
                end.setHours(23, 59, 59, 999);
                break;
            case 'this_year':
                start = new Date(now.getFullYear(), 0, 1);
                start.setHours(0, 0, 0, 0);
                end = new Date(now);
                end.setHours(23, 59, 59, 999);
                break;
            case 'custom_period':
                throw new CustomError('For custom_period, both start_date and end_date are required', BAD_REQUEST);
            default:
                // Default to last 30 days if no valid timeframe
                start = new Date(now);
                start.setDate(now.getDate() - 30);
                start.setHours(0, 0, 0, 0);
                end = new Date(now);
                end.setHours(23, 59, 59, 999);
        }
    }

    return { start, end };
};

// Get dashboard overview data (customers, avg order value, total orders, total sales)
export const getDashboardOverviewService = async (params) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            const { timeframe, start_date, end_date, shop_id } = params;
            
            if (!shop_id) {
                return reject(new CustomError('Shop ID is required', BAD_REQUEST));
            }

            const shopId = parseIntOrNull(shop_id);
            const shop = await prisma.shops.findUnique({ 
                where: { id: shopId },
                include: { currency_info: true }
            });
            
            if (!shop) {
                return reject(new CustomError(`Shop with ID ${shopId} not found`, NOT_FOUND));
            }

            // Get date range based on timeframe
            const { start, end } = getDateRange(timeframe, start_date, end_date);

            // Get orders within the date range, excluding rejected orders
            const orders = await prisma.orders.findMany({
                where: {
                    shop_id: shopId,
                    created_at: {
                        gte: start,
                        lte: end,
                    },
                    status: {
                        not: 'cancelled'
                    }
                }
            });

            // Get all orders including rejected for status-based metrics
            const allOrders = await prisma.orders.findMany({
                where: {
                    shop_id: shopId,
                    created_at: {
                        gte: start,
                        lte: end,
                    }
                }
            });

            // Calculate status-based metrics
            const totalRejectedOrders = allOrders.filter(order => order.status === 'cancelled').length;
            const totalCompletedOrders = allOrders.filter(order => order.status === 'completed').length;
            const totalPendingOrders = allOrders.filter(order => order.status === 'pending').length;
            const totalPreparingOrders = allOrders.filter(order => order.status === 'preparing').length;

            // Calculate metrics (excluding rejected orders)
            const totalOrders = orders.length;
            const totalSales = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
            
            // Get unique customer count (based on customer_name for dine-in or takeaway_customer_name for takeaway)
            const uniqueCustomers = new Set();
            orders.forEach(order => {
                if (order.order_type === 'dine_in' && order.customer_name) {
                    uniqueCustomers.add(order.customer_name);
                } else if (order.order_type === 'takeaway' && order.takeaway_customer_name) {
                    uniqueCustomers.add(order.takeaway_customer_name);
                }
            });
            
            const customerCount = uniqueCustomers.size;
            const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

            // Get previous period for comparison
            const periodLength = end.getTime() - start.getTime();
            const prevStart = new Date(start.getTime() - periodLength);
            const prevEnd = new Date(end.getTime() - periodLength);

            const prevOrders = await prisma.orders.findMany({
                where: {
                    shop_id: shopId,
                    created_at: {
                        gte: prevStart,
                        lte: prevEnd
                    },
                    status: {
                        not: 'cancelled'
                    }
                }
            });

            // Get all previous orders including rejected for status-based metrics
            const allPrevOrders = await prisma.orders.findMany({
                where: {
                    shop_id: shopId,
                    created_at: {
                        gte: prevStart,
                        lte: prevEnd
                    }
                }
            });

            // Calculate previous period status-based metrics
            const prevTotalRejectedOrders = allPrevOrders.filter(order => order.status === 'cancelled').length;
            const prevTotalCompletedOrders = allPrevOrders.filter(order => order.status === 'completed').length;

            const prevTotalOrders = prevOrders.length;
            const prevTotalSales = prevOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
            
            // Calculate percentage changes
            const orderChange = prevTotalOrders > 0 ? ((totalOrders - prevTotalOrders) / prevTotalOrders) * 100 : 0;
            const salesChange = prevTotalSales > 0 ? ((totalSales - prevTotalSales) / prevTotalSales) * 100 : 0;
            const avgOrderChange = prevTotalOrders > 0 ? 
                (((totalSales / totalOrders) - (prevTotalSales / prevTotalOrders)) / (prevTotalSales / prevTotalOrders)) * 100 : 0;
            const rejectedOrdersChange = prevTotalRejectedOrders > 0 ? 
                ((totalRejectedOrders - prevTotalRejectedOrders) / prevTotalRejectedOrders) * 100 : 0;
            const completedOrdersChange = prevTotalCompletedOrders > 0 ? 
                ((totalCompletedOrders - prevTotalCompletedOrders) / prevTotalCompletedOrders) * 100 : 0;

            // Format the response
            const result = {
                customers: {
                    count: customerCount,
                    change_percentage: 0 // We don't have previous period customer data in this implementation
                },
                average_order_value: {
                    value: avgOrderValue,
                    currency: shop.currency_info?.currency_code || 'EGP',
                    change_percentage: avgOrderChange
                },
                total_orders: {
                    count: totalOrders,
                    change_percentage: orderChange
                },
                total_sales: {
                    value: totalSales,
                    currency: shop.currency_info?.currency_code || 'EGP',
                    change_percentage: salesChange
                },
                order_status_trends: {
                    total_rejected_orders: {
                        count: totalRejectedOrders,
                        change_percentage: rejectedOrdersChange
                    },
                    total_completed_orders: {
                        count: totalCompletedOrders,
                        change_percentage: completedOrdersChange
                    },
                    total_pending_orders: {
                        count: totalPendingOrders
                    },
                    total_preparing_orders: {
                        count: totalPreparingOrders
                    }
                },
                timeframe: {
                    start: start.toISOString(),
                    end: end.toISOString(),
                    label: timeframe || 'custom'
                }
            };

            return resolve(result);
        } catch (error) {
            if (error instanceof CustomError) return reject(error);
            console.error('Error in getDashboardOverviewService:', error);
            return reject(new CustomError('Failed to retrieve dashboard overview', INTERNAL_SERVER));
        }
    })
);

// Get top dishes by order count or revenue
export const getTopDishesService = async (params) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            const { timeframe, start_date, end_date, limit = 5, shop_id } = params;
            
            if (!shop_id) {
                return reject(new CustomError('Shop ID is required', BAD_REQUEST));
            }

            const shopId = parseIntOrNull(shop_id);
            const shop = await prisma.shops.findUnique({ where: { id: shopId } });
            
            if (!shop) {
                return reject(new CustomError(`Shop with ID ${shopId} not found`, NOT_FOUND));
            }

            // Get date range based on timeframe
            const { start, end } = getDateRange(timeframe, start_date, end_date);

            // Get top dishes by order count, excluding rejected orders
            const topDishes = await prisma.order_items.findMany({
                where: {
                    order: {
                        shop_id: shopId,
                        created_at: {
                            gte: start,
                            lte: end
                        },
                        status: {
                            not: 'cancelled'
                        }
                    }
                },
                include: {
                    product: true,
                    order: true
                }
            });

            // Group by product and calculate metrics
            const productMap = new Map();
            
            topDishes.forEach(item => {
                const productId = item.product_id;
                if (!productMap.has(productId)) {
                    productMap.set(productId, {
                        product_id: productId,
                        name: item.product?.name || 'Unknown Product',
                        order_count: 0,
                        total_quantity: 0,
                        total_revenue: 0
                    });
                }
                
                const productStats = productMap.get(productId);
                productStats.order_count++;
                productStats.total_quantity += Number(item.quantity || 0);
                productStats.total_revenue += Number(item.total_price || 0);
            });

            // Convert to array and sort by order count
            const result = Array.from(productMap.values())
                .sort((a, b) => b.order_count - a.order_count)
                .slice(0, limit)
                .map((dish, index) => ({
                    rank: index + 1,
                    product_id: dish.product_id,
                    name: dish.name,
                    order_count: dish.order_count,
                    total_quantity: dish.total_quantity,
                    total_revenue: dish.total_revenue
                }));

            return resolve({
                top_dishes: result,
                timeframe: {
                    start: start.toISOString(),
                    end: end.toISOString(),
                    label: timeframe || 'custom'
                }
            });
        } catch (error) {
            if (error instanceof CustomError) return reject(error);
            console.error('Error in getTopDishesService:', error);
            return reject(new CustomError('Failed to retrieve top dishes', INTERNAL_SERVER));
        }
    })
);

// Get top categories by order count or revenue
export const getTopCategoriesService = async (params) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            const { timeframe, start_date, end_date, limit = 5, shop_id } = params;
            
            if (!shop_id) {
                return reject(new CustomError('Shop ID is required', BAD_REQUEST));
            }

            const shopId = parseIntOrNull(shop_id);
            const shop = await prisma.shops.findUnique({ where: { id: shopId } });
            
            if (!shop) {
                return reject(new CustomError(`Shop with ID ${shopId} not found`, NOT_FOUND));
            }

            // Get date range based on timeframe
            const { start, end } = getDateRange(timeframe, start_date, end_date);

            // Get categories with their products that were ordered, excluding rejected orders
            const orderItems = await prisma.order_items.findMany({
                where: {
                    order: {
                        shop_id: shopId,
                        created_at: {
                            gte: start,
                            lte: end
                        },
                        status: {
                            not: 'cancelled'
                        }
                    }
                },
                include: {
                    product: {
                        include: {
                            product_category: true
                        }
                    }
                }
            });

            // Group by category and calculate metrics
            const categoryMap = new Map();
            
            orderItems.forEach(item => {
                if (!item.product?.product_category) return;
                
                const categoryId = item.product.product_category.id;
                if (!categoryMap.has(categoryId)) {
                    categoryMap.set(categoryId, {
                        category_id: categoryId,
                        name: item.product.product_category.name || 'Uncategorized',
                        order_count: 0,
                        total_quantity: 0,
                        total_revenue: 0
                    });
                }
                
                const categoryStats = categoryMap.get(categoryId);
                categoryStats.order_count++;
                categoryStats.total_quantity += Number(item.quantity || 0);
                categoryStats.total_revenue += Number(item.total_price || 0);
            });

            // Convert to array and sort by order count
            const result = Array.from(categoryMap.values())
                .sort((a, b) => b.order_count - a.order_count)
                .slice(0, limit)
                .map((category, index) => ({
                    rank: index + 1,
                    category_id: category.category_id,
                    name: category.name,
                    order_count: category.order_count,
                    total_quantity: category.total_quantity,
                    total_revenue: category.total_revenue
                }));

            return resolve({
                top_categories: result,
                timeframe: {
                    start: start.toISOString(),
                    end: end.toISOString(),
                    label: timeframe || 'custom'
                }
            });
        } catch (error) {
            if (error instanceof CustomError) return reject(error);
            console.error('Error in getTopCategoriesService:', error);
            return reject(new CustomError('Failed to retrieve top categories', INTERNAL_SERVER));
        }
    })
);