import { Router } from "express"
import { getByProduct, update, deleteOne, create, getAll, getAllLikeProduct } from "../controllers/presentacionesController";

const router = Router()

router.get("/get-all", getAll);
router.get("/get-all-like-product", getAllLikeProduct);
router.get("/by-product", getByProduct);
router.get("/create", create);
router.patch("/", update);
router.delete("/", deleteOne);


export default router
