import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({
    path: path.join(__dirname, '../.env')
})

// import { readFileSync } from 'fs'
// import Handlebars from 'handlebars'

export const json_web_token_key = process.env.JSON_WEB_TOKEN_KEY
export const json_web_token_expires_in = process.env.WEB_TOKEN_EXPIRES_IN

export const admin_web_token_key = process.env.ADMIN_WEB_TOKEN_KEY

export const mail_host = process.env.MAIL_HOST || "smtp.ethereal.email";
export const mail_port = process.env.MAIL_PORT || 587;
export const mail_username = process.env.MAIL_USERNAME || "yourEmail@gmail.com";
export const mail_password = process.env.MAIL_PASSWORD || "yourPassword";

// export const mail_activation_template = readFileSync('templates/mail_activation.html', 'utf8')
// export const compiled_mail_activation_template = Handlebars.compile(mail_activation_template)


export const port = process.env.PORT
export const host = process.env.HOST

export const environment = process.env.NODE_ENV
export const is_development = environment === 'development'

export const validateConfigFile = () => {
    if (!json_web_token_key) {
        throw new Error('JSON_WEB_TOKEN_KEY is not defined in .env file');
    }
    if (!json_web_token_expires_in) {
        throw new Error('JSON_WEB_TOKEN_EXPIRES_IN is not defined in .env file');
    }
    if (!mail_host) {
        throw new Error('MAIL_HOST is not defined in .env file');
    }
    if (!mail_port) {
        throw new Error('MAIL_PORT is not defined in .env file');
    }
    if (!mail_username) {
        throw new Error('MAIL_USERNAME is not defined in .env file');
    }
    if (!mail_password) {
        throw new Error('MAIL_PASSWORD is not defined in .env file');
    }
}