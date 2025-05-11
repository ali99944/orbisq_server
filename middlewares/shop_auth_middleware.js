import { NOT_AUTHORIZED } from '../lib/status_codes.js';
import { verifyPortalToken } from '../services/shop_access_portal_service.js';
import { verifyOwnerToken } from '../services/shop_owner_service.js';
import CustomError from '../utils/custom_error.js';

export const authenticateOwner = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            throw new CustomError('No token provided', No);
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
        const token = req.headers.authorization;
        console.log(token);
        
        if (!token) {
            throw new CustomError('No token provided', NOT_AUTHORIZED);
        }
        
        const decoded = await verifyPortalToken(token);
        console.log(decoded);
        
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
                throw new CustomError('Insufficient permissions', No);
            }
            next();
        } catch (error) {
            next(error);
        }
    };
};