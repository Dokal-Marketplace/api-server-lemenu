import { Router } from "express"
import { batchUpdateCategories, batchUpdateOptions, batchUpdateProducts, batchUpdateUpdates, batchUpdateV2Products, downloadMenuFile, getBotStructure, getIntegration, getIntegrationV2, updateBacthLocal } from "../controllers/menuV2Controller";

const router = Router()


router.post("/update-multiple-local", updateBacthLocal);
router.get("/bot-structure", getBotStructure);
router.get("/v2/integration", getIntegrationV2);
router.get("/integration", getIntegration);
router.post("/v2/update-multiple-local/productos", batchUpdateV2Products);
router.post("/update-multiple-local/modificadores", batchUpdateUpdates);
router.post("/update-multiple-local/opciones", batchUpdateOptions);
router.post("/update-multiple-local/productos", batchUpdateProducts);
router.post("/update-multiple-local/categorias", batchUpdateCategories);
router.post("/download-menu-pdf", downloadMenuFile);


export default router
