import { Inngest } from 'inngest';
import { serve } from 'inngest/express';
import logger from '../utils/logger';

// ============= Inngest Client =============
export const inngest = new Inngest({
  id: 'lemenu-api-server',
  name: 'LeMenu API Server'
});

// ============= WhatsApp Functions =============

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
    const { businessId, message, metadata } = event.data;

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
    const { businessId, status } = event.data;

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
    const { businessId, templateStatus } = event.data;

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
    const { businessId, entry } = event.data;

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
