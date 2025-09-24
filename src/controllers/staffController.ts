import { Request, Response } from "express";
import { validationResult, body } from "express-validator";
import { Role } from "../models/Role";
import { Integration } from "../models/Integration";

export const getRoles = async (_req: Request, res: Response) => {
  try {
    const roles = await Role.find({ isActive: true }).sort({ name: 1 });
    return res.json({ type: "1", message: "Roles retrieved successfully", data: roles });
  } catch (error: any) {
    return res.status(500).json({ type: "3", message: error.message, data: null });
  }
};

export const validateCreateUserBusiness = [
  body("name").isString().notEmpty(),
  body("userId").isString().notEmpty(),
  body("subDomain").isString().notEmpty(),
  body("businessId").optional().isString(),
  body("role").optional().isString(),
  body("permissions").optional().isArray(),
];

export const createUserBusiness = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ type: "701", message: "Malformed JSON", data: errors.array() });
    }

    const { name, userId, subDomain, businessId, role = "staff", permissions = [] } = req.body as {
      name: string;
      userId: string;
      subDomain: string;
      businessId?: string;
      role?: string;
      permissions?: string[];
    };

    // Create integration document representing the user-business relationship
    const integration = await Integration.create({
      userId,
      businessId: businessId ?? "",
      subDomain,
      name,
      role,
      permissions,
      isActive: true,
      isPrimary: false,
      integrationStatus: "active",
    } as any);

    return res.status(201).json({ type: "1", message: "User-Business relationship created", data: integration });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({ type: "3", message: "Relationship already exists", data: null });
    }
    return res.status(500).json({ type: "3", message: error.message, data: null });
  }
};


