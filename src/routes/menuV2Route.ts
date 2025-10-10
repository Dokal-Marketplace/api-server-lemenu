import { Router } from "express"
import { batchUpdateCategories, batchUpdateOptions, batchUpdateProducts, batchUpdateUpdates, batchUpdateV2Products, downloadMenuFile, getBotStructure, getIntegration, getIntegrationV2, updateBatchBusinessLocation } from "../controllers/menuV2Controller";

const router = Router()


router.post("/update-multiple-business-location/:itemType/:rId", updateBatchBusinessLocation);
router.get("/bot-structure", getBotStructure);
router.get("/v2/integration/:subDomain", getIntegrationV2);
router.get("/integration/:subDomain/:businessLocationId", getIntegration);
router.post("/v2/update-multiple-business-location/productos", batchUpdateV2Products);
router.post("/update-multiple-business-location/modificadores", batchUpdateUpdates);
router.post("/update-multiple-business-location/opciones", batchUpdateOptions);
router.post("/update-multiple-business-location/productos", batchUpdateProducts);
router.post("/update-multiple-business-location/categorias", batchUpdateCategories);
router.post("/download-menu-pdf", downloadMenuFile);


export default router
