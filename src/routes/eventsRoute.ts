import { Router, Request, Response } from "express";

const router = Router();

router.post("/new-message", (req: Request, res: Response) => {
  const content = (req.body && req.body.content) || "";
  if (!content) {
    return res.status(400).json({ success: false, message: "content is required" });
  }

  const io = req.app.get("io");
  io?.emit("new-message", { content });
  return res.json({ success: true });
});

export default router;


