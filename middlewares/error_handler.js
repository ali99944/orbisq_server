import logger from "../lib/logger.js"

const ErrorHandlerMiddleware = (error, req, res, next) => {
    logger.error(error.message)

    return res.status(error.status).json({
        error: error.message,
    })
}


export default ErrorHandlerMiddleware