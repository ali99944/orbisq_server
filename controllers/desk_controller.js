import { CREATED } from "../lib/status_codes.js";
import asyncWrapper from "../lib/wrappers/async_wrapper.js";
import {
    createDeskService,
    getAllDesksService,
    getDeskByIdService,
    updateDeskService,
    deleteDeskService,
    updateDeskStatusService
} from "../services/desk_service.js";

export const createDeskController = asyncWrapper(
    async (req, res) => {
        const desk = await createDeskService(req.body);
        return res.status(CREATED).json(desk);
    }
);

export const getAllDesksController = asyncWrapper(
    async (req, res) => {
        const desks = await getAllDesksService(req.query);
        return res.json(desks);
    }
);

export const getDeskByIdController = asyncWrapper(
    async (req, res) => {
        const { id } = req.params;
        const desk = await getDeskByIdService(id);
        return res.json(desk);
    }
);

export const updateDeskController = asyncWrapper(
    async (req, res) => {
        const { id } = req.params;
        const updatedDesk = await updateDeskService(id, req.body);
        return res.json(updatedDesk);
    }
);

export const deleteDeskController = asyncWrapper(
    async (req, res) => {
        const { id } = req.params;
        const result = await deleteDeskService(id);
        return res.json(result);
    }
);

export const updateDeskStatusController = asyncWrapper(
    async (req, res) => {
        const { id } = req.params;
        const updatedDesk = await updateDeskStatusService(id, req.body);
        return res.json(updatedDesk);
    }
)