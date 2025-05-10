import express from "express";
import {
    createDeskController,
    getAllDesksController,
    getDeskByIdController,
    updateDeskController,
    deleteDeskController
} from "../controllers/desk_controller.js";

const router = express.Router();

router.post('/desks', createDeskController);
router.get('/desks', getAllDesksController);
router.get('/desks/:id', getDeskByIdController);
router.put('/desks/:id', updateDeskController);
router.delete('/desks/:id', deleteDeskController);

export default router;