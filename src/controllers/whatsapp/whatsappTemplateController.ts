import { Request, Response, NextFunction } from 'express';
import logger from '../../utils/logger';
import { MetaWhatsAppService } from '../../services/whatsapp/metaWhatsAppService';
import { Business } from '../../models/Business';
import { createValidationError, createServerError } from '../../utils/whatsappErrors';
import { getTemplateById } from '../../utils/templates';
import { getBusinessContext } from './whatsappHelpers';

/**
 * Get webhook subscriptions
 * GET /api/v1/whatsapp/webhooks/subscriptions
 */
export const getWebhookSubscriptions = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { subDomain, localId } = getBusinessContext(req);

        const result = await MetaWhatsAppService.getWebhookSubscriptions(subDomain, localId);

        res.json({
            type: '1',
            message: 'Webhook subscriptions retrieved successfully',
            data: result,
        });
    } catch (error: any) {
        logger.error('Error getting webhook subscriptions:', error);
        next(createServerError(error.message || 'Failed to get webhook subscriptions', error));
    }
};

/**
 * Subscribe to webhooks
 * POST /api/v1/whatsapp/webhooks/subscribe
 */
export const subscribeWebhook = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { subDomain, localId } = getBusinessContext(req);
        const { webhookUrl, verifyToken, fields } = req.body;

        // Strict validation: Required fields
        if (!webhookUrl || !verifyToken || !fields) {
            return next(createValidationError('Missing required fields: webhookUrl, verifyToken, fields'));
        }

        // Strict validation: Fields must be a non-empty array
        if (!Array.isArray(fields)) {
            return next(createValidationError('Fields must be an array'));
        }

        if (fields.length === 0) {
            return next(createValidationError(
                'Fields array cannot be empty. You must subscribe to at least one webhook field. ' +
                'Recommended fields: ["messages", "message_template_status_update"]'
            ));
        }

        // Strict validation: All fields must be non-empty strings
        const invalidFields = fields.filter(f => typeof f !== 'string' || f.trim() === '');
        if (invalidFields.length > 0) {
            return next(createValidationError(
                'All fields must be non-empty strings. Invalid fields found: ' + JSON.stringify(invalidFields)
            ));
        }

        // Strict validation: Check for valid field names
        const validFieldNames = [
            'messages',
            'message_template_status_update',
            'messaging_postbacks',
            'messaging_optins',
            'message_deliveries',
            'message_reads',
            'messaging_referrals',
            'messaging_account_linking',
            'account_update',
            'phone_number_name_update',
            'phone_number_quality_update',
            'template_category_update'
        ];

        const unknownFields = fields.filter(f => !validFieldNames.includes(f));
        if (unknownFields.length > 0) {
            logger.warn('Unknown webhook fields provided', { unknownFields, subDomain });
            // Don't fail, just warn - Meta might add new fields
        }

        // Strict validation: Recommend essential fields
        const hasMessages = fields.includes('messages');
        const hasTemplateUpdates = fields.includes('message_template_status_update');

        if (!hasMessages && !hasTemplateUpdates) {
            logger.warn('Webhook subscription missing essential fields', {
                subDomain,
                providedFields: fields,
                recommendedFields: ['messages', 'message_template_status_update']
            });
        }

        const result = await MetaWhatsAppService.subscribeWebhook(
            subDomain,
            webhookUrl,
            verifyToken,
            fields,
            localId
        );

        if (result.success) {
            res.json({
                type: '1',
                message: 'Webhook subscription created successfully',
                data: result,
            });
        } else {
            res.status(400).json({
                type: '3',
                message: result.error || 'Failed to subscribe to webhooks',
                data: result,
            });
        }
    } catch (error: any) {
        logger.error('Error subscribing to webhooks:', error);
        next(createServerError(error.message || 'Failed to subscribe to webhooks', error));
    }
};

/**
 * Update webhook subscription
 * PUT /api/v1/whatsapp/webhooks/subscriptions
 */
export const updateWebhookSubscription = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { subDomain, localId } = getBusinessContext(req);
        const { fields } = req.body;

        // Strict validation: Fields is required
        if (!fields) {
            return next(createValidationError('Missing required field: fields'));
        }

        // Strict validation: Fields must be an array
        if (!Array.isArray(fields)) {
            return next(createValidationError('Fields must be an array'));
        }

        // Strict validation: Fields cannot be empty
        if (fields.length === 0) {
            return next(createValidationError(
                'Fields array cannot be empty. You must subscribe to at least one webhook field. ' +
                'To unsubscribe completely, use DELETE /api/v1/whatsapp/webhooks/subscriptions/:appId instead. ' +
                'Recommended fields: ["messages", "message_template_status_update"]'
            ));
        }

        // Strict validation: All fields must be non-empty strings
        const invalidFields = fields.filter(f => typeof f !== 'string' || f.trim() === '');
        if (invalidFields.length > 0) {
            return next(createValidationError(
                'All fields must be non-empty strings. Invalid fields found: ' + JSON.stringify(invalidFields)
            ));
        }

        // Strict validation: Check for valid field names
        const validFieldNames = [
            'messages',
            'message_template_status_update',
            'messaging_postbacks',
            'messaging_optins',
            'message_deliveries',
            'message_reads',
            'messaging_referrals',
            'messaging_account_linking',
            'account_update',
            'phone_number_name_update',
            'phone_number_quality_update',
            'template_category_update'
        ];

        const unknownFields = fields.filter(f => !validFieldNames.includes(f));
        if (unknownFields.length > 0) {
            logger.warn('Unknown webhook fields provided for update', { unknownFields, subDomain });
            // Don't fail, just warn - Meta might add new fields
        }

        // Strict validation: Recommend essential fields
        const hasMessages = fields.includes('messages');
        const hasTemplateUpdates = fields.includes('message_template_status_update');

        if (!hasMessages && !hasTemplateUpdates) {
            logger.warn('Webhook subscription update missing essential fields', {
                subDomain,
                providedFields: fields,
                recommendedFields: ['messages', 'message_template_status_update']
            });
        }

        const result = await MetaWhatsAppService.updateWebhookSubscription(
            subDomain,
            fields,
            localId
        );

        if (result.success) {
            res.json({
                type: '1',
                message: 'Webhook subscription updated successfully',
                data: result,
            });
        } else {
            res.status(400).json({
                type: '3',
                message: result.error || 'Failed to update webhook subscription',
                data: result,
            });
        }
    } catch (error: any) {
        logger.error('Error updating webhook subscription:', error);
        next(createServerError(error.message || 'Failed to update webhook subscription', error));
    }
};

/**
 * Delete webhook subscription
 * DELETE /api/v1/whatsapp/webhooks/subscriptions/:appId
 */
export const deleteWebhookSubscription = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { subDomain, localId } = getBusinessContext(req);
        const { appId } = req.params;

        if (!appId) {
            return next(createValidationError('Missing appId parameter'));
        }

        const result = await MetaWhatsAppService.deleteWebhookSubscription(
            subDomain,
            appId,
            localId
        );

        if (result.success) {
            res.json({
                type: '1',
                message: 'Webhook subscription deleted successfully',
                data: result,
            });
        } else {
            res.status(400).json({
                type: '3',
                message: result.error || 'Failed to delete webhook subscription',
                data: result,
            });
        }
    } catch (error: any) {
        logger.error('Error deleting webhook subscription:', error);
        next(createServerError(error.message || 'Failed to delete webhook subscription', error));
    }
};

/**
 * Create message template
 * POST /api/v1/whatsapp/templates
 */
export const createTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { subDomain, localId } = getBusinessContext(req);
        const { name, category, language, components } = req.body;

        if (!name || !category || !language || !components) {
            return next(createValidationError('Missing required fields: name, category, language, components'));
        }

        const result = await MetaWhatsAppService.createTemplate(
            subDomain,
            { name, category, language, components },
            localId
        );

        if (result.success) {
            res.json({
                type: '1',
                message: 'Template created successfully',
                data: result,
            });
        } else {
            res.status(400).json({
                type: '3',
                message: result.error || 'Failed to create template',
                data: result,
            });
        }
    } catch (error: any) {
        logger.error('Error creating template:', error);
        next(createServerError(error.message || 'Failed to create template', error));
    }
};

/**
 * Get template status
 * GET /api/v1/whatsapp/templates/:templateName/status
 */
export const getTemplateStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { subDomain, localId } = getBusinessContext(req);
        const { templateName } = req.params;

        if (!templateName) {
            return next(createValidationError('Missing templateName parameter'));
        }

        const result = await MetaWhatsAppService.getTemplateStatus(
            subDomain,
            templateName,
            localId
        );

        res.json({
            type: '1',
            message: 'Template status retrieved successfully',
            data: result,
        });
    } catch (error: any) {
        logger.error('Error getting template status:', error);
        next(createServerError(error.message || 'Failed to get template status', error));
    }
};

/**
 * Delete template
 * DELETE /api/v1/whatsapp/templates/:templateName
 */
export const deleteTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { subDomain, localId } = getBusinessContext(req);
        const { templateName } = req.params;
        const { hsmId } = req.body;

        if (!templateName || !hsmId) {
            return next(createValidationError('Missing required fields: templateName (param), hsmId (body)'));
        }

        const result = await MetaWhatsAppService.deleteTemplate(
            subDomain,
            templateName,
            hsmId,
            localId
        );

        if (result.success) {
            res.json({
                type: '1',
                message: 'Template deleted successfully',
                data: result,
            });
        } else {
            res.status(400).json({
                type: '3',
                message: result.error || 'Failed to delete template',
                data: result,
            });
        }
    } catch (error: any) {
        logger.error('Error deleting template:', error);
        next(createServerError(error.message || 'Failed to delete template', error));
    }
};

/**
 * Get template library
 * GET /api/v1/whatsapp/templates/library
 */
export const getTemplateLibrary = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { language } = req.query;
        const { getTemplatesByLanguage } = await import('../../utils/templates');

        const templates = getTemplatesByLanguage((language as string) || 'en');

        res.json({
            type: '1',
            message: 'Template library retrieved successfully',
            data: {
                templates,
                totalCount: templates.length,
                language: language || 'en',
            },
        });
    } catch (error: any) {
        logger.error('Error getting template library:', error);
        next(createServerError(error.message || 'Failed to get template library', error));
    }
};

/**
 * Get specific template from library
 * GET /api/v1/whatsapp/templates/library/:templateId
 */
export const getTemplateFromLibrary = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { templateId } = req.params;
        const { language } = req.query;
        const { getTemplateById } = await import('../../utils/templates');

        const template = getTemplateById(templateId, (language as string) || 'en');

        if (!template) {
            return next(createValidationError(`Template ${templateId} not found in library`));
        }

        res.json({
            type: '1',
            message: 'Template retrieved successfully',
            data: template,
        });
    } catch (error: any) {
        logger.error('Error getting template from library:', error);
        next(createServerError(error.message || 'Failed to get template', error));
    }
};

/**
 * Provision selected templates from library
 * POST /api/v1/whatsapp/templates/provision-selected
 */
export const provisionSelectedTemplates = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { subDomain, localId } = getBusinessContext(req);
        const { templateIds, language } = req.body;

        if (!templateIds || !Array.isArray(templateIds) || templateIds.length === 0) {
            return next(createValidationError('templateIds must be a non-empty array'));
        }

        const lang = language || 'en';

        // Get template definitions from library
        const templates = templateIds
            .map(id => getTemplateById(id, lang))
            .filter(t => t !== undefined) as any[];

        if (templates.length === 0) {
            return next(createValidationError('No valid templates found in library'));
        }

        // Create templates via Meta API
        const results = [];
        for (const template of templates) {
            try {
                const result = await MetaWhatsAppService.createTemplate(
                    subDomain,
                    {
                        name: template.name,
                        category: template.category,
                        language: template.language,
                        components: template.components,
                    },
                    localId
                );
                results.push({
                    templateId: template.id,
                    templateName: template.name,
                    success: result.success,
                    status: result.status || 'PENDING',
                    error: result.error,
                });
            } catch (error: any) {
                logger.error(`Error creating template ${template.name}:`, error);
                results.push({
                    templateId: template.id,
                    templateName: template.name,
                    success: false,
                    error: error.message,
                });
            }
        }

        // Update business model with template tracking
        const business = await Business.findOne({ subDomain });
        if (business) {
            results.forEach((result) => {
                if (result.success) {
                    if (!business.whatsappTemplates) {
                        business.whatsappTemplates = [];
                    }

                    const existingIndex = business.whatsappTemplates.findIndex(
                        (t) => t.name === result.templateName
                    );

                    if (existingIndex >= 0) {
                        business.whatsappTemplates[existingIndex].status = result.status as any;
                    } else {
                        business.whatsappTemplates.push({
                            name: result.templateName,
                            templateId: result.templateId,
                            status: result.status as any,
                            createdAt: new Date(),
                            language: lang,
                            category: 'UTILITY',
                        });
                    }
                }
            });

            await business.save();
        }

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.length - successCount;

        res.json({
            type: '1',
            message: `Provisioned ${successCount} templates successfully${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
            data: {
                results,
                summary: {
                    total: results.length,
                    success: successCount,
                    failed: failureCount,
                },
            },
        });
    } catch (error: any) {
        logger.error('Error provisioning selected templates:', error);
        next(createServerError(error.message || 'Failed to provision templates', error));
    }
};

/**
 * Provision default templates
 * POST /api/v1/whatsapp/templates/provision
 */
export const provisionTemplates = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { subDomain, localId } = getBusinessContext(req);
        const { language } = req.body;

        const { templateProvisioningService } = await import('../../services/whatsapp/templateProvisioningService');
        const result = await templateProvisioningService.provisionTemplates(
            subDomain,
            language || 'es_PE',
            localId
        );

        // Update business model with template tracking
        const business = await Business.findOne({ subDomain });
        if (business) {
            business.templatesProvisioned = result.success;
            business.templatesProvisionedAt = new Date();

            // Update template tracking
            if (!business.whatsappTemplates) {
                business.whatsappTemplates = [];
            }

            result.results.forEach((templateResult) => {
                const existingIndex = business.whatsappTemplates!.findIndex(
                    (t) => t.name === templateResult.templateName
                );

                if (existingIndex >= 0) {
                    business.whatsappTemplates![existingIndex] = {
                        name: templateResult.templateName,
                        templateId: templateResult.templateId,
                        status: (templateResult.status as any) || 'PENDING',
                        createdAt: business.whatsappTemplates![existingIndex].createdAt,
                        approvedAt: templateResult.status === 'APPROVED' ? new Date() : undefined,
                        language: language || 'es_PE',
                        category: 'UTILITY',
                    };
                } else {
                    business.whatsappTemplates!.push({
                        name: templateResult.templateName,
                        templateId: templateResult.templateId,
                        status: (templateResult.status as any) || 'PENDING',
                        createdAt: new Date(),
                        approvedAt: templateResult.status === 'APPROVED' ? new Date() : undefined,
                        language: language || 'es_PE',
                        category: 'UTILITY',
                    });
                }
            });

            await business.save();
        }

        res.json({
            type: '1',
            message: `Template provisioning ${result.success ? 'completed' : 'completed with errors'}`,
            data: result,
        });
    } catch (error: any) {
        logger.error('Error provisioning templates:', error);
        next(createServerError(error.message || 'Failed to provision templates', error));
    }
};

/**
 * Check template statuses
 * GET /api/v1/whatsapp/templates/statuses
 */
export const checkTemplateStatuses = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { subDomain, localId } = getBusinessContext(req);

        const { templateProvisioningService } = await import('../../services/whatsapp/templateProvisioningService');
        const statuses = await templateProvisioningService.checkTemplateStatuses(
            subDomain,
            localId
        );

        res.json({
            type: '1',
            message: 'Template statuses retrieved successfully',
            data: statuses,
        });
    } catch (error: any) {
        logger.error('Error checking template statuses:', error);
        next(createServerError(error.message || 'Failed to check template statuses', error));
    }
};
