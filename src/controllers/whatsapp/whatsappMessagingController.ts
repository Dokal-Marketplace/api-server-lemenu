import { Request, Response, NextFunction } from 'express';
import logger from '../../utils/logger';
import { MetaWhatsAppService } from '../../services/whatsapp/metaWhatsAppService';
import { createValidationError, createServerError } from '../../utils/whatsappErrors';
import { validatePhoneNumber, validateTemplateName, getBusinessContext } from './whatsappHelpers';

/**
 * Send a text message via Meta WhatsApp Business API
 * POST /api/v1/whatsapp/send-message
 */
export const sendTextMessage = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { subDomain, localId } = getBusinessContext(req);
        const { to, text, previewUrl } = req.body;

        if (!to || !text) {
            return next(createValidationError('Missing required fields: to, text'));
        }

        if (!validatePhoneNumber(to)) {
            return next(createValidationError('Phone number must be in E.164 format (e.g., +1234567890)'));
        }

        const result = await MetaWhatsAppService.sendTextMessage(
            subDomain,
            { to, text, previewUrl },
            localId
        );

        res.json({
            type: '1',
            message: 'Message sent successfully',
            data: result,
        });
    } catch (error: any) {
        logger.error('Error sending text message:', error);
        next(createServerError(error.message || 'Failed to send message', error));
    }
};

/**
 * Send a template message via Meta WhatsApp Business API
 * POST /api/v1/whatsapp/send-template
 */
export const sendTemplateMessage = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { subDomain, localId } = getBusinessContext(req);
        const { to, templateName, languageCode, parameters } = req.body;

        if (!to || !templateName) {
            return next(createValidationError('Missing required fields: to, templateName'));
        }

        if (!validatePhoneNumber(to)) {
            return next(createValidationError('Phone number must be in E.164 format (e.g., +1234567890)'));
        }

        if (!validateTemplateName(templateName)) {
            return next(createValidationError('Template name must be alphanumeric with underscores, max 512 characters'));
        }

        const result = await MetaWhatsAppService.sendTemplateMessage(
            subDomain,
            { to, templateName, languageCode, parameters },
            localId
        );

        res.json({
            type: '1',
            message: 'Template message sent successfully',
            data: result,
        });
    } catch (error: any) {
        logger.error('Error sending template message:', error);
        next(createServerError(error.message || 'Failed to send template message', error));
    }
};

/**
 * Send an interactive message (buttons or list) via Meta WhatsApp Business API
 * POST /api/v1/whatsapp/send-interactive
 */
export const sendInteractiveMessage = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { subDomain, localId } = getBusinessContext(req);
        const { to, type, body, footer, header, action } = req.body;

        if (!to || !type || !body || !action) {
            return next(createValidationError('Missing required fields: to, type, body, action'));
        }

        if (type !== 'button' && type !== 'list') {
            return next(createValidationError('Type must be either "button" or "list"'));
        }

        const result = await MetaWhatsAppService.sendInteractiveMessage(
            subDomain,
            { to, type, body, footer, header, action },
            localId
        );

        res.json({
            type: '1',
            message: 'Interactive message sent successfully',
            data: result,
        });
    } catch (error: any) {
        logger.error('Error sending interactive message:', error);
        next(createServerError(error.message || 'Failed to send interactive message', error));
    }
};

/**
 * Send a product message via Meta WhatsApp Business API
 * POST /api/v1/whatsapp/send-product
 */
export const sendProductMessage = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { subDomain, localId } = getBusinessContext(req);
        const { to, catalogId, productRetailerId, body, footer, header } = req.body;

        if (!to || !catalogId || !productRetailerId) {
            return next(createValidationError('Missing required fields: to, catalogId, productRetailerId'));
        }

        if (!validatePhoneNumber(to)) {
            return next(createValidationError('Phone number must be in E.164 format (e.g., +1234567890)'));
        }

        const result = await MetaWhatsAppService.sendProductMessage(
            subDomain,
            { to, catalogId, productRetailerId, body, footer, header },
            localId
        );

        res.json({
            type: '1',
            message: 'Product message sent successfully',
            data: result,
        });
    } catch (error: any) {
        logger.error('Error sending product message:', error);
        next(createServerError(error.message || 'Failed to send product message', error));
    }
};

/**
 * Send a product list message via Meta WhatsApp Business API
 * POST /api/v1/whatsapp/send-product-list
 */
export const sendProductListMessage = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { subDomain, localId } = getBusinessContext(req);
        const { to, catalogId, sections, body, footer, header } = req.body;

        if (!to || !catalogId || !sections) {
            return next(createValidationError('Missing required fields: to, catalogId, sections'));
        }

        if (!validatePhoneNumber(to)) {
            return next(createValidationError('Phone number must be in E.164 format (e.g., +1234567890)'));
        }

        if (!Array.isArray(sections) || sections.length === 0) {
            return next(createValidationError('Sections must be a non-empty array'));
        }

        // Validate sections structure
        for (const section of sections) {
            if (!section.title || !section.productItems || !Array.isArray(section.productItems)) {
                return next(createValidationError('Each section must have a title and productItems array'));
            }
            if (section.productItems.length === 0) {
                return next(createValidationError('Each section must have at least one product item'));
            }
            for (const item of section.productItems) {
                if (!item.productRetailerId) {
                    return next(createValidationError('Each product item must have a productRetailerId'));
                }
            }
        }

        const result = await MetaWhatsAppService.sendProductListMessage(
            subDomain,
            { to, catalogId, sections, body, footer, header },
            localId
        );

        res.json({
            type: '1',
            message: 'Product list message sent successfully',
            data: result,
        });
    } catch (error: any) {
        logger.error('Error sending product list message:', error);
        next(createServerError(error.message || 'Failed to send product list message', error));
    }
};

/**
 * Send a media message via Meta WhatsApp Business API
 * POST /api/v1/whatsapp/send-media
 */
export const sendMediaMessage = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { subDomain, localId } = getBusinessContext(req);
        const { to, type, mediaId, mediaUrl, caption, filename } = req.body;

        if (!to || !type) {
            return next(createValidationError('Missing required fields: to, type'));
        }

        if (!mediaId && !mediaUrl) {
            return next(createValidationError('Either mediaId or mediaUrl must be provided'));
        }

        const validTypes = ['image', 'audio', 'video', 'document'];
        if (!validTypes.includes(type)) {
            return next(createValidationError(`Type must be one of: ${validTypes.join(', ')}`));
        }

        const result = await MetaWhatsAppService.sendMediaMessage(
            subDomain,
            { to, type, mediaId, mediaUrl, caption, filename },
            localId
        );

        res.json({
            type: '1',
            message: 'Media message sent successfully',
            data: result,
        });
    } catch (error: any) {
        logger.error('Error sending media message:', error);
        next(createServerError(error.message || 'Failed to send media message', error));
    }
};

/**
 * Mark a message as read
 * POST /api/v1/whatsapp/messages/:messageId/read
 */
export const markMessageAsRead = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { subDomain, localId } = getBusinessContext(req);
        const { messageId } = req.params;

        if (!messageId) {
            return next(createValidationError('Missing messageId parameter'));
        }

        const result = await MetaWhatsAppService.markMessageAsRead(
            subDomain,
            messageId,
            localId
        );

        res.json({
            type: '1',
            message: 'Message marked as read',
            data: result,
        });
    } catch (error: any) {
        logger.error('Error marking message as read:', error);
        next(createServerError(error.message || 'Failed to mark message as read', error));
    }
};
