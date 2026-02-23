import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import logger from '../../utils/logger';
import { MetaWhatsAppService } from '../../services/whatsapp/metaWhatsAppService';
import { Business } from '../../models/Business';
import { createValidationError, createServerError } from '../../utils/whatsappErrors';
import { getBusinessContext } from './whatsappHelpers';

/**
 * Redact sensitive data from webhook payload for logging
 * Removes PII like phone numbers, message text, templates, etc.
 * Keeps only safe metadata like IDs, event types, timestamps
 */
const redactWebhookPayload = (body: any): any => {
    if (!body || typeof body !== 'object') {
        return body;
    }

    const redacted = { ...body };

    if (redacted.entry && Array.isArray(redacted.entry)) {
        redacted.entry = redacted.entry.map((entry: any) => {
            const redactedEntry: any = {
                id: entry.id,
                time: entry.time,
            };

            if (entry.changes && Array.isArray(entry.changes)) {
                redactedEntry.changes = entry.changes.map((change: any) => {
                    const redactedChange: any = {
                        field: change.field,
                        value: {},
                    };

                    // Keep only safe metadata from value
                    if (change.value) {
                        const value = change.value;

                        // Keep metadata only
                        if (value.metadata) {
                            redactedChange.value.metadata = {
                                phone_number_id: value.metadata.phone_number_id
                                    ? '[REDACTED]'
                                    : undefined,
                                display_phone_number: value.metadata.display_phone_number
                                    ? '[REDACTED]'
                                    : undefined,
                            };
                        }

                        // For messages: keep IDs, redact content
                        if (value.messages && Array.isArray(value.messages)) {
                            redactedChange.value.messages = value.messages.map((msg: any) => ({
                                id: msg.id,
                                type: msg.type,
                                timestamp: msg.timestamp,
                                from: msg.from ? '[REDACTED]' : undefined,
                                // Don't log: text, caption, media, location, contacts, etc.
                            }));
                        }

                        // For statuses: keep IDs and status, redact recipient
                        if (value.statuses && Array.isArray(value.statuses)) {
                            redactedChange.value.statuses = value.statuses.map((status: any) => ({
                                id: status.id,
                                status: status.status,
                                timestamp: status.timestamp,
                                // Don't log: recipient_id, conversation, pricing, etc.
                            }));
                        }

                        // For templates: keep IDs only
                        if (value.message_template_id) {
                            redactedChange.value.message_template_id = value.message_template_id;
                        }
                        if (value.message_template_name) {
                            redactedChange.value.message_template_name = '[REDACTED]';
                        }
                        if (value.message_template_language) {
                            redactedChange.value.message_template_language = value.message_template_language;
                        }
                    }

                    return redactedChange;
                });
            }

            return redactedEntry;
        });
    }

    return redacted;
};

/**
 * Verify Meta webhook signature using X-Hub-Signature-256
 * Uses SHA-256 HMAC with the App Secret
 * 
 * @param rawBody - Raw request body as string (before JSON parsing)
 * @param signature - X-Hub-Signature-256 header value (format: sha256=<signature>)
 * @param secret - Facebook App Secret
 * @returns true if signature is valid, false otherwise
 */
const verifyWebhookSignature = (
    rawBody: string,
    signature: string,
    secret: string
): boolean => {
    try {
        if (!signature || !secret || !rawBody) {
            return false;
        }

        // Extract signature value (remove 'sha256=' prefix if present)
        const signatureValue = signature.startsWith('sha256=')
            ? signature.slice(7)
            : signature;

        // Compute expected signature
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(rawBody, 'utf8');
        const expectedSignature = hmac.digest('hex');

        // Use timing-safe comparison to prevent timing attacks
        if (signatureValue.length !== expectedSignature.length) {
            return false;
        }

        return crypto.timingSafeEqual(
            Buffer.from(signatureValue, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    } catch (error) {
        logger.error(`Error verifying webhook signature: ${error}`);
        return false;
    }
};

/**
 * Exchange Facebook OAuth authorization code for access token
 * POST /api/v1/whatsapp/facebook/exchange-token
 * Stores the access token securely (encrypted) in the database
 */
export const exchangeToken = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { subDomain, localId } = getBusinessContext(req);
        const {
            code,
            waba_id,
            phone_number_id,
            redirect_uri,
            business_id,
            catalog_ids,
            page_ids,
            instagram_account_ids,
            dataset_ids
        } = req.body;

        if (!waba_id) {
            return next(createValidationError('WABA ID is required'));
        }
        if (!phone_number_id) {
            return next(createValidationError('Phone number ID is required'));
        }
        if (!code) {
            return next(createValidationError('Authorization code is required'));
        }

        // Log all received data for debugging
        logger.info('Exchange token request received', {
            subDomain,
            localId,
            waba_id,
            phone_number_id,
            business_id,
            catalog_ids,
            page_ids,
            instagram_account_ids,
            dataset_ids,
            hasRedirectUri: !!redirect_uri
        });

        // Exchange authorization code for access token
        // Use redirect_uri from request body if provided, otherwise use environment variable
        // The redirect_uri MUST exactly match the one used in the OAuth authorization request
        let tokenResponse;
        try {
            tokenResponse = await MetaWhatsAppService.exchangeAuthorizationCode(code, redirect_uri);
        } catch (error: any) {
            // Check if this is an expired authorization code error
            if (error.isExpiredCode) {
                logger.error('Authorization code has expired', {
                    subDomain,
                    localId,
                    errorCode: error.errorCode,
                    errorSubcode: error.errorSubcode,
                });
                return next(createServerError(
                    'Authorization code has expired. Facebook OAuth codes expire after approximately 10 minutes. Please initiate a new OAuth flow to get a fresh authorization code.',
                    error
                ));
            }

            // Check if this is a redirect URI mismatch error
            if (error.isRedirectUriMismatch) {
                logger.error('Redirect URI mismatch', {
                    subDomain,
                    localId,
                    errorCode: error.errorCode,
                    errorSubcode: error.errorSubcode,
                    redirectUri: error.redirectUri,
                    providedRedirectUri: redirect_uri,
                    envRedirectUri: process.env.FACEBOOK_REDIRECT_URI,
                });
                return next(createServerError(
                    `Redirect URI mismatch: The redirect_uri used in the token exchange must exactly match the one used in the OAuth authorization request. ` +
                    `Provided redirect_uri: ${redirect_uri || 'using environment variable'}, ` +
                    `Environment redirect_uri: ${process.env.FACEBOOK_REDIRECT_URI || 'not set'}. ` +
                    `Please ensure the redirect_uri parameter in your OAuth authorization URL matches exactly (including protocol, domain, path, and trailing slashes).`,
                    error
                ));
            }

            // Check if redirect URI is missing
            if (error.isMissingRedirectUri) {
                logger.error('Missing redirect URI', {
                    subDomain,
                    localId,
                    providedRedirectUri: redirect_uri,
                    envRedirectUri: process.env.FACEBOOK_REDIRECT_URI,
                });
                return next(createServerError(
                    'Redirect URI is required for OAuth token exchange. Please provide redirect_uri in the request body or set FACEBOOK_REDIRECT_URI environment variable.',
                    error
                ));
            }

            // Re-throw other errors to be handled by the outer catch block
            throw error;
        }

        logger.info('Token response:', tokenResponse);

        if (!tokenResponse || !tokenResponse.access_token) {
            logger.error('Failed to exchange authorization code for access token', {
                subDomain,
                localId,
                hasCode: !!code,
            });
            return next(createServerError('Failed to exchange authorization code for access token', null));
        }

        // Get business to update
        let business;
        if (localId) {
            const { BusinessLocation } = await import('../../models/BusinessLocation');
            const businessLocation = await BusinessLocation.findOne({
                subDomain,
                localId
            });
            if (!businessLocation) {
                logger.error('BusinessLocation not found for token exchange', { subDomain, localId });
                return next(createServerError('Business location not found', null));
            }
            business = await Business.findOne({ businessId: businessLocation.businessId });
        } else {
            business = await Business.findOne({ subDomain });
        }

        if (!business) {
            logger.error('Business not found for token exchange', { subDomain, localId });
            return next(createServerError('Business not found', null));
        }

        // Normalize date fields if they're in extended JSON format (defensive fix)
        // This handles cases where hooks might not catch the issue
        if (business.createdAt && typeof business.createdAt === 'object' && business.createdAt !== null && !(business.createdAt instanceof Date) && (business.createdAt as any).$date) {
            try {
                const before = business.createdAt;
                business.createdAt = new Date((business.createdAt as any).$date);
                business.markModified('createdAt');
                logger.debug('Normalized createdAt in controller', { before, after: business.createdAt });
            } catch (err) {
                logger.error('Error normalizing createdAt in controller:', err);
            }
        }
        if (business.updatedAt && typeof business.updatedAt === 'object' && business.updatedAt !== null && !(business.updatedAt instanceof Date) && (business.updatedAt as any).$date) {
            try {
                const before = business.updatedAt;
                business.updatedAt = new Date((business.updatedAt as any).$date);
                business.markModified('updatedAt');
                logger.debug('Normalized updatedAt in controller', { before, after: business.updatedAt });
            } catch (err) {
                logger.error('Error normalizing updatedAt in controller:', err);
            }
        }

        // Calculate expiration date
        const expiresIn = tokenResponse.expires_in || 5184000; // Default to 60 days if not provided
        const expiresAt = new Date(Date.now() + expiresIn * 1000);

        // Update business with encrypted token and metadata
        // The token will be automatically encrypted by the pre-save middleware
        business.whatsappAccessToken = tokenResponse.access_token;
        business.whatsappTokenExpiresAt = expiresAt;
        business.whatsappEnabled = true;

        // Update WABA ID and phone number ID if provided
        if (waba_id) {
            business.wabaId = waba_id;
        }
        if (phone_number_id) {
            // Add to phone number IDs array if not already present
            if (!business.whatsappPhoneNumberIds || !Array.isArray(business.whatsappPhoneNumberIds)) {
                business.whatsappPhoneNumberIds = [];
            }
            if (!business.whatsappPhoneNumberIds.includes(phone_number_id)) {
                business.whatsappPhoneNumberIds.push(phone_number_id);
            }
        }

        // Update Facebook Business ID if provided
        if (business_id) {
            business.fbBusinessId = business_id;
            business.businessManagerId = business_id; // Also set the alias
            logger.debug('Updated Facebook Business ID', { business_id });
        }

        // Update catalog IDs if provided
        if (catalog_ids && Array.isArray(catalog_ids) && catalog_ids.length > 0) {
            // Initialize arrays if they don't exist
            if (!business.fbCatalogIds || !Array.isArray(business.fbCatalogIds)) {
                business.fbCatalogIds = [];
            }

            // Add new catalog IDs that aren't already in the array
            catalog_ids.forEach((catalogId: string) => {
                if (catalogId && !business.fbCatalogIds!.includes(catalogId)) {
                    business.fbCatalogIds!.push(catalogId);
                }
            });

            logger.debug('Updated catalog IDs', {
                providedCatalogIds: catalog_ids,
                storedCatalogIds: business.fbCatalogIds
            });
        }

        // Log page_ids, instagram_account_ids, and dataset_ids for future implementation
        // These fields don't currently have dedicated schema fields but are logged for tracking
        if (page_ids && page_ids.length > 0) {
            logger.info('Facebook Page IDs received (not stored yet)', { page_ids });
        }
        if (instagram_account_ids && instagram_account_ids.length > 0) {
            logger.info('Instagram Account IDs received (not stored yet)', { instagram_account_ids });
        }
        if (dataset_ids && dataset_ids.length > 0) {
            logger.info('Dataset IDs received (not stored yet)', { dataset_ids });
        }

        await business.save();

        logger.info('Successfully exchanged authorization code and stored access token', {
            subDomain,
            localId,
            wabaId: waba_id,
            phoneNumberId: phone_number_id,
            businessId: business_id,
            catalogIds: catalog_ids,
            expiresAt: expiresAt.toISOString(),
        });

        res.json({
            type: '1',
            message: 'Token exchanged and stored successfully',
            data: {
                expiresAt: expiresAt.toISOString(),
                expiresIn: expiresIn,
                wabaId: business.wabaId,
                phoneNumberIds: business.whatsappPhoneNumberIds,
                fbBusinessId: business.fbBusinessId,
                catalogIds: business.fbCatalogIds,
                whatsappEnabled: business.whatsappEnabled,
            },
        });
    } catch (error: any) {
        logger.error('Error exchanging authorization code:', error);
        next(createServerError(error.message || 'Failed to exchange authorization code', error));
    }
};

/**
 * Get conversations with datatable support (pagination, sorting, filtering)
 * GET /api/v1/whatsapp/conversations
 *
 * Supports:
 * - Pagination (page, limit)
 * - Sorting (sortBy, sortOrder)
 * - Filtering (search, intent, isActive, dateFrom, dateTo)
 * - User info enrichment
 */
export const getConversations = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { subDomain, localId } = getBusinessContext(req);

        // Pagination parameters
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        // Sorting parameters
        const sortBy = (req.query.sortBy as string) || 'lastActivity';
        const sortOrder = (req.query.sortOrder as string) === 'asc' ? 1 : -1;

        // Filtering parameters
        const search = req.query.search as string;
        const intent = req.query.intent as string;
        const isActive = req.query.isActive as string;
        const dateFrom = req.query.dateFrom as string;
        const dateTo = req.query.dateTo as string;

        // Import ConversationState model
        const { ConversationState } = await import('../../models/ConversationState');

        // Build filter query
        const filter: any = { subDomain };

        // Add localId filter if provided
        if (localId) {
            filter.localId = localId;
        }

        // Filter by intent
        if (intent && intent !== 'all') {
            filter.currentIntent = intent;
        }

        // Filter by active status
        if (isActive !== undefined && isActive !== 'all') {
            filter.isActive = isActive === 'true';
        }

        // Filter by date range
        if (dateFrom || dateTo) {
            filter.lastActivity = {};
            if (dateFrom) {
                filter.lastActivity.$gte = new Date(dateFrom);
            }
            if (dateTo) {
                filter.lastActivity.$lte = new Date(dateTo);
            }
        }

        // Search by userId (phone number) or customer name
        if (search) {
            filter.$or = [
                { userId: { $regex: search, $options: 'i' } },
                { 'context.customerName': { $regex: search, $options: 'i' } },
                { 'context.customerEmail': { $regex: search, $options: 'i' } }
            ];
        }

        // Build sort object
        const sort: any = {};
        sort[sortBy] = sortOrder;

        // Execute query with pagination
        const [conversations, totalCount] = await Promise.all([
            ConversationState.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('botId', 'name description')
                .lean(),
            ConversationState.countDocuments(filter)
        ]);

        // Calculate pagination metadata
        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        // Enrich conversations with additional data
        const enrichedConversations = conversations.map((conv: any) => {
            // Extract last message
            const lastMessage = conv.context?.previousMessages?.length > 0
                ? conv.context.previousMessages[conv.context.previousMessages.length - 1]
                : null;

            // Calculate message count
            const messageCount = conv.context?.previousMessages?.length || 0;

            // Calculate conversation duration
            const duration = conv.updatedAt && conv.createdAt
                ? Math.floor((new Date(conv.updatedAt).getTime() - new Date(conv.createdAt).getTime()) / 1000)
                : 0;

            return {
                id: conv._id,
                sessionId: conv.sessionId,
                userId: conv.userId,
                phoneNumber: conv.userId,
                customerName: conv.context?.customerName || null,
                customerEmail: conv.context?.customerEmail || null,
                bot: conv.botId ? {
                    id: conv.botId._id || conv.botId,
                    name: conv.botId.name || 'Unknown Bot',
                    description: conv.botId.description || null
                } : null,
                currentIntent: conv.currentIntent,
                currentStep: conv.currentStep,
                previousIntent: conv.previousIntent,
                isActive: conv.isActive,
                lastActivity: conv.lastActivity,
                createdAt: conv.createdAt,
                updatedAt: conv.updatedAt,
                expiresAt: conv.expiresAt,
                currentOrderId: conv.currentOrderId || null,
                orderHistory: conv.orderHistory || [],
                messageCount: messageCount,
                lastMessage: lastMessage ? {
                    role: lastMessage.role,
                    content: lastMessage.content,
                    timestamp: lastMessage.timestamp
                } : null,
                duration: duration,
                context: {
                    selectedItemsCount: conv.context?.selectedItems?.length || 0,
                    orderTotal: conv.context?.orderTotal || 0,
                    paymentMethod: conv.context?.paymentMethod || null,
                    hasDeliveryAddress: !!conv.context?.deliveryAddress
                },
                metadata: conv.metadata || {}
            };
        });

        // Response
        res.json({
            type: '1',
            message: 'Conversations retrieved successfully',
            data: {
                conversations: enrichedConversations,
                pagination: {
                    page,
                    limit,
                    totalCount,
                    totalPages,
                    hasNextPage,
                    hasPrevPage,
                    count: enrichedConversations.length
                },
                filters: {
                    search: search || null,
                    intent: intent || 'all',
                    isActive: isActive || 'all',
                    dateFrom: dateFrom || null,
                    dateTo: dateTo || null
                },
                sorting: {
                    sortBy,
                    sortOrder: sortOrder === 1 ? 'asc' : 'desc'
                }
            }
        });

    } catch (error: any) {
        logger.error('Error getting conversations:', error);
        next(createServerError(error.message || 'Failed to get conversations', error));
    }
};

/**
 * Handle incoming webhook from Meta WhatsApp Business API
 * POST /api/v1/whatsapp/webhook
 *
 * Handles multiple businesses by identifying them through:
 * - Phone Number ID (from webhook metadata)
 * - WABA ID (from entry ID)
 *
 * Supports all Meta webhook event types:
 * - messages (incoming messages)
 * - statuses (message delivery status)
 * - message_template_status_update (template approval status)
 *
 * Security: Verifies X-Hub-Signature-256 before processing events
 */
export const handleWebhook = async (
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    try {
        // Verify webhook (for initial setup) - GET request
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode === 'subscribe' && token) {
            const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
            if (token === verifyToken) {
                logger.info('WhatsApp webhook verified');
                return res.status(200).send(challenge);
            } else {
                logger.error('WhatsApp webhook verification failed - Invalid token');
                return res.status(403).json({
                    type: '3',
                    message: 'Invalid verify token',
                    data: null,
                });
            }
        }

        // For POST requests (webhook events), verify signature before processing
        // GET requests (webhook verification) don't need signature verification
        if (req.method === 'POST') {
            const signature = req.headers['x-hub-signature-256'] as string;
            const appSecret = process.env.FACEBOOK_APP_SECRET;

            if (!appSecret) {
                logger.error('FACEBOOK_APP_SECRET not configured - cannot verify webhook signature');
                return res.status(500).json({
                    type: '3',
                    message: 'Webhook signature verification not configured',
                    data: null,
                });
            }

            if (!signature) {
                logger.error('Webhook signature missing - X-Hub-Signature-256 header not found');
                return res.status(403).json({
                    type: '3',
                    message: 'Webhook signature required',
                    data: null,
                });
            }

            // Get raw body for signature verification (captured by app middleware)
            const rawBody = (req as any).rawBody || JSON.stringify(req.body);

            // Verify signature before processing any events
            const isValidSignature = verifyWebhookSignature(rawBody, signature, appSecret);

            if (!isValidSignature) {
                logger.error('Invalid webhook signature - potential spoofing attempt', {
                    signatureReceived: signature.substring(0, 20) + '...',
                    hasRawBody: !!rawBody,
                    rawBodyLength: rawBody?.length || 0,
                });
                return res.status(403).json({
                    type: '3',
                    message: 'Invalid webhook signature',
                    data: null,
                });
            }

            logger.info('Webhook signature verified successfully');
        }

        // Handle webhook events
        const body = req.body;

        // Log redacted payload (no PII - only IDs, types, timestamps)
        const redactedBody = redactWebhookPayload(body);
        logger.info('Received WhatsApp webhook event', {
            object: body.object,
            entryCount: body.entry?.length || 0,
            redactedPayload: redactedBody,
        });

        // Process webhook events for whatsapp_business_account object
        if (body.object === 'whatsapp_business_account') {
            const entries = body.entry || [];

            // Queue each entry for async processing
            for (const entry of entries) {
                try {
                    // Identify which business this webhook belongs to (quick synchronous lookup)
                    const { extractBusinessFromWebhook } = await import(
                        '../../services/whatsapp/metaWhatsAppWebhookService'
                    );

                    const businessInfo = await extractBusinessFromWebhook(entry);

                    if (!businessInfo) {
                        logger.warn('Could not identify business for webhook entry', {
                            entryId: entry.id,
                        });
                        continue; // Skip this entry but process others
                    }

                    const { business } = businessInfo;

                    logger.info(
                        `Queueing webhook entry for async processing: ${business.subDomain}`,
                        {
                            entryId: entry.id,
                            wabaId: business.wabaId,
                        }
                    );

                    // Queue the entry for async processing via Inngest
                    const { inngest } = await import('../../services/inngestService');

                    await inngest.send({
                        name: 'whatsapp/webhook.entry',
                        data: {
                            businessId: (business._id as any).toString(),
                            entry,
                            subDomain: business.subDomain,
                        },
                    });

                    logger.info(
                        `Webhook entry queued for business: ${business.subDomain}`,
                        {
                            entryId: entry.id,
                        }
                    );
                } catch (entryError: any) {
                    logger.error(`Error queueing webhook entry: ${entryError}`, {
                        entryId: entry.id,
                        error: entryError.message,
                    });
                    // Continue processing other entries even if one fails
                    // Note: We still return 200 to Meta to prevent retries
                }
            }
        } else {
            logger.warn(`Unknown webhook object type: ${body.object}`);
        }

        // Always return 200 to acknowledge receipt (Meta expects this)
        res.status(200).json({
            type: '1',
            message: 'Webhook received',
            data: null,
        });
    } catch (error: any) {
        logger.error('Error handling webhook:', error);
        // Still return 200 to prevent Meta from retrying and causing issues
        res.status(200).json({
            type: '3',
            message: 'Error processing webhook',
            data: null,
        });
    }
};
