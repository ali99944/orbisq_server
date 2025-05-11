import {
    generateDeskQrContent,
    generateAndSaveQrWithLabel,
    generateDeskQrFilename,
    deleteQrCodeFile
} from "./qrcode_service.js";
import path from "path";


// --- Configuration for QR Code Paths ---
// Absolute path to your public directory. Adjust if your project structure is different.
const PUBLIC_DIR_ABSOLUTE = path.resolve(process.cwd(), 'public');
// Relative path for QR codes within the public directory.
const QR_CODES_DIR_RELATIVE = 'qrcodes';
// Absolute path to the QR codes directory.
const QR_CODES_DIR_ABSOLUTE = path.join(PUBLIC_DIR_ABSOLUTE, QR_CODES_DIR_RELATIVE);
// Base URL of your application, used for constructing full QR code image URLs.
// IMPORTANT: Set this in your .env file (e.g., APP_BASE_URL=http://localhost:3000)
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';

if (!process.env.APP_BASE_URL) {
    console.warn("WARN: APP_BASE_URL environment variable is not set. QR code URLs might be incorrect. Defaulting to http://localhost:3000");
}

const constructQrCodeUrl = (relativePath) => {
    if (!relativePath) return null;
    // Ensure no double slashes if APP_BASE_URL ends with / and relativePath starts with /
    return `${APP_BASE_URL.replace(/\/$/, '')}/${relativePath.replace(/^\//, '')}`;
};

// Generate QR code details
const qrCodeContent = generateDeskQrContent(branchId, deskNumber);
const qrCodeFilename = generateDeskQrFilename(branchId, deskNumber);
const qrCodeRelativePath = path.join(QR_CODES_DIR_RELATIVE, qrCodeFilename);
const qrCodeAbsoluteSavePath = path.join(QR_CODES_DIR_ABSOLUTE, qrCodeFilename);