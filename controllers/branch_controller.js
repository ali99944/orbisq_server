import { CREATED } from "../lib/status_codes.js";
import asyncWrapper from "../lib/wrappers/async_wrapper.js";
import {
    createBranchService,
    getAllBranchesService,
    getBranchByIdOrSlugService,
    updateBranchService,
    deleteBranchService
} from "../services/branch_service.js";


export const createBranchController = asyncWrapper(
    async (req, res) => {
        // Assuming operating_hours might be passed in the body
        const { operating_hours, ...branchData } = req.body;
        const branch = await createBranchService(branchData, operating_hours);
        return res.status(CREATED).json(branch);
    }
);

export const getAllBranchesController = asyncWrapper(
    async (req, res) => {
        const branches = await getAllBranchesService(req.query);
        return res.json(branches);
    }
);

export const getBranchByIdOrSlugController = asyncWrapper(
    async (req, res) => {
        const { identifier } = req.params; // Can be ID or slug
        const branch = await getBranchByIdOrSlugService(identifier);
        return res.json(branch);
    }
);

export const updateBranchController = asyncWrapper(
    async (req, res) => {
        const { id } = req.params;
        const { operating_hours, ...branchData } = req.body;
        const updatedBranch = await updateBranchService(id, branchData, operating_hours);
        return res.json(updatedBranch);
    }
);

export const deleteBranchController = asyncWrapper(
    async (req, res) => {
        const { id } = req.params;
        const result = await deleteBranchService(id);
        return res.json(result);
    }
);