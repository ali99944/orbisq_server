import express from "express";
import {
    createBranchController,
    getAllBranchesController,
    getBranchByIdOrSlugController,
    updateBranchController,
    deleteBranchController
} from "../controllers/branch_controller.js";

const router = express.Router();

router.post('/branches', createBranchController);
router.get('/branches', getAllBranchesController);
router.get('/branches/:identifier', getBranchByIdOrSlugController); // :identifier can be ID or slug
router.put('/branches/:id', updateBranchController);
router.delete('/branches/:id', deleteBranchController);

// Optional: Dedicated routes for operating hours if not handled entirely within branch update
// router.get('/branches/:branchId/operating-hours', getBranchOperatingHoursController);
// router.put('/branches/:branchId/operating-hours/:operatingHourId', updateBranchOperatingHourController);
// router.post('/branches/:branchId/operating-hours', addOperatingHourToBranchController); // To add a new day
// router.delete('/branches/:branchId/operating-hours/:operatingHourId', deleteOperatingHourController);

export default router;