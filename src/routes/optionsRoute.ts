import { Router } from "express"
import { createMultipleLocal, update, deleteOne, create, getAll } from "../controllers/optionsController";

const router = Router()

router.get("/get-all", getAll);
router.get("/create", create);
router.patch("/", update);
router.delete("/", deleteOne);
router.post("/create-multiple-local", createMultipleLocal);


export default router
