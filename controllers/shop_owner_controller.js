import asyncWrapper from '../lib/wrappers/async_wrapper.js';
import { 
    createShopOwner,
    loginShopOwner,
    getOwnerById,
    updateOwner,
    verifyOwnerToken
} from '../services/shop_owner_service.js';

export const registerOwnerController = asyncWrapper(
    async (req, res) => {
        const ownerData = req.body;
        const owner = await createShopOwner(ownerData);
        return res.status(201).json(owner);
    }
);

export const loginOwnerController = asyncWrapper(
    async (req, res) => {
        const { email, password } = req.body;
        const result = await loginShopOwner(email, password);
        return res.json(result);
    }
);

export const getOwnerController = asyncWrapper(
    async (req, res) => {
        const owner = await getOwnerById(req.user.id);
        return res.json(owner);
    }
);

export const updateOwnerController = asyncWrapper(
    async (req, res) => {
        const owner = await updateOwner(req.user.id, req.body);
        return res.json(owner);
    }
);

export const verifyTokenController = asyncWrapper(
    async (req, res) => {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        const decoded = await verifyOwnerToken(token);
        return res.json({ valid: true, user: decoded });
    }
);