
import jwt from 'jsonwebtoken'
import { FORBIDDEN, NOT_AUTHORIZED } from '../lib/status_codes.js'
import CustomError from '../utils/custom_error.js'
import { json_web_token_key } from '../lib/configs.js'
import asyncWrapper from '../lib/wrappers/async_wrapper.js'

const ValidateApiToken = asyncWrapper(async (req, res, next) =>{
    const { token } = req.headers

    if(!token){
        let missing_token_error = new CustomError('Please provide api token',FORBIDDEN)
        return next(missing_token_error)
    }
    
    let decoded_token = undefined

    jwt.verify(token, json_web_token_key,{},(error,decoded) =>{
        if(error){
            let not_authorized_error = new CustomError('Invalid API token, Unauthorized',NOT_AUTHORIZED)
            return next(not_authorized_error)
        }

        decoded_token = decoded
    })
    
    return next()
})


export default ValidateApiToken