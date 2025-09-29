import { Router, Request, Response } from "express";
import { NotificationPayload, OrderUpdatePayload, NewMessagePayload } from "../types/socket";

const router = Router();

router.post("/", (req: Request, res: Response) => {
  const payload = req.body as NewMessagePayload & { subDomain?: string; localId?: string };
  const { content, subDomain, localId } = payload;
  if (!content) {
    return res.status(400).json({ success: false, message: "content is required" });
  }

  const io = req.app.get("io");
  if (subDomain) io?.to(`subdomain:${subDomain}`).emit("new-message", payload);
  if (localId) io?.to(`local:${localId}`).emit("new-message", payload);
  if (!subDomain && !localId) io?.emit("new-message", payload);
  return res.json({ success: true });
});

router.post("/notify", (req: Request, res: Response) => {
  const payload = req.body as NotificationPayload;
  const { subDomain, localId, message } = payload;
  if (!message) {
    return res.status(400).json({ success: false, message: "message is required" });
  }
  const io = req.app.get("io");
  if (subDomain) io?.to(`subdomain:${subDomain}`).emit("notification", payload);
  if (localId) io?.to(`local:${localId}`).emit("notification", payload);
  if (!subDomain && !localId) io?.emit("notification", payload);
  return res.json({ success: true });
});

router.post("/order-update", (req: Request, res: Response) => {
  const payload = req.body as OrderUpdatePayload & { subDomain?: string; localId?: string };
  const { orderId } = payload;
  if (!orderId) {
    return res.status(400).json({ success: false, message: "orderId is required" });
  }
  const io = req.app.get("io");
  const { subDomain, localId } = req.body as { subDomain?: string; localId?: string };
  if (subDomain) io?.to(`subdomain:${subDomain}`).emit("order-update", payload);
  if (localId) io?.to(`local:${localId}`).emit("order-update", payload);
  if (!subDomain && !localId) io?.emit("order-update", payload);
  return res.json({ success: true });
});

export default router;


