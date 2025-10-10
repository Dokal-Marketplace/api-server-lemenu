import { Router } from "express"
import { createMultipleBusinessLocation, update, deleteOne, create, getAll } from "../controllers/optionsController";

const router = Router()

router.get("/get-all", getAll);
router.get("/create", create);
router.patch("/", update);
router.delete("/", deleteOne);
router.post("/create-multiple-business-location", createMultipleBusinessLocation);


export default router
