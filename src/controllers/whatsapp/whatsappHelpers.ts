import { Request, Response } from 'express';
import { WhatsAppAPIError } from '../../utils/whatsappErrors';

/**
 * Validation helpers
 */
export const validatePhoneNumber = (phone: string): boolean => {
    return /^\+[1-9]\d{1,14}$/.test(phone);
};

export const validateTemplateName = (name: string): boolean => {
    return /^[a-z0-9_]{1,512}$/i.test(name);
};

/**
 * Standardized error response helper
 * Available for direct error responses when not using Express error handlers
 */
export const sendErrorResponse = (res: Response, statusCode: number, message: string, data?: any) => {
    res.status(statusCode).json({
        type: statusCode >= 500 ? '3' : '2',
        message,
        data: data || null,
        timestamp: new Date().toISOString(),
    });
};

/**
 * Extract business context from request
 * Supports query params (subDomain, localId) or from authenticated user
 */
export const getBusinessContext = (req: Request): { subDomain: string; localId?: string } => {
    // Priority 1: Query parameters
    if (req.query.subDomain) {
        return {
            subDomain: req.query.subDomain as string,
            localId: req.query.localId as string | undefined,
        };
    }

    // Priority 2: Request body
    if (req.body.subDomain) {
        return {
            subDomain: req.body.subDomain,
            localId: req.body.localId,
        };
    }

    // Priority 3: From authenticated user's business (if available)
    const user = (req as any).user;
    if (user && user.business) {
        return {
            subDomain: user.business.subDomain,
            localId: user.business.localId,
        };
    }

    throw new WhatsAppAPIError('Business context (subDomain) is required', 400, '3', null);
};
