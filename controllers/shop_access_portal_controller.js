import { asyncWrapper } from '../helpers/wrappers/async_wrapper.js';
import { 
    createShopAccessPortal,
    loginShopPortal,
    getShopPortals,
    updateShopPortal,
    // verifyPortalToken
} from '../services/shop_access_portal_service.js';

export const createPortalController = asyncWrapper(
    async (req, res) => {
        const portal = await createShopAccessPortal(req.params.shopId, req.body);
        return res.status(201).json(portal);
    }
);

export const loginPortalController = asyncWrapper(
    async (req, res) => {
        const { username, password } = req.body;
        const result = await loginShopPortal(username, password);
        return res.json(result);
    }
);

export const getPortalsController = asyncWrapper(
    async (req, res) => {
        const portals = await getShopPortals(req.params.shopId);
        return res.json(portals);
    }
);

export const updatePortalController = asyncWrapper(
    async (req, res) => {
        const portal = await updateShopPortal(req.params.portalId, req.body);
        return res.json(portal);
    }
);

// export const verifyPortalTokenController = asyncWrapper(
//     async (req, res) => {
//         const token = req.headers.authorization?.split(' ')[1];
//         if (!token) {
//             return res.status(401).json({ error: 'No token provided' });
//         }
        
//         const decoded = await verifyPortalToken(token);
//         return res.json({ valid: true, portal: decoded });
//     }
// );