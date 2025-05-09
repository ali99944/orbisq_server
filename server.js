import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import compression from "compression";
import cookieParser from "cookie-parser";
import ErrorHandlerMiddleware from "./middlewares/error_handler.js";
import { host, port, validateConfigFile } from "./lib/configs.js";
import { NOT_FOUND } from "./lib/status_codes.js";
import logger from "./lib/logger.js";

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express();

app.use(cors());
app.use(express.json());

app.use('/storage', express.static(path.join(__dirname, './public')))

app.use(compression())
app.use(cookieParser())


app.get("/", (req, res) => {
    res.send("Hello World!");
});



const main = async () => {
    try{
        validateConfigFile()
        app.use(
            '/api',
            (await import('./routes/categories_route.js')).default
        )

        app.get('*', (req ,res) => {
            return res.status(NOT_FOUND).json({
                error: '404 Not Found',
                url: req.url
            })
        })

        app.use(ErrorHandlerMiddleware)

        app.listen(port, () => console.log(`[server] listening on ${host}:${port}`))
    }catch(err){
        logger.error(err.message)
    }
}

main()