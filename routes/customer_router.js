import { Router } from "express";

const router = Router();

router.get('/customers', async (req,res) => {
    return res.json([]);
})

export default router;