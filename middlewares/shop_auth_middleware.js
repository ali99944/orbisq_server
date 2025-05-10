import { verifyOwnerToken } from '../services/shop_owner_service.js';
import CustomError from '../utils/custom_error.js';

export const authenticateOwner = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            throw new CustomError('No token provided', UNAUTHORIZED);
        }
        
        const decoded = await verifyOwnerToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        next(error);
    }
};

export const authenticatePortal = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            throw new CustomError('No token provided', UNAUTHORIZED);
        }
        
        // const decoded = await verifyPortalToken(token);
        req.portal = decoded;
        next();
    } catch (error) {
        next(error);
    }
};

export const checkPortalPermission = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            if (!req.portal.permissions[requiredPermission]) {
                throw new CustomError('Insufficient permissions', UNAUTHORIZED);
            }
            next();
        } catch (error) {
            next(error);
        }
    };
};