// ./qr_code_service.js (or your chosen path)
import QRCode from 'qrcode';
import { createCanvas, loadImage } from 'canvas';
import fs from 'fs/promises';
import path from 'path';

const QR_CODE_CONTENT_BASE_URL = process.env.QR_CODE_CONTENT_BASE_URL || 'https://menu.orbisq.com';

/**
 * Generates the content string for the desk QR code.
 * @param {number} branchId - The ID of the branch.
 * @param {number} deskNumber - The desk number.
 * @returns {string} The QR code content string.
 */
export const generateDeskQrContent = ( deskNumber) => {
    return `${QR_CODE_CONTENT_BASE_URL}?desk=${deskNumber}`;
};

/**
 * Generates a filename for the desk QR code image.
 * @param {number} branchId
 * @param {number} deskNumber
 * @returns {string} e.g., branch_1_desk_101.png
 */
export const generateDeskQrFilename = (deskNumber) => {
    return `desk_${deskNumber}.png`;
};

/**
 * Generates a QR code image with a text label underneath it and saves it to a file.
 * @param {string} content - The string content to encode in the QR code.
 * @param {string} labelText - The text for the label (e.g., "ORBISQ").
 * @param {string} absoluteSavePath - The absolute file path to save the image.
 * @param {object} options - Optional styling for the label.
 * @param {string} options.textColor - Color of the label text (default: 'red').
 * @param {string} options.font - Font style for the label (default: 'bold 30px Arial').
 * @param {number} options.qrCodeWidth - Width of the QR code image itself (default: 256).
 * @returns {Promise<void>}
 */
export const generateAndSaveQrWithLabel = async (
    content,
    labelText = "ORBISQ",
    absoluteSavePath, // e.g., /path/to/your/app/public/qrcodes/filename.png
    options = {}
) => {
    const {
        textColor = 'red',
        font = 'bold 30px Arial',
        qrCodeWidth = 256,
    } = options;

    try {
        // Ensure directory exists
        const dir = path.dirname(absoluteSavePath);
        await fs.mkdir(dir, { recursive: true });

        const qrCodeDataURL = await QRCode.toDataURL(content, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            margin: 2,
            width: qrCodeWidth,
        });

        const qrImage = await loadImage(qrCodeDataURL);

        const tempCanvas = createCanvas(1, 1);
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.font = font;
        const textMetrics = tempCtx.measureText(labelText);
        const textHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent + 10;
        const paddingBelowQr = 5;
        const paddingBelowText = 5;

        const canvasWidth = qrImage.width;
        const canvasHeight = qrImage.height + paddingBelowQr + textHeight + paddingBelowText;

        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.drawImage(qrImage, 0, 0);

        ctx.fillStyle = textColor;
        ctx.font = font;
        ctx.textAlign = 'center';
        ctx.fillText(labelText, canvasWidth / 2, qrImage.height + paddingBelowQr + textMetrics.actualBoundingBoxAscent);

        const buffer = canvas.toBuffer('image/png');
        await fs.writeFile(absoluteSavePath, buffer);
        console.log(`QR code saved to ${absoluteSavePath}`);

    } catch (err) {
        console.error(`Failed to generate and save QR code to ${absoluteSavePath}:`, err);
        throw new Error('QR code generation and saving failed');
    }
};

/**
 * Deletes a QR code file if it exists.
 * @param {string} absoluteFilePath - The absolute path to the QR code file.
 * @returns {Promise<void>}
 */
export const deleteQrCodeFile = async (absoluteFilePath) => {
    try {
        await fs.unlink(absoluteFilePath);
        console.log(`Deleted QR code file: ${absoluteFilePath}`);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // File not found, which is fine if we're trying to delete something that might not exist
            console.log(`QR code file not found for deletion (which might be okay): ${absoluteFilePath}`);
        } else {
            console.error(`Error deleting QR code file ${absoluteFilePath}:`, error);
            // Decide if you want to throw or just log this error
            // For now, just logging as it might not be critical to fail the whole op if delete fails
        }
    }
};