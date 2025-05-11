import prisma from "../lib/prisma.js";
import { BAD_REQUEST, NOT_FOUND, INTERNAL_SERVER, CONFLICT } from "../lib/status_codes.js";
import Validator from "../lib/validator.js";
// import { parseIntOrNull, parseFloatOrNull, parseBoolean, parseDateOrNull } from "../lib/parsers.js"; // Adjust path
// import { BRANCH_STATUS_ENUM, DAY_OF_WEEK_ENUM } from "../utils/constants.js"; // Adjust path
import promiseAsyncWrapper from "../lib/wrappers/promise_async_wrapper.js";
import CustomError from "../utils/custom_error.js";
import { parseBoolean, parseDateOrNull, parseFloatOrNull, parseIntOrNull } from "../lib/parser.js";
import { BRANCH_STATUS_ENUM, DAY_OF_WEEK_ENUM, slugify } from "../lib/slugify.js";

// --- Helper for Operating Hours Validation ---
const validateOperatingHoursInput = async (operatingHours) => {
    if (!Array.isArray(operatingHours)) {
        throw new CustomError("Operating hours must be an array.", BAD_REQUEST);
    }
    for (const oh of operatingHours) {
        await Validator.validateNotNull({ day_of_week: oh.day_of_week });
        await Validator.isEnum(oh.day_of_week.toLowerCase(), DAY_OF_WEEK_ENUM, `Invalid day_of_week: ${oh.day_of_week}`);

        if (parseBoolean(oh.is_closed, false) === false) { // Only validate times if not closed
            await Validator.validateNotNull({ opening_time: oh.opening_time, closing_time: oh.closing_time });
            // Basic time format validation (HH:MM)
            const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
            if (!timeRegex.test(oh.opening_time)) {
                throw new CustomError(`Invalid opening_time format for ${oh.day_of_week}. Expected HH:MM.`, BAD_REQUEST);
            }
            if (!timeRegex.test(oh.closing_time)) {
                throw new CustomError(`Invalid closing_time format for ${oh.day_of_week}. Expected HH:MM.`, BAD_REQUEST);
            }
            // Optionally: check if closing_time is after opening_time
        }
    }
};


export const createBranchService = async (branchData, operatingHoursData) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        const { name, code, shop_id, /* ... other fields ... */ } = branchData;
        try {
            await Validator.validateNotNull({ name, code, shop_id });
            await Validator.isText(name);
            await Validator.isText(code);
            const parsedShopId = parseInt(shop_id);
            await Validator.isNumber(parsedShopId);

            const slug = slugify(name); // Auto-generate slug

            // Check for uniqueness
            const existingByCode = await prisma.branches.findUnique({ where: { code } });
            if (existingByCode) return reject(new CustomError(`Branch with code ${code} already exists.`, CONFLICT));
            const existingBySlug = await prisma.branches.findUnique({ where: { slug } });
            if (existingBySlug) return reject(new CustomError(`Branch with name resulting in slug '${slug}' already exists. Choose a different name.`, CONFLICT));

            // Validate relations
            const shopExists = await prisma.shops.findUnique({ where: { id: parsedShopId } });
            if (!shopExists) return reject(new CustomError(`Shop with ID ${parsedShopId} not found.`, NOT_FOUND));

            let addressId = null;
            if (branchData.address_id) {
                addressId = parseInt(branchData.address_id);
                await Validator.isNumber(addressId);
                const addressExists = await prisma.addresses.findUnique({ where: { id: addressId } });
                if (!addressExists) return reject(new CustomError(`Address with ID ${addressId} not found.`, NOT_FOUND));
            }
            let managerId = null;
            if (branchData.manager_id) {
                managerId = parseInt(branchData.manager_id);
                await Validator.isNumber(managerId);
                // Assuming you have a users table for managers
                // const managerExists = await prisma.users.findUnique({ where: { id: managerId } });
                // if (!managerExists) return reject(new CustomError(`Manager with ID ${managerId} not found.`, NOT_FOUND));
            }
            
            if (branchData.status) await Validator.isEnum(branchData.status, BRANCH_STATUS_ENUM);
            if (branchData.contact_email) await Validator.isEmail(branchData.contact_email);
            // Add more specific validations for geo_latitude, geo_longitude, total_capacity etc.


            const dataToCreate = {
                name,
                code,
                slug,
                is_main: parseBoolean(branchData.is_main, false),
                status: branchData.status || 'active',
                opening_date: parseDateOrNull(branchData.opening_date),
                timezone: branchData.timezone || 'UTC',
                locale: branchData.locale || 'en-US',
                tax_id_number: branchData.tax_id_number || null,
                manager_id: managerId,
                contact_person: branchData.contact_person || null,
                contact_email: branchData.contact_email || null,
                contact_phone: branchData.contact_phone || null,
                accepts_reservations: parseBoolean(branchData.accepts_reservations, true),
                accepts_walkins: parseBoolean(branchData.accepts_walkins, true),
                has_delivery: parseBoolean(branchData.has_delivery, false),
                has_pickup: parseBoolean(branchData.has_pickup, true),
                has_dine_in: parseBoolean(branchData.has_dine_in, true),
                geo_latitude: parseFloatOrNull(branchData.geo_latitude),
                geo_longitude: parseFloatOrNull(branchData.geo_longitude),
                map_link: branchData.map_link || null,
                total_capacity: parseIntOrNull(branchData.total_capacity),
                // current_occupancy, monthly_sales, average_rating are usually derived, not set directly at creation.
                shop_id: parsedShopId,
                address_id: addressId,
            };

            const newBranch = await prisma.$transaction(async (tx) => {
                const createdBranch = await tx.branches.create({ data: dataToCreate });

                if (operatingHoursData && operatingHoursData.length > 0) {
                    await validateOperatingHoursInput(operatingHoursData); // Validate before trying to create
                    
                    const operatingHoursToCreate = operatingHoursData.map(oh => ({
                        branch_id: createdBranch.id,
                        day_of_week: oh.day_of_week.toLowerCase(),
                        opening_time: parseBoolean(oh.is_closed, false) ? null : oh.opening_time,
                        closing_time: parseBoolean(oh.is_closed, false) ? null : oh.closing_time,
                        is_closed: parseBoolean(oh.is_closed, false),
                        special_note: oh.special_note || null,
                    }));
                    await tx.branch_operating_hours.createMany({
                        data: operatingHoursToCreate
                    });
                }
                // Fetch the branch again with operating hours to return it
                return tx.branches.findUnique({
                    where: { id: createdBranch.id },
                    include: { operating_hours: true, shop: true, address: true }
                });
            });

            return resolve(newBranch);

        } catch (error) {
            if (error instanceof CustomError) return reject(error);
            console.error("Error in createBranchService:", error);
            if (error.code === 'P2002') { // Unique constraint violation
                 const target = error.meta?.target;
                 if (target?.includes('code')) return reject(new CustomError(`Branch code '${branchData.code}' already exists.`, CONFLICT));
                 if (target?.includes('slug')) return reject(new CustomError(`Branch name resulting in slug already exists.`, CONFLICT));
            }
            return reject(new CustomError("Failed to create branch.", INTERNAL_SERVER));
        }
    })
);

export const getAllBranchesService = async (queryParams) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            // const {
            //     shop_id, status, is_main, has_delivery, has_pickup, has_dine_in,
            //     page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc',
            //     search // For name, code, slug
            // } = queryParams;

            // const filters = {};
            // if (shop_id) filters.shop_id = parseInt(shop_id);
            // if (status) {
            //     await Validator.isEnum(status, BRANCH_STATUS_ENUM);
            //     filters.status = status;
            // }
            // if (is_main !== undefined) filters.is_main = parseBoolean(is_main);
            // if (has_delivery !== undefined) filters.has_delivery = parseBoolean(has_delivery);
            // if (has_pickup !== undefined) filters.has_pickup = parseBoolean(has_pickup);
            // if (has_dine_in !== undefined) filters.has_dine_in = parseBoolean(has_dine_in);

            // if (search) {
            //     filters.OR = [
            //         { name: { contains: search, mode: 'insensitive' } },
            //         { code: { contains: search, mode: 'insensitive' } },
            //         { slug: { contains: search, mode: 'insensitive' } }
            //     ];
            // }

            // const branches = await prisma.branches.findMany({
            //     where: filters,
            //     include: {
            //         shop: true,
            //         address: true,
            //         operating_hours: { orderBy: { day_of_week: 'asc' } }, // Order operating hours
            //     },
            //     orderBy: { [sortBy]: sortOrder },
            //     skip: (parseInt(page) - 1) * parseInt(limit),
            //     take: parseInt(limit),
            // });
            // const totalBranches = await prisma.branches.count({ where: filters });

            // return resolve({
            //     data: branches,
            //     meta: {
            //         total: totalBranches,
            //         page: parseInt(page),
            //         limit: parseInt(limit),
            //         totalPages: Math.ceil(totalBranches / parseInt(limit)),
            //     },
            // });

            const branches = await prisma.branches.findMany({})

            return resolve(branches)
        } catch (error) {
            if (error instanceof CustomError) return reject(error);
            console.error("Error in getAllBranchesService:", error);
            return reject(new CustomError("Failed to retrieve branches.", INTERNAL_SERVER));
        }
    })
);

export const getBranchByIdOrSlugService = async (identifier) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            let branch;
            if (!isNaN(parseInt(identifier))) { // It's an ID
                branch = await prisma.branches.findUnique({
                    where: { id: parseInt(identifier) },
                    include: { shop: true, address: true, operating_hours: true, desks: true, /* manager: true */ }
                });
            } else { // It's a slug
                branch = await prisma.branches.findUnique({
                    where: { slug: identifier },
                    include: { shop: true, address: true, operating_hours: true, desks: true, /* manager: true */ }
                });
            }

            if (!branch) {
                return reject(new CustomError(`Branch with identifier '${identifier}' not found.`, NOT_FOUND));
            }
            return resolve(branch);
        } catch (error) {
            if (error instanceof CustomError) return reject(error);
            console.error("Error in getBranchByIdOrSlugService:", error);
            return reject(new CustomError("Failed to retrieve branch.", INTERNAL_SERVER));
        }
    })
);


export const updateBranchService = async (branchId, branchData, operatingHoursData) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            const id = parseInt(branchId);
            await Validator.isNumber(id);

            const existingBranch = await prisma.branches.findUnique({ where: { id } });
            if (!existingBranch) return reject(new CustomError(`Branch with ID ${id} not found to update.`, NOT_FOUND));

            const dataToUpdate = { updated_at: new Date() };

            if (branchData.name !== undefined) {
                await Validator.isText(branchData.name);
                dataToUpdate.name = branchData.name;
                const newSlug = slugify(branchData.name);
                if (newSlug !== existingBranch.slug) {
                    const conflictingSlug = await prisma.branches.findUnique({ where: { slug: newSlug } });
                    if (conflictingSlug && conflictingSlug.id !== id) {
                        return reject(new CustomError(`Branch name resulting in slug '${newSlug}' already exists.`, CONFLICT));
                    }
                    dataToUpdate.slug = newSlug;
                }
            }
            if (branchData.code !== undefined) {
                await Validator.isText(branchData.code);
                if (branchData.code !== existingBranch.code) {
                    const conflictingCode = await prisma.branches.findUnique({ where: { code: branchData.code } });
                    if (conflictingCode && conflictingCode.id !== id) {
                        return reject(new CustomError(`Branch code '${branchData.code}' already exists.`, CONFLICT));
                    }
                }
                dataToUpdate.code = branchData.code;
            }
            // ... (similar checks and assignments for all other fields from createBranchService) ...
            if (branchData.shop_id !== undefined) {
                const parsedShopId = parseInt(branchData.shop_id);
                await Validator.isNumber(parsedShopId);
                const shopExists = await prisma.shops.findUnique({ where: { id: parsedShopId } });
                if (!shopExists) return reject(new CustomError(`Shop with ID ${parsedShopId} not found.`, NOT_FOUND));
                dataToUpdate.shop_id = parsedShopId;
            }
            if (branchData.address_id !== undefined) {
                if(branchData.address_id === null || branchData.address_id === '') {
                    dataToUpdate.address_id = null;
                } else {
                    const addressId = parseInt(branchData.address_id);
                    await Validator.isNumber(addressId);
                    const addressExists = await prisma.addresses.findUnique({ where: { id: addressId } });
                    if (!addressExists) return reject(new CustomError(`Address with ID ${addressId} not found.`, NOT_FOUND));
                    dataToUpdate.address_id = addressId;
                }
            }
            // ... status, contact_email, geo_latitude etc.
            if (branchData.status !== undefined) {
                await Validator.isEnum(branchData.status, BRANCH_STATUS_ENUM);
                dataToUpdate.status = branchData.status;
            }
            if (branchData.contact_email !== undefined) {
                 if(branchData.contact_email === null || branchData.contact_email === '') {
                    dataToUpdate.contact_email = null;
                 } else {
                    await Validator.isEmail(branchData.contact_email);
                    dataToUpdate.contact_email = branchData.contact_email;
                 }
            }
            
             if (branchData.is_main !== undefined) dataToUpdate.is_main = parseBoolean(branchData.is_main);
             // ... and all other updatable fields


            if (Object.keys(dataToUpdate).length <= 1 && (!operatingHoursData || operatingHoursData.length === 0)) {
                 return reject(new CustomError("No valid fields provided for update.", BAD_REQUEST));
            }

            const updatedBranch = await prisma.$transaction(async (tx) => {
                let currentBranch = existingBranch;
                if (Object.keys(dataToUpdate).length > 1) { // if more than just updated_at
                    currentBranch = await tx.branches.update({
                        where: { id },
                        data: dataToUpdate,
                    });
                }

                // Handle operating hours: delete existing and create new ones (simplest approach)
                // A more sophisticated approach would be to diff and update/create/delete individually.
                if (operatingHoursData !== undefined) { // Allow empty array to clear hours
                    await validateOperatingHoursInput(operatingHoursData); // Validate before changing DB

                    await tx.branch_operating_hours.deleteMany({
                        where: { branch_id: id }
                    });

                    if (operatingHoursData.length > 0) {
                        const operatingHoursToCreate = operatingHoursData.map(oh => ({
                            branch_id: id,
                            day_of_week: oh.day_of_week.toLowerCase(),
                            opening_time: parseBoolean(oh.is_closed, false) ? null : oh.opening_time,
                            closing_time: parseBoolean(oh.is_closed, false) ? null : oh.closing_time,
                            is_closed: parseBoolean(oh.is_closed, false),
                            special_note: oh.special_note || null,
                        }));
                        await tx.branch_operating_hours.createMany({
                            data: operatingHoursToCreate
                        });
                    }
                }
                // Fetch the branch again with all includes
                return tx.branches.findUnique({
                    where: { id },
                    include: { operating_hours: true, shop: true, address: true }
                });
            });

            return resolve(updatedBranch);

        } catch (error) {
            if (error instanceof CustomError) return reject(error);
            console.error("Error in updateBranchService:", error);
            if (error.code === 'P2002') {
                 const target = error.meta?.target;
                 if (target?.includes('code')) return reject(new CustomError(`Update failed: Branch code is already in use.`, CONFLICT));
                 if (target?.includes('slug')) return reject(new CustomError(`Update failed: Branch name resulting in slug already exists.`, CONFLICT));
            }
            return reject(new CustomError("Failed to update branch.", INTERNAL_SERVER));
        }
    })
);

export const deleteBranchService = async (branchId) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        try {
            const id = parseInt(branchId);
            await Validator.isNumber(id);

            const existingBranch = await prisma.branches.findUnique({ where: { id } });
            if (!existingBranch) return reject(new CustomError(`Branch with ID ${id} not found to delete.`, NOT_FOUND));

            // Check for dependencies: desks, terminals, active orders through desks, etc.
            const deskCount = await prisma.desks.count({ where: { branch_id: id } });
            if (deskCount > 0) return reject(new CustomError(`Cannot delete branch. It has ${deskCount} associated desk(s).`, BAD_REQUEST));
            
            const terminalCount = await prisma.pos_terminals.count({ where: { branch_id: id } });
            if (terminalCount > 0) return reject(new CustomError(`Cannot delete branch. It has ${terminalCount} associated terminal(s).`, BAD_REQUEST));
            
            // Add more checks for staff, menus, inventory, coupons, gift_cards if they should prevent deletion
            // For example:
            // const activeCoupons = await prisma.coupons.count({ where: { branch_id: id, is_active: true }});
            // if (activeCoupons > 0) return reject(new CustomError(...));


            await prisma.$transaction(async (tx) => {
                await tx.branch_operating_hours.deleteMany({ where: { branch_id: id } });
                // Delete other direct child relations if cascade delete is not configured or for explicit control
                // e.g., await tx.branch_menus.deleteMany({ where: { branch_id: id } });
                // e.g., await tx.branch_staff.deleteMany({ where: { branch_id: id } });
                await tx.branches.delete({ where: { id } });
            });

            return resolve({ message: "Branch deleted successfully." });
        } catch (error) {
            if (error instanceof CustomError) return reject(error);
            console.error("Error in deleteBranchService:", error);
            if (error.code === 'P2003') { // Foreign key constraint
                 return reject(new CustomError("Cannot delete branch. It is referenced by other essential records.", BAD_REQUEST));
            }
            return reject(new CustomError("Failed to delete branch.", INTERNAL_SERVER));
        }
    })
);

// --- Services for Operating Hours (if managed separately) ---
// Example: Get operating hours for a branch
export const getBranchOperatingHoursService = async (branchId) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        // ... implementation ...
    })
);
// Example: Update specific day's operating hours
export const updateBranchOperatingHourService = async (operatingHourId, data) => new Promise(
    promiseAsyncWrapper(async (resolve, reject) => {
        // ... implementation, ensuring operatingHourId belongs to a valid branch ...
    })
);