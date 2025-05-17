import asyncWrapper from '../lib/wrappers/async_wrapper.js';
import {
    getDashboardOverviewService,
    getTopDishesService,
    getTopCategoriesService
} from '../services/dashboard_service.js';

export const getDashboardOverviewController = asyncWrapper(
    async (req, res) => {
        const { timeframe, start_date, end_date, shop_id } = req.query;
        // Use the portal's shop_id if not specified in query
        const shopId = shop_id || req.portal?.shopId;
        
        const overview = await getDashboardOverviewService({
            timeframe,
            start_date,
            end_date,
            shop_id: shopId
        });
        
        return res.json(overview);
    }
);

export const getTopDishesController = asyncWrapper(
    async (req, res) => {
        const { timeframe, start_date, end_date, limit, shop_id } = req.query;
        // Use the portal's shop_id if not specified in query
        const shopId = shop_id || req.portal?.shopId;
        
        const topDishes = await getTopDishesService({
            timeframe,
            start_date,
            end_date,
            limit: limit ? parseInt(limit) : 5,
            shop_id: shopId
        });
        
        return res.json(topDishes);
    }
);

export const getTopCategoriesController = asyncWrapper(
    async (req, res) => {
        const { timeframe, start_date, end_date, limit, shop_id } = req.query;
        // Use the portal's shop_id if not specified in query
        const shopId = shop_id || req.portal?.shopId;
        
        const topCategories = await getTopCategoriesService({
            timeframe,
            start_date,
            end_date,
            limit: limit ? parseInt(limit) : 5,
            shop_id: shopId
        });
        
        return res.json(topCategories);
    }
);