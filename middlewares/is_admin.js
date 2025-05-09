import { verifyAdminToken } from "../lib/security.js";
import { INTERNAL_SERVER, NOT_AUTHORIZED } from "../lib/status_codes.js";
import asyncWrapper from "../lib/wrappers/async_wrapper.js";
import CustomError from "../utils/custom_error.js";

const isAdmin = asyncWrapper(
    (req,res,next) =>{

        let token = req.headers.authorization;

        if(!token){
            const not_authorized_error = new CustomError('You are not authenticated',INTERNAL_SERVER)
            return next(not_authorized_error)
        }
    
        const payload = verifyAdminToken(token);
    
        if(payload){
            return next();
        }
    
        const not_authorized_error = new CustomError('Not authorized',NOT_AUTHORIZED)
        return next(not_authorized_error)
    }
)


export default isAdmin