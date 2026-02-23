import { Request, Response, NextFunction } from 'express';
import logger from '../../utils/logger';
import { MetaWhatsAppService } from '../../services/whatsapp/metaWhatsAppService';
import { createValidationError, createServerError } from '../../utils/whatsappErrors';
import { getBusinessContext } from './whatsappHelpers';

/**
 * Validate migration data
 * POST /api/v1/whatsapp/migrate/validate
 */
export const validateMigration = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { subDomain, localId } = getBusinessContext(req);
        const { newWabaId, newPhoneNumberIds, newAccessToken } = req.body;

        if (!newWabaId || !newPhoneNumberIds || !newAccessToken) {
            return next(createValidationError('Missing required fields: newWabaId, newPhoneNumberIds, newAccessToken'));
        }

        if (!Array.isArray(newPhoneNumberIds) || newPhoneNumberIds.length === 0) {
            return next(createValidationError('newPhoneNumberIds must be a non-empty array'));
        }

        const result = await MetaWhatsAppService.validateMigration(
            subDomain,
            newWabaId,
            newPhoneNumberIds,
            newAccessToken,
            localId
        );

        if (result.isValid) {
            res.json({
                type: '1',
                message: 'Migration validation passed',
                data: result,
            });
        } else {
            res.status(400).json({
                type: '3',
                message: 'Migration validation failed',
                data: result,
            });
        }
    } catch (error: any) {
        logger.error('Error validating migration:', error);
        next(createServerError(error.message || 'Failed to validate migration', error));
    }
};

/**
 * Execute migration
 * POST /api/v1/whatsapp/migrate/execute
 */
export const executeMigration = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { subDomain, localId } = getBusinessContext(req);
        const { newWabaId, newPhoneNumberIds, newAccessToken, newTokenExpiresAt, migratedBy } = req.body;

        if (!newWabaId || !newPhoneNumberIds || !newAccessToken) {
            return next(createValidationError('Missing required fields: newWabaId, newPhoneNumberIds, newAccessToken'));
        }

        if (!Array.isArray(newPhoneNumberIds) || newPhoneNumberIds.length === 0) {
            return next(createValidationError('newPhoneNumberIds must be a non-empty array'));
        }

        const migrationData = {
            newWabaId,
            newPhoneNumberIds,
            newAccessToken,
            newTokenExpiresAt: newTokenExpiresAt ? new Date(newTokenExpiresAt) : undefined,
            migratedBy: migratedBy || (req as any).user?.id,
        };

        const result = await MetaWhatsAppService.executeMigration(
            subDomain,
            migrationData,
            localId
        );

        if (result.success) {
            res.json({
                type: '1',
                message: 'Migration executed successfully',
                data: result,
            });
        } else {
            res.status(400).json({
                type: '3',
                message: result.error || 'Migration execution failed',
                data: result,
            });
        }
    } catch (error: any) {
        logger.error('Error executing migration:', error);
        next(createServerError(error.message || 'Failed to execute migration', error));
    }
};

/**
 * Get migration status
 * GET /api/v1/whatsapp/migrate/status
 */
export const getMigrationStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { subDomain, localId } = getBusinessContext(req);

        const result = await MetaWhatsAppService.getMigrationStatus(subDomain, localId);

        res.json({
            type: '1',
            message: 'Migration status retrieved successfully',
            data: result,
        });
    } catch (error: any) {
        logger.error('Error getting migration status:', error);
        next(createServerError(error.message || 'Failed to get migration status', error));
    }
};

/**
 * Rollback migration
 * POST /api/v1/whatsapp/migrate/rollback
 */
export const rollbackMigration = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { subDomain, localId } = getBusinessContext(req);
        const { migrationId } = req.body;

        if (!migrationId) {
            return next(createValidationError('Missing required field: migrationId'));
        }

        const result = await MetaWhatsAppService.rollbackMigration(
            subDomain,
            migrationId,
            localId
        );

        if (result.success) {
            res.json({
                type: '1',
                message: 'Migration rolled back successfully',
                data: result,
            });
        } else {
            res.status(400).json({
                type: '3',
                message: result.error || 'Migration rollback failed',
                data: result,
            });
        }
    } catch (error: any) {
        logger.error('Error rolling back migration:', error);
        next(createServerError(error.message || 'Failed to rollback migration', error));
    }
};
