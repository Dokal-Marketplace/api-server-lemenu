import { MetaWhatsAppService } from './metaWhatsAppService';
import logger from '../../utils/logger';

export interface TemplateDefinition {
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  components: Array<{
    type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
    format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
    text?: string;
    buttons?: Array<{
      type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
      text: string;
      url?: string;
      phone_number?: string;
    }>;
  }>;
}

/**
 * Default template definitions for order flow
 * These templates are created automatically when WABA is linked
 */
const DEFAULT_TEMPLATES: TemplateDefinition[] = [
  {
    name: 'welcome_greeting',
    category: 'UTILITY',
    language: 'es_PE',
    components: [
      {
        type: 'BODY',
        text: '¡Hola! Bienvenido a nuestro restaurante. ¿En qué puedo ayudarte hoy? Puedes pedir ver el menú, hacer un pedido, o contactar soporte.',
      },
    ],
  },
  {
    name: 'menu_browsing',
    category: 'UTILITY',
    language: 'es_PE',
    components: [
      {
        type: 'BODY',
        text: 'Aquí tienes nuestro menú. ¿Te interesa algún plato en particular?',
      },
    ],
  },
  {
    name: 'order_initiation',
    category: 'UTILITY',
    language: 'es_PE',
    components: [
      {
        type: 'BODY',
        text: '¡Excelente! Vamos a crear tu pedido. Primero, ¿qué te gustaría ordenar?',
      },
    ],
  },
  {
    name: 'item_added_confirmation',
    category: 'UTILITY',
    language: 'es_PE',
    components: [
      {
        type: 'BODY',
        text: '¡Perfecto! Agregué {{1}} a tu pedido. ¿Quieres agregar algo más o proceder con el pedido?',
      },
    ],
  },
  {
    name: 'order_confirmation_prompt',
    category: 'UTILITY',
    language: 'es_PE',
    components: [
      {
        type: 'BODY',
        text: '¿Quieres confirmar tu pedido o agregar algo más?',
      },
    ],
  },
  {
    name: 'payment_selection',
    category: 'UTILITY',
    language: 'es_PE',
    components: [
      {
        type: 'BODY',
        text: '¡Excelente! Ahora necesito saber cómo quieres pagar. ¿Efectivo, tarjeta, Yape, o Plin?',
      },
    ],
  },
  {
    name: 'address_collection_street',
    category: 'UTILITY',
    language: 'es_PE',
    components: [
      {
        type: 'BODY',
        text: 'Para completar tu pedido, necesito tu dirección de entrega. Por favor, proporciona la siguiente información:\n\n1️⃣ **Calle y número** (ej: Av. Principal 123)',
      },
    ],
  },
  {
    name: 'address_collection_city',
    category: 'UTILITY',
    language: 'es_PE',
    components: [
      {
        type: 'BODY',
        text: '2️⃣ **Ciudad** (ej: Lima, Arequipa, Trujillo)',
      },
    ],
  },
  {
    name: 'address_collection_district',
    category: 'UTILITY',
    language: 'es_PE',
    components: [
      {
        type: 'BODY',
        text: '3️⃣ **Distrito** (ej: Miraflores, San Isidro, Surco)',
      },
    ],
  },
  {
    name: 'address_collection_postal',
    category: 'UTILITY',
    language: 'es_PE',
    components: [
      {
        type: 'BODY',
        text: '4️⃣ **Código postal** (opcional, ej: 15001)',
      },
    ],
  },
  {
    name: 'order_completed',
    category: 'UTILITY',
    language: 'es_PE',
    components: [
      {
        type: 'BODY',
        text: '✅ **Dirección registrada correctamente**\n\n📍 {{1}}\n\n🎉 ¡Pedido confirmado! Tu número de pedido es: **{{2}}**\n\nTe contactaremos pronto para confirmar la entrega. ¡Gracias por elegirnos!',
      },
    ],
  },
  {
    name: 'support_greeting',
    category: 'UTILITY',
    language: 'es_PE',
    components: [
      {
        type: 'BODY',
        text: 'Estoy aquí para ayudarte. ¿Cuál es tu consulta o problema?',
      },
    ],
  },
  {
    name: 'support_completed',
    category: 'UTILITY',
    language: 'es_PE',
    components: [
      {
        type: 'BODY',
        text: '✅ **Solicitud de soporte registrada**\n\n📋 **Asunto:** {{1}}\n👤 **Nombre:** {{2}}\n📞 **Teléfono:** {{3}}\n\nNuestro equipo de soporte se pondrá en contacto contigo pronto. ¡Gracias por tu paciencia!',
      },
    ],
  },
  {
    name: 'error_message',
    category: 'UTILITY',
    language: 'es_PE',
    components: [
      {
        type: 'BODY',
        text: 'Lo siento, hubo un error procesando tu mensaje. ¿Puedes intentar de nuevo?',
      },
    ],
  },
  {
    name: 'order_status_update',
    category: 'UTILITY',
    language: 'es_PE',
    components: [
      {
        type: 'BODY',
        text: '📦 **Actualización de pedido**\n\nTu pedido #{{1}} está ahora: **{{2}}**\n\n{{3}}',
      },
    ],
  },
  {
    name: 'payment_confirmation',
    category: 'UTILITY',
    language: 'es_PE',
    components: [
      {
        type: 'BODY',
        text: '¡Perfecto! Pago con {{1}}. Ahora necesito tu dirección de entrega. ¿Cuál es tu dirección completa?',
      },
    ],
  },
  {
    name: 'add_more_items',
    category: 'UTILITY',
    language: 'es_PE',
    components: [
      {
        type: 'BODY',
        text: '¡Perfecto! ¿Qué más te gustaría agregar a tu pedido?',
      },
    ],
  },
  {
    name: 'invalid_item_selection',
    category: 'UTILITY',
    language: 'es_PE',
    components: [
      {
        type: 'BODY',
        text: 'No pude entender qué quieres ordenar. ¿Puedes ser más específico? Por ejemplo: "Quiero una pizza margarita" o "Agrega una coca cola"',
      },
    ],
  },
  {
    name: 'invalid_payment_method',
    category: 'UTILITY',
    language: 'es_PE',
    components: [
      {
        type: 'BODY',
        text: 'Por favor selecciona un método de pago: Efectivo, Tarjeta, Yape, Plin, Mercado Pago, o Transferencia',
      },
    ],
  },
  {
    name: 'address_incomplete',
    category: 'UTILITY',
    language: 'es_PE',
    components: [
      {
        type: 'BODY',
        text: '❌ La dirección parece incompleta. Por favor, proporciona una dirección válida:\n\n1️⃣ **Calle y número**',
      },
    ],
  },
];

class TemplateProvisioningService {
  /**
   * Provision all default templates for a business
   */
  async provisionTemplates(
    subDomain: string,
    language: string = 'es_PE',
    localId?: string
  ): Promise<{
    success: boolean;
    created: number;
    failed: number;
    results: Array<{
      templateName: string;
      success: boolean;
      templateId?: string;
      status?: string;
      error?: string;
    }>;
  }> {
    const results: Array<{
      templateName: string;
      success: boolean;
      templateId?: string;
      status?: string;
      error?: string;
    }> = [];

    let created = 0;
    let failed = 0;

    logger.info(`Starting template provisioning for business: ${subDomain}`, {
      language,
      templateCount: DEFAULT_TEMPLATES.length,
    });

    for (const templateDef of DEFAULT_TEMPLATES) {
      try {
        // Override language if provided
        const templateData = {
          ...templateDef,
          language,
        };

        const result = await MetaWhatsAppService.createTemplate(
          subDomain,
          templateData,
          localId
        );

        if (result.success) {
          created++;
          logger.info(`Template created: ${templateDef.name}`, {
            templateId: result.templateId,
            status: result.status,
          });
        } else {
          failed++;
          logger.warn(`Template creation failed: ${templateDef.name}`, {
            error: result.error,
          });
        }

        results.push({
          templateName: templateDef.name,
          success: result.success,
          templateId: result.templateId,
          status: result.status,
          error: result.error,
        });

        // Add small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error: any) {
        failed++;
        logger.error(`Error provisioning template ${templateDef.name}:`, error);
        results.push({
          templateName: templateDef.name,
          success: false,
          error: error.message || 'Unknown error',
        });
      }
    }

    logger.info(`Template provisioning completed for ${subDomain}`, {
      created,
      failed,
      total: DEFAULT_TEMPLATES.length,
    });

    return {
      success: failed === 0,
      created,
      failed,
      results,
    };
  }

  /**
   * Check template approval status
   */
  async checkTemplateStatuses(
    subDomain: string,
    localId?: string
  ): Promise<Record<string, string>> {
    const statuses: Record<string, string> = {};

    for (const templateDef of DEFAULT_TEMPLATES) {
      try {
        const status = await MetaWhatsAppService.getTemplateStatus(
          subDomain,
          templateDef.name,
          localId
        );
        statuses[templateDef.name] = status.status || status.error || 'UNKNOWN';
      } catch (error: any) {
        logger.error(`Error checking status for template ${templateDef.name}:`, error);
        statuses[templateDef.name] = 'ERROR';
      }
    }

    return statuses;
  }

  /**
   * Get template name with subDomain prefix
   */
  getTemplateName(subDomain: string, templateName: string): string {
    return `${subDomain.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${templateName}`;
  }
}

export const templateProvisioningService = new TemplateProvisioningService();

