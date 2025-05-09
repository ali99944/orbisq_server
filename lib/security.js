import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import { admin_web_token_key, json_web_token_expires_in, json_web_token_key } from './configs.js'

export const encryptPassword = async (password) => await argon2.hash(password)


export const verifyPassword = async (password, hash) => await argon2.verify(hash, password)

/**
 * @type {import('jsonwebtoken').SignOptions}
 */
export const generateToken = (payload) => jwt.sign(
    payload, 
    json_web_token_key, 
    { expiresIn: json_web_token_expires_in }
)

/**
 * @type {import('jsonwebtoken').VerifyOptions}
 */
export const verifyToken = (token) => jwt.verify(token, json_web_token_key)



export const generateAdminToken = (payload) => jwt.sign(payload, admin_web_token_key)

export const verifyAdminToken = (token) => jwt.verify(token, admin_web_token_key)