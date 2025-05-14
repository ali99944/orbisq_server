import { BAD_REQUEST, NOT_FOUND, INTERNAL_SERVER, CONFLICT } from "../lib/status_codes.js";
import CustomError from "../utils/custom_error.js";
import prisma from "../lib/prisma.js";
import promiseAsyncWrapper from "../lib/wrappers/promise_async_wrapper.js";
import Validator from "../lib/validator.js";
import path from 'path';
import fs from 'fs/promises'; // For checking if old file exists before deleting

// Import QR code generation utilities
import {
    generateDeskQrContent,
    generateAndSaveQrWithLabel,
    generateDeskQrFilename,
    deleteQrCodeFile
} from "./qrcode_service.js"; // Adjust path as needed

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
// --- End Configuration ---


const constructQrCodeUrl = (relativePath) => {
    if (!relativePath) return null;
    // Ensure no double slashes if APP_BASE_URL ends with / and relativePath starts with /
    return `${APP_BASE_URL.replace(/\/$/, '')}/${relativePath.replace(/^\//, '')}`;
};

// --- Helper Parsers (can be moved to a common utility if used across many services) ---
const parseIntOrNull = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const num = parseInt(value, 10);
    return isNaN(num) ? null : num;
};

const parseFloatOrNull = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
};

const parseBoolean = (value, defaultValue = undefined) => {
    if (value === null || value === undefined || value === '') {
        return defaultValue === undefined ? (value === '' ? null : value) : defaultValue;
    }
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const lowerValue = value.toLowerCase();
        if (lowerValue === 'true') return true;
        if (lowerValue === 'false') return false;
    }
    return defaultValue === undefined ? null : defaultValue; // Or throw error for invalid boolean string
};


const parseDateOrNull = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
};
// --- End Helper Parsers ---

const DESK_STATUS_ENUM = ['free', 'occupied', 'reserved', 'cleaning', 'out_of_service'];

export const createDeskService = async (deskData, portal) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            await Validator.validateNotNull({
                desk_number: deskData.desk_number,
                // branch_id: deskData.branch_id,
            });

            const deskNumber = parseInt(deskData.desk_number);
            // const branchId = parseInt(deskData.branch_id);

            await Validator.isNumber(deskNumber);
            // await Validator.isText(deskData.qrcode);
            // await Validator.isNumber(branchId);

            console.log(deskNumber);
            // console.log(branchId);
            

            // Check for uniqueness
            const existingDeskByNumber = await prisma.desks.findFirst({
                where: {
                    desk_number: +deskNumber,
                    shop_id: +portal.shopId,
                }
            });
            if (existingDeskByNumber) {
                return reject(new CustomError(`Desk with number ${deskNumber} already exists.`, CONFLICT));
            }
            // Generate QR code content
            // const qrCodeContent = generateDeskQrContent(branchId, deskNumber);

            // // Check for uniqueness of the generated QR code content
            // const existingDeskByGeneratedQrcode = await prisma.desks.findUnique({ where: { qrcode: qrCodeContent } });
            // if (existingDeskByGeneratedQrcode) {
            //     return reject(new CustomError(`Generated QR code '${qrCodeContent}' already exists. This implies a conflict or that the (branchId, deskNumber) pair leads to a duplicate QR identifier.`, CONFLICT));
            // }


            
            // Validate relations
            // const branchExists = await prisma.branches.findUnique({ where: { id: branchId } });
            // if (!branchExists) {
            //     return reject(new CustomError(`Branch with ID ${branchId} not found.`, NOT_FOUND));
            // }

            // Generate QR code details
            const qrCodeContent = generateDeskQrContent(deskNumber, portal.shopId);
            const qrCodeFilename = generateDeskQrFilename(deskNumber, portal.shopId);
            const qrCodeRelativePath = path.join('public', QR_CODES_DIR_RELATIVE, qrCodeFilename);
            const qrCodeAbsoluteSavePath = path.join(QR_CODES_DIR_ABSOLUTE, qrCodeFilename);

            // Check if this QR code file path is already in use
            const existingDeskByQrPath = await prisma.desks.findUnique({ where: { qrcode: qrCodeRelativePath } });
            if (existingDeskByQrPath) {
                return reject(new CustomError(`A QR code file named '${qrCodeFilename}' already exists for another desk. This might indicate a duplicate desk_number and branch_id combination.`, CONFLICT));
            }
            
            if (portal.shopId) {
                // shopId = parseInt(portal.shopId);
                // await Validator.isNumber(shopId);
                const shopExists = await prisma.shops.findUnique({ where: { id: parseInt(portal.shopId) } });
                if (!shopExists) return reject(new CustomError(`Shop with ID ${parseInt(portal.shopId)} not found.`, NOT_FOUND));
            }
            
            // let discountId = null;
            // if (deskData.discount_id) {
            //     discountId = parseInt(deskData.discount_id);
            //     await Validator.isNumber(discountId);
            //     const discountExists = await prisma.discounts.findUnique({ where: { id: discountId } });
            //     if (!discountExists) return reject(new CustomError(`Discount with ID ${discountId} not found.`, NOT_FOUND));
            // }

            // Validate optionals
            if (deskData.name) await Validator.isText(deskData.name);
            if (deskData.section) await Validator.isText(deskData.section);
            if (deskData.floor) await Validator.isNumber(parseInt(deskData.floor));
            if (deskData.position_x) await Validator.isNumber(parseFloat(deskData.position_x));
            if (deskData.position_y) await Validator.isNumber(parseFloat(deskData.position_y));
            if (deskData.status) await Validator.isEnum(deskData.status, DESK_STATUS_ENUM);
            if (deskData.minimum_spend) await Validator.isNumber(parseFloat(deskData.minimum_spend));
            if (deskData.maintenance_notes) await Validator.isText(deskData.maintenance_notes);
            if (deskData.number_of_seats) await Validator.isNumber(parseInt(deskData.number_of_seats));

            // Generate and save the QR code image file
            await generateAndSaveQrWithLabel(qrCodeContent, "ORBISQ", qrCodeAbsoluteSavePath);

            const dataToCreate = {
                desk_number: deskNumber,
                number_of_seats: deskData.number_of_seats ? parseInt(deskData.number_of_seats) : 2,
                qrcode: qrCodeRelativePath, 
                name: deskData.name || null,
                section: deskData.section || "main",
                floor: deskData.floor ? parseInt(deskData.floor) : 1,
                position_x: parseFloatOrNull(deskData.position_x),
                position_y: parseFloatOrNull(deskData.position_y),
                status: deskData.status || 'free',
                reservation_time: parseDateOrNull(deskData.reservation_time),
                occupation_time: parseDateOrNull(deskData.occupation_time),
                customer_id: parseIntOrNull(deskData.customer_id), // Assuming customer_id is just an int for now
                discount_id: discountId,
                minimum_spend: parseFloatOrNull(deskData.minimum_spend),
                has_outlets: parseBoolean(deskData.has_outlets, false),
                has_view: parseBoolean(deskData.has_view, false),
                is_wheelchair_accessible: parseBoolean(deskData.is_wheelchair_accessible, true),
                shop_id: portal.shopId,
                // branch_id: branchId,
                needs_cleaning: parseBoolean(deskData.needs_cleaning, false),
                is_under_maintenance: parseBoolean(deskData.is_under_maintenance, false),
                maintenance_notes: deskData.maintenance_notes || null,
            };

            const desk = await prisma.desks.create({ data: dataToCreate });
            return resolve(desk);

        } catch (error) {
            if (error instanceof CustomError) return reject(error);
            console.error("Error in createDeskService:", error);
            if (error.code === 'P2002') { // Unique constraint violation
                 return reject(new CustomError(`Desk creation failed due to unique constraint. Check desk_number or qrcode.`, CONFLICT));
            }
            return reject(new CustomError("Failed to create desk.", INTERNAL_SERVER));
        }
    })
);

export const getAllDesksService = async (queryParams, portal) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            // const {
            //     shop_id,
            //     branch_id,
            //     status,
            //     section,
            //     floor,
            //     has_outlets,
            //     is_wheelchair_accessible,
            //     page = 1,
            //     limit = 10,
            //     sortBy = 'created_at',
            //     sortOrder = 'desc',
            //     search // for name or desk_number
            // } = queryParams;

            // const filters = {};
            // if (shop_id) filters.shop_id = parseInt(shop_id);
            // if (branch_id) filters.branch_id = parseInt(branch_id);
            // if (status) {
            //     await Validator.isEnum(status, DESK_STATUS_ENUM);
            //     filters.status = status;
            // }
            // if (section) filters.section = section;
            // if (floor) filters.floor = parseInt(floor);
            // if (has_outlets !== undefined) filters.has_outlets = parseBoolean(has_outlets);
            // if (is_wheelchair_accessible !== undefined) filters.is_wheelchair_accessible = parseBoolean(is_wheelchair_accessible);


            // if (search) {
            //     filters.OR = [
            //         { name: { contains: search, mode: 'insensitive' } },
            //     ];
            //     if (!isNaN(parseInt(search))) {
            //         filters.OR.push({ desk_number: parseInt(search) });
            //     }
            // }

            // const desks = await prisma.desks.findMany({
            //     where: filters,
            //     include: {
            //         shop: true,
            //         branch: true,
            //         discount: true,
            //     },
            //     orderBy: { [sortBy]: sortOrder },
            //     skip: (parseInt(page) - 1) * parseInt(limit),
            //     take: parseInt(limit),
            // });

            // const totalDesks = await prisma.desks.count({ where: filters });

            // return resolve({
            //     data: desks,
            //     meta: {
            //         total: totalDesks,
            //         page: parseInt(page),
            //         limit: parseInt(limit),
            //         totalPages: Math.ceil(totalDesks / parseInt(limit)),
            //     },
            // });

            const desks = await prisma.desks.findMany({
                where: {
                    shop_id: portal.shopId,
                }
            })

            return resolve(desks)
        } catch (error) {
            if (error instanceof CustomError) return reject(error);
            console.error("Error in getAllDesksService:", error);
            return reject(new CustomError("Failed to retrieve desks.", INTERNAL_SERVER));
        }
    })
);

export const getDeskByIdService = async (deskId) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            const id = parseInt(deskId);
            await Validator.isNumber(id);

            const desk = await prisma.desks.findUnique({
                where: { id },
                include: {
                    shop: true,
                    branch: true,
                    discount: true,
                },
            });

            if (!desk) {
                return reject(new CustomError(`Desk with ID ${id} not found.`, NOT_FOUND));
            }
            return resolve(desk);
        } catch (error) {
            if (error instanceof CustomError) return reject(error);
            console.error("Error in getDeskByIdService:", error);
            return reject(new CustomError("Failed to retrieve desk.", INTERNAL_SERVER));
        }
    })
);

export const updateDeskService = async (deskId, updateData) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            const id = parseInt(deskId);
            await Validator.isNumber(id);

            const existingDesk = await prisma.desks.findUnique({ where: { id } });
            if (!existingDesk) {
                return reject(new CustomError(`Desk with ID ${id} not found to update.`, NOT_FOUND));
            }

            const dataToUpdate = {};

            if (updateData.desk_number !== undefined) {
                const deskNumber = parseInt(updateData.desk_number);
                await Validator.isNumber(deskNumber);
                if (deskNumber !== existingDesk.desk_number) {
                    const conflictingDesk = await prisma.desks.findFirst({
                        where: {
                            desk_number: deskNumber,
                            shop_id: existingDesk.shop_id,
                            id: { not: id }
                        }
                    });
                    if (conflictingDesk) return reject(new CustomError(`Desk number ${deskNumber} is already in use.`, CONFLICT));
                }
                dataToUpdate.desk_number = deskNumber;
            }
            if (updateData.qrcode !== undefined) {
                await Validator.isText(updateData.qrcode);
                 if (updateData.qrcode !== existingDesk.qrcode) {
                    const conflictingDesk = await prisma.desks.findUnique({ where: { qrcode: updateData.qrcode } });
                    if (conflictingDesk) return reject(new CustomError(`QR code ${updateData.qrcode} is already in use.`, CONFLICT));
                }
                dataToUpdate.qrcode = updateData.qrcode;
            }
            if (updateData.branch_id !== undefined) {
                const branchId = parseInt(updateData.branch_id);
                await Validator.isNumber(branchId);
                const branchExists = await prisma.branches.findUnique({ where: { id: branchId } });
                if (!branchExists) return reject(new CustomError(`Branch with ID ${branchId} not found.`, NOT_FOUND));
                dataToUpdate.branch_id = branchId;
            }
             if (updateData.shop_id !== undefined) {
                if(updateData.shop_id === null || updateData.shop_id === '') {
                    dataToUpdate.shop_id = null;
                } else {
                    const shopId = parseInt(updateData.shop_id);
                    await Validator.isNumber(shopId);
                    const shopExists = await prisma.shops.findUnique({ where: { id: shopId } });
                    if (!shopExists) return reject(new CustomError(`Shop with ID ${shopId} not found.`, NOT_FOUND));
                    dataToUpdate.shop_id = shopId;
                }
            }
            if (updateData.discount_id !== undefined) {
                if(updateData.discount_id === null || updateData.discount_id === '') {
                    dataToUpdate.discount_id = null;
                } else {
                    const discountId = parseInt(updateData.discount_id);
                    await Validator.isNumber(discountId);
                    const discountExists = await prisma.discounts.findUnique({ where: { id: discountId } });
                    if (!discountExists) return reject(new CustomError(`Discount with ID ${discountId} not found.`, NOT_FOUND));
                    dataToUpdate.discount_id = discountId;
                }
            }

            // Optional fields
            if (updateData.name !== undefined) dataToUpdate.name = updateData.name === '' ? null : updateData.name;
            if (updateData.number_of_seats !== undefined) dataToUpdate.number_of_seats = parseInt(updateData.number_of_seats);
            if (updateData.section !== undefined) dataToUpdate.section = updateData.section === '' ? null : updateData.section;
            if (updateData.floor !== undefined) dataToUpdate.floor = parseIntOrNull(updateData.floor);
            if (updateData.position_x !== undefined) dataToUpdate.position_x = parseFloatOrNull(updateData.position_x);
            if (updateData.position_y !== undefined) dataToUpdate.position_y = parseFloatOrNull(updateData.position_y);
            if (updateData.status !== undefined) {
                await Validator.isEnum(updateData.status, DESK_STATUS_ENUM);
                dataToUpdate.status = updateData.status;
            }
            if (updateData.reservation_time !== undefined) dataToUpdate.reservation_time = parseDateOrNull(updateData.reservation_time);
            if (updateData.occupation_time !== undefined) dataToUpdate.occupation_time = parseDateOrNull(updateData.occupation_time);
            if (updateData.customer_id !== undefined) dataToUpdate.customer_id = parseIntOrNull(updateData.customer_id);
            if (updateData.minimum_spend !== undefined) dataToUpdate.minimum_spend = parseFloatOrNull(updateData.minimum_spend);
            if (updateData.has_outlets !== undefined) dataToUpdate.has_outlets = parseBoolean(updateData.has_outlets);
            if (updateData.has_view !== undefined) dataToUpdate.has_view = parseBoolean(updateData.has_view);
            if (updateData.is_wheelchair_accessible !== undefined) dataToUpdate.is_wheelchair_accessible = parseBoolean(updateData.is_wheelchair_accessible);
            if (updateData.needs_cleaning !== undefined) dataToUpdate.needs_cleaning = parseBoolean(updateData.needs_cleaning);
            if (updateData.is_under_maintenance !== undefined) dataToUpdate.is_under_maintenance = parseBoolean(updateData.is_under_maintenance);
            if (updateData.maintenance_notes !== undefined) dataToUpdate.maintenance_notes = updateData.maintenance_notes === '' ? null : updateData.maintenance_notes;


            if (Object.keys(dataToUpdate).length === 0) {
                return reject(new CustomError("No valid fields provided for update.", BAD_REQUEST));
            }
            dataToUpdate.updated_at = new Date();

            const updatedDesk = await prisma.desks.update({
                where: { id },
                data: dataToUpdate,
            });
            return resolve(updatedDesk);

        } catch (error) {
            if (error instanceof CustomError) return reject(error);
            console.error("Error in updateDeskService:", error);
             if (error.code === 'P2002') {
                 return reject(new CustomError(`Update failed due to unique constraint. Check desk_number or qrcode.`, CONFLICT));
            }
            return reject(new CustomError("Failed to update desk.", INTERNAL_SERVER));
        }
    })
);

export const deleteDeskService = async (deskId) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            const id = parseInt(deskId);
            await Validator.isNumber(id);

            const existingDesk = await prisma.desks.findUnique({ where: { id } });
            if (!existingDesk) {
                return reject(new CustomError(`Desk with ID ${id} not found to delete.`, NOT_FOUND));
            }

            // Check for active orders or reservations before deleting (important!)
            const activeOrders = await prisma.orders.count({ where: { desk_id: id, /* Add status for active orders */ }});
            if(activeOrders > 0){
                return reject(new CustomError(`Cannot delete desk. It has ${activeOrders} associated active order(s).`, BAD_REQUEST));
            }
            // Add more checks if needed (e.g., if status is 'occupied' or 'reserved')

            await prisma.desks.delete({ where: { id } });
            return resolve({ message: "Desk deleted successfully." });

        } catch (error) {
            if (error instanceof CustomError) return reject(error);
            console.error("Error in deleteDeskService:", error);
            if (error.code === 'P2003') { // Foreign key constraint failed
                 return reject(new CustomError("Cannot delete desk. It is referenced by other records.", BAD_REQUEST));
            }
            return reject(new CustomError("Failed to delete desk.", INTERNAL_SERVER));
        }
    })
);


export const updateDeskStatusService = async (deskId, updateData) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            const id = parseInt(deskId);
            await Validator.isNumber(id);

            const existingDesk = await prisma.desks.findUnique({ where: { id } });
            if (!existingDesk) {
                return reject(new CustomError(`Desk with ID ${id} not found to update status.`, NOT_FOUND));
            }

            await Validator.isEnum(updateData.status, DESK_STATUS_ENUM);
            
            const updatedDesk = await prisma.desks.update({
                where: { id },
                data: { status: updateData.status },
            });
            return resolve(updatedDesk);

        } catch (error) {
            if (error instanceof CustomError) return reject(error);
            console.error("Error in updateDeskStatusService:", error);
            return reject(new CustomError("Failed to update desk status.", INTERNAL_SERVER));
        }
    })
)

export const generateMultipleDesksService = async (rangeData, portal) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            await Validator.validateNotNull({
                start_range: rangeData.start_range,
                end_range: rangeData.end_range,
            });

            const startRange = parseInt(rangeData.start_range);
            const endRange = parseInt(rangeData.end_range);

            await Validator.isNumber(startRange);
            await Validator.isNumber(endRange);

            if (startRange > endRange) {
                return reject(new CustomError("Start range cannot be greater than end range.", BAD_REQUEST));
            }

            if ((endRange - startRange) > 100) {
                return reject(new CustomError("Cannot create more than 100 desks at once.", BAD_REQUEST));
            }

            // Validate optional common properties that will apply to all created desks
            if (rangeData.section) await Validator.isText(rangeData.section);
            if (rangeData.floor) await Validator.isNumber(parseInt(rangeData.floor));
            if (rangeData.number_of_seats) await Validator.isNumber(parseInt(rangeData.number_of_seats));
            if (rangeData.has_outlets !== undefined) parseBoolean(rangeData.has_outlets);
            if (rangeData.has_view !== undefined) parseBoolean(rangeData.has_view);
            if (rangeData.is_wheelchair_accessible !== undefined) parseBoolean(rangeData.is_wheelchair_accessible);
            if (rangeData.minimum_spend) await Validator.isNumber(parseFloat(rangeData.minimum_spend));

            const shopId = parseInt(portal.shopId);
            const shopExists = await prisma.shops.findUnique({ where: { id: shopId } });
            if (!shopExists) {
                return reject(new CustomError(`Shop with ID ${shopId} not found.`, NOT_FOUND));
            }

            // Check for existing desk numbers within the range
            const existingDesks = await prisma.desks.findMany({
                where: {
                    desk_number: {
                        gte: startRange,
                        lte: endRange
                    },
                    shop_id: shopId
                },
                select: {
                    desk_number: true
                }
            });

            if (existingDesks.length > 0) {
                const existingNumbers = existingDesks.map(desk => desk.desk_number);
                return reject(new CustomError(`Desk numbers ${existingNumbers.join(', ')} already exist in the specified range.`, CONFLICT));
            }

            // Create desks within the range
            const createdDesks = [];
            for (let deskNumber = startRange; deskNumber <= endRange; deskNumber++) {
                // Generate QR code details for this desk
                const qrCodeContent = generateDeskQrContent(deskNumber, shopId);
                const qrCodeFilename = generateDeskQrFilename(deskNumber, shopId);
                const qrCodeRelativePath = path.join('public', QR_CODES_DIR_RELATIVE, qrCodeFilename);
                const qrCodeAbsoluteSavePath = path.join(QR_CODES_DIR_ABSOLUTE, qrCodeFilename);

                // Generate and save the QR code image file
                await generateAndSaveQrWithLabel(qrCodeContent, "ORBISQ", qrCodeAbsoluteSavePath);

                // Create the desk with common properties
                const deskData = {
                    desk_number: deskNumber,
                    qrcode: qrCodeRelativePath,
                    name: rangeData.name_prefix ? `${rangeData.name_prefix} ${deskNumber}` : null,
                    section: rangeData.section || "main",
                    floor: rangeData.floor ? parseInt(rangeData.floor) : 1,
                    number_of_seats: rangeData.number_of_seats ? parseInt(rangeData.number_of_seats) : 2,
                    status: 'free',
                    shop_id: shopId,
                    has_outlets: parseBoolean(rangeData.has_outlets, false),
                    has_view: parseBoolean(rangeData.has_view, false),
                    is_wheelchair_accessible: parseBoolean(rangeData.is_wheelchair_accessible, true),
                    minimum_spend: parseFloatOrNull(rangeData.minimum_spend),
                    needs_cleaning: false,
                    is_under_maintenance: false,
                    position_x: null, // These would need individual setting later
                    position_y: null
                };

                const desk = await prisma.desks.create({ data: deskData });
                createdDesks.push(desk);
            }

            return resolve({
                message: `Successfully created ${createdDesks.length} desks from number ${startRange} to ${endRange}.`,
                count: createdDesks.length,
                desks: createdDesks
            });

        } catch (error) {
            if (error instanceof CustomError) return reject(error);
            console.error("Error in generateMultipleDesksService:", error);
            
            // Clean up any created QR codes if there's an error
            if (error.createdQrCodes && error.createdQrCodes.length > 0) {
                for (const qrPath of error.createdQrCodes) {
                    try {
                        await deleteQrCodeFile(qrPath);
                    } catch (cleanupError) {
                        console.error("Error cleaning up QR code files:", cleanupError);
                    }
                }
            }
            
            return reject(new CustomError("Failed to generate multiple desks.", INTERNAL_SERVER));
        }
    })
);