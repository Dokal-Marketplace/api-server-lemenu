import { Request, Response, NextFunction } from 'express';
import logger from '../../utils/logger';
import { MetaWhatsAppService } from '../../services/whatsapp/metaWhatsAppService';
import { createValidationError, createServerError } from '../../utils/whatsappErrors';
import { validatePhoneNumber, getBusinessContext } from './whatsappHelpers';

/**
 * Get message templates
 * GET /api/v1/whatsapp/templates
 */
export const getTemplates = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { subDomain, localId } = getBusinessContext(req);

        const result = await MetaWhatsAppService.getTemplates(subDomain, localId);

        res.json({
            type: '1',
            message: 'Templates retrieved successfully',
            data: result,
        });
    } catch (error: any) {
        logger.error('Error getting templates:', error);
        next(createServerError(error.message || 'Failed to get templates', error));
    }
};

/**
 * Get phone numbers
 * GET /api/v1/whatsapp/phone-numbers
 */
export const getPhoneNumbers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { subDomain, localId } = getBusinessContext(req);

        const result = await MetaWhatsAppService.getPhoneNumbers(subDomain, localId);

        res.json({
            type: '1',
            message: 'Phone numbers retrieved successfully',
            data: result,
        });
    } catch (error: any) {
        logger.error('Error getting phone numbers:', error);
        next(createServerError(error.message || 'Failed to get phone numbers', error));
    }
};

/**
 * Check conversation window status
 * GET /api/v1/whatsapp/conversations/:phone/window
 */
export const checkConversationWindow = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { subDomain, localId } = getBusinessContext(req);
        const { phone } = req.params;

        if (!phone) {
            return next(createValidationError('Missing phone parameter'));
        }

        if (!validatePhoneNumber(phone)) {
            return next(createValidationError('Phone number must be in E.164 format (e.g., +1234567890)'));
        }

        const result = await MetaWhatsAppService.checkConversationWindow(
            subDomain,
            phone,
            localId
        );

        // Format response with human-readable time remaining
        const responseData: any = {
            isOpen: result.isOpen,
            lastMessageTime: result.lastMessageTime ? result.lastMessageTime.toISOString() : undefined,
        };

        if (result.isOpen && result.expiresAt && result.timeRemaining) {
            responseData.expiresAt = result.expiresAt.toISOString();
            responseData.timeRemaining = {
                milliseconds: result.timeRemaining,
                seconds: Math.floor(result.timeRemaining / 1000),
                minutes: Math.floor(result.timeRemaining / (1000 * 60)),
                hours: Math.floor(result.timeRemaining / (1000 * 60 * 60)),
                humanReadable: formatTimeRemaining(result.timeRemaining),
            };
        }

        res.json({
            type: '1',
            message: result.isOpen
                ? 'Conversation window is open'
                : 'Conversation window is closed',
            data: responseData,
        });
    } catch (error: any) {
        logger.error('Error checking conversation window:', error);
        next(createServerError(error.message || 'Failed to check conversation window', error));
    }
};

/**
 * Format time remaining in human-readable format
 */
const formatTimeRemaining = (milliseconds: number): string => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

    if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
};

/**
 * Check WhatsApp health status
 * GET /api/v1/whatsapp/health
 */
export const checkHealth = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { subDomain, localId } = getBusinessContext(req);

        const result = await MetaWhatsAppService.checkHealth(subDomain, localId);

        if (result.isHealthy) {
            res.json({
                type: '1',
                message: 'WhatsApp is healthy and operational',
                data: result,
            });
        } else {
            res.status(503).json({
                type: '3',
                message: result.reason || 'WhatsApp is not healthy',
                data: result,
            });
        }
    } catch (error: any) {
        logger.error('Error checking WhatsApp health:', error);
        next(createServerError(error.message || 'Failed to check WhatsApp health', error));
    }
};

/**
 * Validate WhatsApp setup
 * GET /api/v1/whatsapp/setup/validate
 */
export const validateSetup = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { subDomain, localId } = getBusinessContext(req);

        const result = await MetaWhatsAppService.validateSetup(subDomain, localId);

        if (result.isValid) {
            res.json({
                type: '1',
                message: 'WhatsApp setup is valid',
                data: result,
            });
        } else {
            res.status(400).json({
                type: '3',
                message: 'WhatsApp setup validation failed',
                data: result,
            });
        }
    } catch (error: any) {
        logger.error('Error validating WhatsApp setup:', error);
        next(createServerError(error.message || 'Failed to validate WhatsApp setup', error));
    }
};

/**
 * Get account status
 * GET /api/v1/whatsapp/account/status
 */
export const getAccountStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { subDomain, localId } = getBusinessContext(req);

        const result = await MetaWhatsAppService.getAccountStatus(subDomain, localId);

        res.json({
            type: '1',
            message: 'Account status retrieved successfully',
            data: result,
        });
    } catch (error: any) {
        logger.error('Error getting account status:', error);
        next(createServerError(error.message || 'Failed to get account status', error));
    }
};

/**
 * Get phone number details
 * GET /api/v1/whatsapp/phone-numbers/:phoneNumberId
 */
export const getPhoneNumberDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { subDomain, localId } = getBusinessContext(req);
        const { phoneNumberId } = req.params;

        if (!phoneNumberId) {
            return next(createValidationError('Missing phoneNumberId parameter'));
        }

        const result = await MetaWhatsAppService.getPhoneNumberDetails(
            phoneNumberId,
            subDomain,
            localId
        );

        res.json({
            type: '1',
            message: 'Phone number details retrieved successfully',
            data: result,
        });
    } catch (error: any) {
        logger.error('Error getting phone number details:', error);
        next(createServerError(error.message || 'Failed to get phone number details', error));
    }
};

/**
 * Check two-step verification status
 * GET /api/v1/whatsapp/phone-numbers/:phoneNumberId/two-step
 */
export const checkTwoStepVerification = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { subDomain, localId } = getBusinessContext(req);
        const { phoneNumberId } = req.params;

        if (!phoneNumberId) {
            return next(createValidationError('Missing phoneNumberId parameter'));
        }

        const result = await MetaWhatsAppService.checkTwoStepVerification(
            phoneNumberId,
            subDomain,
            localId
        );

        res.json({
            type: '1',
            message: 'Two-step verification status retrieved successfully',
            data: result,
        });
    } catch (error: any) {
        logger.error('Error checking two-step verification:', error);
        next(createServerError(error.message || 'Failed to check two-step verification', error));
    }
};

/**
 * Disable two-step verification
 * POST /api/v1/whatsapp/phone-numbers/:phoneNumberId/two-step/disable
 */
export const disableTwoStepVerification = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { subDomain, localId } = getBusinessContext(req);
        const { phoneNumberId } = req.params;

        if (!phoneNumberId) {
            return next(createValidationError('Missing phoneNumberId parameter'));
        }

        const result = await MetaWhatsAppService.disableTwoStepVerification(
            phoneNumberId,
            subDomain,
            localId
        );

        if (result.success) {
            res.json({
                type: '1',
                message: 'Two-step verification disabled successfully',
                data: result,
            });
        } else {
            res.status(400).json({
                type: '3',
                message: result.error || 'Failed to disable two-step verification',
                data: result,
            });
        }
    } catch (error: any) {
        logger.error('Error disabling two-step verification:', error);
        next(createServerError(error.message || 'Failed to disable two-step verification', error));
    }
};

/**
 * Verify phone number
 * POST /api/v1/whatsapp/phone-numbers/:phoneNumberId/verify
 */
export const verifyPhoneNumber = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { subDomain, localId } = getBusinessContext(req);
        const { phoneNumberId } = req.params;
        const { method } = req.body;

        if (!phoneNumberId) {
            return next(createValidationError('Missing phoneNumberId parameter'));
        }

        if (!method || (method !== 'SMS' && method !== 'VOICE')) {
            return next(createValidationError('Method must be either SMS or VOICE'));
        }

        const result = await MetaWhatsAppService.verifyPhoneNumber(
            phoneNumberId,
            method,
            subDomain,
            localId
        );

        if (result.success) {
            res.json({
                type: '1',
                message: 'Verification code requested successfully',
                data: result,
            });
        } else {
            res.status(400).json({
                type: '3',
                message: result.error || 'Failed to request verification code',
                data: result,
            });
        }
    } catch (error: any) {
        logger.error('Error verifying phone number:', error);
        next(createServerError(error.message || 'Failed to verify phone number', error));
    }
};
