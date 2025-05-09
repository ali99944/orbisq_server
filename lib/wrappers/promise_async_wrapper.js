import CustomError from "../../utils/custom_error.js";
import { INTERNAL_SERVER } from "../status_codes.js";

const promiseAsyncWrapper = (fn) =>{
    return async (resolve, reject) =>{
        try{
            await fn(resolve,reject);
        }catch(error){            
            
            let custom_error = new CustomError(error.message, INTERNAL_SERVER)
            return reject(custom_error);
        }
    }
}

export default promiseAsyncWrapper