import express from "express";
import {
    createDeskController,
    getAllDesksController,
    getDeskByIdController,
    updateDeskController,
    deleteDeskController,
    updateDeskStatusController
} from "../controllers/desk_controller.js";

const router = express.Router();

router.post('/desks', createDeskController);
router.get('/desks', getAllDesksController);
router.get('/desks/:id', getDeskByIdController);
router.patch('/desks/:id', updateDeskController);
router.delete('/desks/:id', deleteDeskController);


router.put('/desks/:id/status', updateDeskStatusController);

export default router;