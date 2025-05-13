import express from "express";
import {
    createDeskController,
    getAllDesksController,
    getDeskByIdController,
    updateDeskController,
    deleteDeskController,
    updateDeskStatusController,
    createMultiDeskController
} from "../controllers/desk_controller.js";
import { authenticatePortal } from "../middlewares/shop_auth_middleware.js";


const router = express.Router();

router.post('/desks', authenticatePortal, createDeskController);
router.get('/desks', authenticatePortal, getAllDesksController);
router.get('/desks/:id', getDeskByIdController);
router.patch('/desks/:id', authenticatePortal, updateDeskController);
router.delete('/desks/:id', authenticatePortal, deleteDeskController);

router.post('/desks/multi', authenticatePortal, createMultiDeskController);


router.put('/desks/:id/status', updateDeskStatusController);

export default router;