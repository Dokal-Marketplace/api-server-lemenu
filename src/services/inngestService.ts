import { Inngest } from 'inngest';
import { serve } from 'inngest/express';
import logger from '../utils/logger';

// ============= Types =============
export interface MenuItem {
  name: string;
  description?: string;
  price: number;
  currency: string;
  category?: string;
  confidence: number;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface MenuSection {
  category: string;
  items: MenuItem[];
}

export interface ParsedMenu {
  restaurantName?: string;
  sections: MenuSection[];
  rawText: string;
  metadata: {
    totalItems: number;
    averageConfidence: number;
    parsedAt: Date;
    ocrProvider: string;
    processingTimeMs?: number;
  };
}

export interface OCRLine {
  text: string;
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
  blockType?: string;
}

export interface OCRResult {
  text: string;
  confidence: number;
  lines: OCRLine[];
  words?: Array<{
    text: string;
    confidence: number;
    bbox: { x: number; y: number; width: number; height: number };
  }>;
}

// ============= Inngest Client =============
export const inngest = new Inngest({ 
  id: 'lemenu-api-server',
  name: 'LeMenu API Server'
});

// ============= Menu Processing Functions =============

// Main function: Process menu from URL with durable steps
const processMenuFromUrl = inngest.createFunction(
  { 
    id: 'process-menu-url',
    name: 'Process Menu from URL',
    retries: 3
  },
  { event: 'menu/process.url' },
  async ({ event, step }) => {
    const { imageUrl, menuId, userId, restaurantId, subDomain, localId } = event.data;

    // Step 1: Validate input and fetch image
    await step.run('fetch-image', async () => {
      logger.info(`Fetching image from ${imageUrl}`);
      const response = await fetch(imageUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      return {
        buffer: buffer.toString('base64'),
        size: buffer.length,
        contentType: response.headers.get('content-type')
      };
    });

    // Step 2: Perform OCR with AWS Textract
    const ocrResult = await step.run('perform-ocr', async () => {
      logger.info(`Running OCR for menu ${menuId}`);
      
      // TODO: Implement OCR processing
      // For now, return a mock result
      
      // Mock OCR result - replace with actual implementation
      const result: OCRResult = {
        text: 'Mock OCR text',
        confidence: 85,
        lines: [],
        words: []
      };
      
      if (result.confidence < 50) {
        throw new Error(`OCR confidence too low: ${result.confidence}%`);
      }
      
      return result;
    });

    // Step 3: Parse menu structure
    const parsedMenu = await step.run('parse-menu-structure', async () => {
      logger.info(`Parsing menu structure for ${menuId}`);
      
      // TODO: Implement menu parsing
      // For now, return a mock result
      const menu: ParsedMenu = {
        restaurantName: 'Mock Restaurant',
        sections: [],
        rawText: ocrResult.text,
        metadata: {
          totalItems: 0,
          averageConfidence: ocrResult.confidence,
          parsedAt: new Date(),
          ocrProvider: 'Mock',
          processingTimeMs: 1000
        }
      };
      
      if (menu.metadata.totalItems === 0) {
        throw new Error('No menu items found in the image');
      }
      
      return menu;
    });

    // Step 4: Save to database
    await step.run('save-to-database', async () => {
      logger.info(`Saving menu ${menuId} to database`);
      
      // TODO: Replace with actual database call
      // const result = await db.menus.create({
      //   id: menuId,
      //   userId,
      //   restaurantId,
      //   subDomain,
      //   localId,
      //   restaurantName: parsedMenu.restaurantName,
      //   sections: parsedMenu.sections,
      //   rawText: parsedMenu.rawText,
      //   metadata: parsedMenu.metadata,
      //   imageUrl,
      //   createdAt: new Date()
      // });
      
      return { 
        menuId, 
        saved: true,
        timestamp: new Date().toISOString()
      };
    });

    // Step 5: Send webhook notification (if configured)
    await step.run('send-webhook', async () => {
      const webhookUrl = process.env.WEBHOOK_URL;
      if (!webhookUrl) {
        logger.info('No webhook URL configured, skipping notification');
        return { skipped: true };
      }

      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'menu.processed',
            data: {
              menuId,
              userId,
              restaurantId,
              subDomain,
              localId,
              itemCount: parsedMenu.metadata.totalItems,
              confidence: parsedMenu.metadata.averageConfidence
            }
          })
        });

        return { 
          sent: response.ok,
          status: response.status 
        };
      } catch (error) {
        logger.error('Webhook notification failed:', error);
        return { sent: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    // Return final result
    return {
      success: true,
      menuId,
      restaurantName: parsedMenu.restaurantName,
      itemCount: parsedMenu.metadata.totalItems,
      averageConfidence: parsedMenu.metadata.averageConfidence,
      processingTimeMs: parsedMenu.metadata.processingTimeMs
    };
  }
);

// Function: Process menu from S3
const processMenuFromS3 = inngest.createFunction(
  { 
    id: 'process-menu-s3',
    name: 'Process Menu from S3',
    retries: 3
  },
  { event: 'menu/process.s3' },
  async ({ event, step }) => {
    const { bucket, key, menuId } = event.data;

    // Step 1: Validate S3 access
    await step.run('validate-s3-access', async () => {
      logger.info(`Validating S3 access for ${bucket}/${key}`);
      // TODO: Add S3 validation logic
      return { valid: true };
    });

    // Step 2: Perform OCR directly from S3
    const ocrResult = await step.run('perform-ocr-s3', async () => {
      logger.info(`Running OCR from S3 for menu ${menuId}`);
      
      // TODO: Implement S3 OCR processing
      // For now, return a mock result
      const result: OCRResult = {
        text: 'Mock S3 OCR text',
        confidence: 85,
        lines: [],
        words: []
      };
      
      if (result.confidence < 50) {
        throw new Error(`OCR confidence too low: ${result.confidence}%`);
      }
      
      return result;
    });

    // Step 3: Parse menu
    const parsedMenu = await step.run('parse-menu-structure', async () => {
      // TODO: Implement menu parsing
      // For now, return a mock result
      const menu: ParsedMenu = {
        restaurantName: 'Mock S3 Restaurant',
        sections: [],
        rawText: ocrResult.text,
        metadata: {
          totalItems: 0,
          averageConfidence: ocrResult.confidence,
          parsedAt: new Date(),
          ocrProvider: 'Mock S3',
          processingTimeMs: 1000
        }
      };
      
      if (menu.metadata.totalItems === 0) {
        throw new Error('No menu items found');
      }
      
      return menu;
    });

    // Step 4: Save to database
    await step.run('save-to-database', async () => {
      logger.info(`Saving S3 menu ${menuId} to database`);
      // TODO: Implement database save
      return { saved: true };
    });

    return {
      success: true,
      menuId,
      source: 's3',
      itemCount: parsedMenu.metadata.totalItems,
      averageConfidence: parsedMenu.metadata.averageConfidence
    };
  }
);

// Function: Batch process multiple menus with concurrency control
const batchProcessMenus = inngest.createFunction(
  { 
    id: 'batch-process-menus',
    name: 'Batch Process Menus',
    concurrency: 5,
    retries: 2
  },
  { event: 'menu/batch.process' },
  async ({ event, step }) => {
    const { menus, batchId } = event.data;

    // Step 1: Validate batch
    await step.run('validate-batch', async () => {
      logger.info(`Validating batch ${batchId} with ${menus.length} menus`);
      
      if (!menus || menus.length === 0) {
        throw new Error('Batch contains no menus');
      }
      
      if (menus.length > 100) {
        throw new Error('Batch size exceeds maximum of 100');
      }
      
      return { valid: true, count: menus.length };
    });

    // Step 2: Process each menu by sending individual events
    const results = [];
    for (const [index, menu] of menus.entries()) {
      const result = await step.run(`trigger-menu-${index}`, async () => {
        await inngest.send({
          name: 'menu/process.url',
          data: {
            imageUrl: menu.imageUrl,
            menuId: menu.menuId,
            userId: menu.userId || 'anonymous',
            restaurantId: menu.restaurantId,
            subDomain: menu.subDomain,
            localId: menu.localId,
            batchId
          }
        });
        
        return { 
          menuId: menu.menuId, 
          triggered: true 
        };
      });

      results.push(result);

      if (index < menus.length - 1) {
        await step.sleep(`wait-${index}`, '1s');
      }
    }

    // Step 3: Save batch record
    await step.run('save-batch-record', async () => {
      logger.info(`Saving batch record ${batchId}`);
      // TODO: Save batch metadata to database
      return { 
        batchId, 
        totalMenus: menus.length,
        status: 'processing'
      };
    });

    return {
      success: true,
      batchId,
      totalMenus: menus.length,
      triggered: results.length
    };
  }
);

// Function: Retry failed menu processing
const retryFailedMenu = inngest.createFunction(
  {
    id: 'retry-failed-menu',
    name: 'Retry Failed Menu Processing'
  },
  { event: 'menu/retry' },
  async ({ event, step }) => {
    const { menuId, originalError } = event.data;

    await step.run('log-retry-attempt', async () => {
      logger.info(`Retrying menu ${menuId} after error: ${originalError}`);
      return { retrying: true };
    });

    // Fetch original menu data from database
    const menuData = await step.run('fetch-original-data', async () => {
      // TODO: Fetch from database
      return event.data;
    });

    // Re-trigger processing
    await step.run('re-trigger-processing', async () => {
      await inngest.send({
        name: 'menu/process.url',
        data: menuData
      });
      return { triggered: true };
    });

    return { success: true, menuId, retriggered: true };
  }
);

// Function: Provision WhatsApp templates in background
const provisionWhatsAppTemplates = inngest.createFunction(
  {
    id: 'provision-whatsapp-templates',
    name: 'Provision WhatsApp Templates',
    retries: 2
  },
  { event: 'whatsapp/templates.provision' },
  async ({ event, step }) => {
    const { subDomain, businessId, language } = event.data;

    // Step 1: Validate business exists and has WABA configured
    await step.run('validate-business', async () => {
      const { Business } = await import('../models/Business');
      const business = await Business.findById(businessId);
      
      if (!business) {
        throw new Error(`Business ${businessId} not found`);
      }
      
      if (!business.wabaId || !business.whatsappAccessToken) {
        throw new Error(`Business ${subDomain} does not have WABA configured`);
      }
      
      return {
        subDomain: business.subDomain,
        hasTemplates: business.templatesProvisioned || false
      };
    });

    // Step 2: Provision templates
    const provisionResult = await step.run('provision-templates', async () => {
      const { templateProvisioningService } = await import('./whatsapp/templateProvisioningService');
      logger.info(`Provisioning templates for business ${subDomain} in background`);
      
      return await templateProvisioningService.provisionTemplates(
        subDomain,
        language || 'es_PE'
      );
    });

    // Step 3: Update business with template tracking
    await step.run('update-business', async () => {
      const { Business } = await import('../models/Business');
      
      await Business.updateOne(
        { _id: businessId },
        {
          $set: {
            templatesProvisioned: provisionResult.success,
            templatesProvisionedAt: new Date(),
          },
          $push: {
            whatsappTemplates: {
              $each: provisionResult.results.map((templateResult) => ({
                name: templateResult.templateName,
                templateId: templateResult.templateId,
                status: templateResult.status || 'PENDING',
                createdAt: new Date(),
                approvedAt: templateResult.status === 'APPROVED' ? new Date() : undefined,
                language: language || 'es_PE',
                category: 'UTILITY',
              })),
            },
          },
        }
      );
      
      logger.info(`Template provisioning completed for ${subDomain}`, {
        created: provisionResult.created,
        failed: provisionResult.failed,
      });
      
      return { updated: true };
    });

    return {
      success: true,
      subDomain,
      created: provisionResult.created,
      failed: provisionResult.failed,
    };
  }
);

// ============= WhatsApp Webhook Processing Functions =============

// Function: Process incoming WhatsApp message webhook event
const processWhatsAppMessage = inngest.createFunction(
  {
    id: 'process-whatsapp-message',
    name: 'Process WhatsApp Incoming Message',
    retries: 2,
    concurrency: 10 // Process up to 10 messages concurrently
  },
  { event: 'whatsapp/message.received' },
  async ({ event, step }) => {
    const { businessId, message, metadata, subDomain } = event.data;

    // Step 1: Load business
    const business = await step.run('load-business', async () => {
      const { Business } = await import('../models/Business');
      const biz = await Business.findById(businessId);
      
      if (!biz) {
        throw new Error(`Business ${businessId} not found`);
      }
      
      return {
        _id: biz._id,
        subDomain: biz.subDomain,
        wabaId: biz.wabaId,
        phoneNumberIds: biz.whatsappPhoneNumberIds || []
      };
    });

    // Step 2: Process the message
    await step.run('process-message', async () => {
      const { processIncomingMessage } = await import('./whatsapp/metaWhatsAppWebhookService');
      await processIncomingMessage(
        { subDomain: business.subDomain, _id: business._id },
        message,
        metadata
      );
      
      return { processed: true, messageId: message.id };
    });

    return {
      success: true,
      messageId: message.id,
      subDomain: business.subDomain
    };
  }
);

// Function: Process WhatsApp message status update
const processWhatsAppStatus = inngest.createFunction(
  {
    id: 'process-whatsapp-status',
    name: 'Process WhatsApp Message Status',
    retries: 2,
    concurrency: 20 // Status updates are lighter, can process more concurrently
  },
  { event: 'whatsapp/status.update' },
  async ({ event, step }) => {
    const { businessId, status, subDomain } = event.data;

    // Step 1: Load business
    const business = await step.run('load-business', async () => {
      const { Business } = await import('../models/Business');
      const biz = await Business.findById(businessId);
      
      if (!biz) {
        throw new Error(`Business ${businessId} not found`);
      }
      
      return { 
        _id: biz._id,
        subDomain: biz.subDomain 
      };
    });

    // Step 2: Process the status update
    await step.run('process-status', async () => {
      const { processMessageStatus } = await import('./whatsapp/metaWhatsAppWebhookService');
      await processMessageStatus(
        { subDomain: business.subDomain, _id: business._id },
        status
      );
      
      return { processed: true, messageId: status.id, status: status.status };
    });

    return {
      success: true,
      messageId: status.id,
      status: status.status,
      subDomain: business.subDomain
    };
  }
);

// Function: Process WhatsApp template status update
const processWhatsAppTemplateStatus = inngest.createFunction(
  {
    id: 'process-whatsapp-template-status',
    name: 'Process WhatsApp Template Status',
    retries: 2
  },
  { event: 'whatsapp/template.status.update' },
  async ({ event, step }) => {
    const { businessId, templateStatus, subDomain } = event.data;

    // Step 1: Load business
    const business = await step.run('load-business', async () => {
      const { Business } = await import('../models/Business');
      const biz = await Business.findById(businessId);
      
      if (!biz) {
        throw new Error(`Business ${businessId} not found`);
      }
      
      return { 
        _id: biz._id,
        subDomain: biz.subDomain 
      };
    });

    // Step 2: Process the template status
    await step.run('process-template-status', async () => {
      const { processTemplateStatus } = await import('./whatsapp/metaWhatsAppWebhookService');
      await processTemplateStatus(
        { subDomain: business.subDomain, _id: business._id },
        templateStatus
      );
      
      return { 
        processed: true, 
        templateId: templateStatus.message_template_id,
        event: templateStatus.event
      };
    });

    return {
      success: true,
      templateId: templateStatus.message_template_id,
      event: templateStatus.event,
      subDomain: business.subDomain
    };
  }
);

// Function: Process webhook entry (orchestrator)
// This function processes a webhook entry and dispatches individual events
const processWhatsAppWebhookEntry = inngest.createFunction(
  {
    id: 'process-whatsapp-webhook-entry',
    name: 'Process WhatsApp Webhook Entry',
    retries: 1,
    concurrency: 5 // Process up to 5 entries concurrently
  },
  { event: 'whatsapp/webhook.entry' },
  async ({ event, step }) => {
    const { businessId, entry, subDomain } = event.data;

    // Step 1: Extract business info
    const businessInfo = await step.run('extract-business', async () => {
      const { Business } = await import('../models/Business');
      const business = await Business.findById(businessId);
      
      if (!business) {
        throw new Error(`Business ${businessId} not found`);
      }
      
      return {
        subDomain: business.subDomain,
        wabaId: business.wabaId
      };
    });

    // Step 2: Process all changes in the entry
    const changes = entry.changes || [];
    const dispatchedEvents = [];

    for (const [index, change] of changes.entries()) {
      if (change.field === 'messages') {
        const value = change.value;

        // Dispatch message events
        if (value.messages && Array.isArray(value.messages)) {
          for (const message of value.messages) {
            const messageEvent = await step.run(`dispatch-message-${index}`, async () => {
              await inngest.send({
                name: 'whatsapp/message.received',
                data: {
                  businessId,
                  message,
                  metadata: value.metadata,
                  subDomain: businessInfo.subDomain
                }
              });
              return { dispatched: true, messageId: message.id };
            });
            dispatchedEvents.push(messageEvent);
          }
        }

        // Dispatch status events
        if (value.statuses && Array.isArray(value.statuses)) {
          for (const status of value.statuses) {
            const statusEvent = await step.run(`dispatch-status-${index}`, async () => {
              await inngest.send({
                name: 'whatsapp/status.update',
                data: {
                  businessId,
                  status,
                  subDomain: businessInfo.subDomain
                }
              });
              return { dispatched: true, messageId: status.id };
            });
            dispatchedEvents.push(statusEvent);
          }
        }
      } else if (change.field === 'message_template_status_update') {
        // Dispatch template status event
        const templateEvent = await step.run(`dispatch-template-${index}`, async () => {
          await inngest.send({
            name: 'whatsapp/template.status.update',
            data: {
              businessId,
              templateStatus: change.value,
              subDomain: businessInfo.subDomain
            }
          });
          return { dispatched: true, templateId: change.value?.message_template_id };
        });
        dispatchedEvents.push(templateEvent);
      }
    }

    return {
      success: true,
      entryId: entry.id,
      subDomain: businessInfo.subDomain,
      dispatchedEvents: dispatchedEvents.length,
      changesProcessed: changes.length
    };
  }
);

// Export functions
export const functions = [
  processMenuFromUrl,
  processMenuFromS3,
  batchProcessMenus,
  retryFailedMenu,
  provisionWhatsAppTemplates,
  processWhatsAppMessage,
  processWhatsAppStatus,
  processWhatsAppTemplateStatus,
  processWhatsAppWebhookEntry
];

// Export Inngest serve function for Express integration
export const inngestServe = serve({ 
  client: inngest, 
  functions,
  servePath: '/api/inngest'
});
