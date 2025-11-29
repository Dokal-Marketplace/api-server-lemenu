import { Product } from '../../models/Product';
import { Presentation } from '../../models/Presentation';
import { Modifier } from '../../models/Modifier';
import { Business } from '../../models/Business';
import logger from '../../utils/logger';
import axios from 'axios';

/**
 * WhatsApp Flow Service
 *
 * Handles WhatsApp Flow integration for product customization and ordering.
 * Supports multi-step flows for size selection, modifiers, and order submission.
 */
export class WhatsAppFlowService {
  /**
   * Get product data formatted for WhatsApp Flow
   * Returns product info, presentations (sizes), and modifiers
   */
  static async getProductFlowData(
    productId: string,
    subDomain: string,
    localId?: string
  ): Promise<{
    success: boolean;
    data?: {
      product: {
        id: string;
        rId: string;
        name: string;
        description?: string;
        imageUrl?: string;
        basePrice: number;
        categoryId: string;
      };
      presentations: Array<{
        id: string;
        rId: string;
        name: string;
        price: number;
        discountedPrice?: number;
        isDefault: boolean;
      }>;
      modifiers: Array<{
        id: string;
        rId: string;
        name: string;
        isMultiple: boolean;
        minQuantity: number;
        maxQuantity: number;
        options: Array<{
          optionId: string;
          name: string;
          price: number;
          isActive: boolean;
        }>;
      }>;
    };
    error?: string;
  }> {
    try {
      // Find product
      const product = await Product.findOne({
        rId: productId,
        subDomain: subDomain.toLowerCase(),
        ...(localId && { localId }),
        isActive: true
      });

      if (!product) {
        return {
          success: false,
          error: 'Product not found'
        };
      }

      // Get presentations (sizes/variants)
      const presentations = await Presentation.find({
        productId: product.rId,
        subDomain: subDomain.toLowerCase(),
        ...(localId && { localId }),
        isActive: true
      }).sort({ position: 1 });

      // Get modifiers
      const modifiers = await Modifier.find({
        rId: { $in: product.modifiers || [] },
        subDomain: subDomain.toLowerCase(),
        isActive: true
      });

      // Format response
      return {
        success: true,
        data: {
          product: {
            id: String(product._id),
            rId: product.rId,
            name: product.name,
            description: product.description,
            imageUrl: product.imageUrl,
            basePrice: product.basePrice || 0,
            categoryId: product.categoryId
          },
          presentations: presentations.map(p => ({
            id: String(p._id),
            rId: p.rId,
            name: p.name,
            price: p.price,
            discountedPrice: p.amountWithDiscount !== p.price ? p.amountWithDiscount : undefined,
            isDefault: (p as any).isDefault || false
          })),
          modifiers: modifiers.map(m => ({
            id: String(m._id),
            rId: m.rId,
            name: m.name,
            isMultiple: m.isMultiple,
            minQuantity: m.minQuantity,
            maxQuantity: m.maxQuantity,
            options: m.options
              .filter(opt => opt.isActive !== false)
              .map(opt => ({
                optionId: opt.optionId,
                name: opt.name,
                price: opt.price,
                isActive: opt.isActive !== false
              }))
          }))
        }
      };
    } catch (error: any) {
      logger.error('Error getting product flow data:', {
        productId,
        subDomain,
        error: error.message
      });
      return {
        success: false,
        error: error.message || 'Failed to get product data'
      };
    }
  }

  /**
   * Calculate total price based on selections
   *
   * @param productId - Product rId
   * @param presentationId - Selected presentation (size) rId
   * @param modifierSelections - Array of selected modifier options with quantities
   * @param quantity - Order quantity
   */
  static async calculatePrice(
    productId: string,
    presentationId: string,
    modifierSelections: Array<{
      modifierId: string;
      optionId: string;
      quantity: number;
    }>,
    quantity: number = 1,
    subDomain: string,
    localId?: string
  ): Promise<{
    success: boolean;
    data?: {
      basePrice: number;
      presentationPrice: number;
      modifiersTotal: number;
      subtotal: number;
      quantity: number;
      total: number;
      breakdown: {
        presentation: {
          name: string;
          price: number;
        };
        modifiers: Array<{
          modifierName: string;
          optionName: string;
          price: number;
          quantity: number;
          total: number;
        }>;
      };
    };
    error?: string;
  }> {
    try {
      // Validate quantity
      if (quantity < 1) {
        return {
          success: false,
          error: 'Quantity must be at least 1'
        };
      }

      // Find product
      const product = await Product.findOne({
        rId: productId,
        subDomain: subDomain.toLowerCase(),
        ...(localId && { localId }),
        isActive: true
      });

      if (!product) {
        return {
          success: false,
          error: 'Product not found'
        };
      }

      // Find presentation
      const presentation = await Presentation.findOne({
        rId: presentationId,
        productId: product.rId,
        subDomain: subDomain.toLowerCase(),
        ...(localId && { localId }),
        isActive: true
      });

      if (!presentation) {
        return {
          success: false,
          error: 'Presentation (size) not found'
        };
      }

      // Calculate presentation price (use discounted if available)
      const presentationPrice = presentation.amountWithDiscount || presentation.price;

      // Calculate modifiers total
      let modifiersTotal = 0;
      const modifierBreakdown: Array<{
        modifierName: string;
        optionName: string;
        price: number;
        quantity: number;
        total: number;
      }> = [];

      if (modifierSelections && modifierSelections.length > 0) {
        // Get all modifiers
        const modifierIds = modifierSelections.map(s => s.modifierId);
        const modifiers = await Modifier.find({
          rId: { $in: modifierIds },
          subDomain: subDomain.toLowerCase(),
          isActive: true
        });

        // Process each selection
        for (const selection of modifierSelections) {
          const modifier = modifiers.find(m => m.rId === selection.modifierId);

          if (!modifier) {
            logger.warn('Modifier not found:', selection.modifierId);
            continue;
          }

          const option = modifier.options.find(opt => opt.optionId === selection.optionId);

          if (!option || option.isActive === false) {
            logger.warn('Modifier option not found or inactive:', selection.optionId);
            continue;
          }

          const optionTotal = option.price * selection.quantity;
          modifiersTotal += optionTotal;

          modifierBreakdown.push({
            modifierName: modifier.name,
            optionName: option.name,
            price: option.price,
            quantity: selection.quantity,
            total: optionTotal
          });
        }
      }

      // Calculate totals
      const subtotal = presentationPrice + modifiersTotal;
      const total = subtotal * quantity;

      return {
        success: true,
        data: {
          basePrice: product.basePrice || 0,
          presentationPrice,
          modifiersTotal,
          subtotal,
          quantity,
          total,
          breakdown: {
            presentation: {
              name: presentation.name,
              price: presentationPrice
            },
            modifiers: modifierBreakdown
          }
        }
      };
    } catch (error: any) {
      logger.error('Error calculating price:', {
        productId,
        presentationId,
        error: error.message
      });
      return {
        success: false,
        error: error.message || 'Failed to calculate price'
      };
    }
  }

  /**
   * Generate WhatsApp Flow JSON template for product customization
   *
   * Returns a WhatsApp Flow JSON that can be sent via Meta API
   */
  static async generateFlowTemplate(
    productId: string,
    subDomain: string,
    localId?: string
  ): Promise<{
    success: boolean;
    flowJson?: any;
    error?: string;
  }> {
    try {
      // Get product flow data
      const result = await this.getProductFlowData(productId, subDomain, localId);

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || 'Failed to get product data'
        };
      }

      const { product, presentations, modifiers } = result.data;

      // Build flow screens
      const screens: any[] = [];

      // Screen 1: Size Selection
      if (presentations.length > 0) {
        screens.push({
          id: 'SIZE_SELECTION',
          title: `Select ${product.name} Size`,
          data: {
            product_name: product.name,
            product_image: product.imageUrl || ''
          },
          layout: {
            type: 'SingleColumnLayout',
            children: [
              {
                type: 'Image',
                src: product.imageUrl || '',
                'aspect-ratio': '1:1'
              },
              {
                type: 'TextHeading',
                text: 'Choose your size'
              },
              {
                type: 'RadioButtonsGroup',
                name: 'selected_presentation',
                'data-source': presentations.map(p => ({
                  id: p.rId,
                  title: p.name,
                  description: p.discountedPrice
                    ? `$${p.discountedPrice.toFixed(2)} (was $${p.price.toFixed(2)})`
                    : `$${p.price.toFixed(2)}`,
                  metadata: {
                    price: p.discountedPrice || p.price
                  }
                })),
                required: true
              },
              {
                type: 'Footer',
                label: 'Next',
                'on-click-action': {
                  name: 'navigate',
                  next: {
                    name: modifiers.length > 0 ? 'MODIFIERS_SELECTION' : 'ORDER_SUMMARY'
                  }
                }
              }
            ]
          }
        });
      }

      // Screen 2: Modifiers Selection (if applicable)
      if (modifiers.length > 0) {
        const modifierGroups = modifiers.map((modifier) => ({
          type: modifier.isMultiple ? 'CheckboxGroup' : 'RadioButtonsGroup',
          name: `modifier_${modifier.rId}`,
          label: modifier.name,
          description: `Select ${modifier.isMultiple ? `${modifier.minQuantity}-${modifier.maxQuantity}` : 'one'}`,
          'data-source': modifier.options.map(opt => ({
            id: opt.optionId,
            title: opt.name,
            description: opt.price > 0 ? `+$${opt.price.toFixed(2)}` : 'Free',
            metadata: {
              price: opt.price
            }
          })),
          required: modifier.minQuantity > 0
        }));

        screens.push({
          id: 'MODIFIERS_SELECTION',
          title: 'Customize Your Order',
          layout: {
            type: 'SingleColumnLayout',
            children: [
              {
                type: 'TextHeading',
                text: 'Add extras & customizations'
              },
              ...modifierGroups,
              {
                type: 'Footer',
                label: 'Next',
                'on-click-action': {
                  name: 'navigate',
                  next: {
                    name: 'ORDER_SUMMARY'
                  }
                }
              }
            ]
          }
        });
      }

      // Screen 3: Order Summary
      screens.push({
        id: 'ORDER_SUMMARY',
        title: 'Review Your Order',
        layout: {
          type: 'SingleColumnLayout',
          children: [
            {
              type: 'TextHeading',
              text: 'Order Summary'
            },
            {
              type: 'TextBody',
              text: '${order_summary}'
            },
            {
              type: 'TextInput',
              name: 'special_instructions',
              label: 'Special instructions (optional)',
              'input-type': 'text',
              required: false
            },
            {
              type: 'TextSubheading',
              text: 'Total: $${calculated_total}'
            },
            {
              type: 'Footer',
              label: 'Place Order',
              'on-click-action': {
                name: 'complete',
                payload: {
                  product_id: product.rId,
                  presentation_id: '${selected_presentation}',
                  modifiers: '${selected_modifiers}',
                  special_instructions: '${special_instructions}',
                  total: '${calculated_total}'
                }
              }
            }
          ]
        }
      });

      // Complete flow structure
      const flowJson = {
        version: '3.0',
        screens,
        data_api_version: '3.0'
      };

      return {
        success: true,
        flowJson
      };
    } catch (error: any) {
      logger.error('Error generating flow template:', {
        productId,
        error: error.message
      });
      return {
        success: false,
        error: error.message || 'Failed to generate flow template'
      };
    }
  }

  /**
   * Validate flow submission data
   * Ensures all required fields are present and valid
   */
  static validateFlowSubmission(data: {
    productId: string;
    presentationId: string;
    modifiers?: Array<{ modifierId: string; optionId: string; quantity: number }>;
    specialInstructions?: string;
    quantity?: number;
  }): { valid: boolean; error?: string } {
    if (!data.productId || typeof data.productId !== 'string') {
      return { valid: false, error: 'Product ID is required' };
    }

    if (!data.presentationId || typeof data.presentationId !== 'string') {
      return { valid: false, error: 'Presentation (size) ID is required' };
    }

    if (data.quantity !== undefined && (typeof data.quantity !== 'number' || data.quantity < 1)) {
      return { valid: false, error: 'Quantity must be a positive number' };
    }

    if (data.modifiers && !Array.isArray(data.modifiers)) {
      return { valid: false, error: 'Modifiers must be an array' };
    }

    return { valid: true };
  }

  /**
   * Deploy WhatsApp Flow to Meta API
   * Creates or updates a flow for a product
   *
   * @param productId - Product rId
   * @param subDomain - Business subdomain
   * @param localId - Optional location ID
   * @param forceUpdate - Force update even if flow exists
   */
  static async deployFlowToMeta(
    productId: string,
    subDomain: string,
    localId?: string,
    forceUpdate: boolean = false
  ): Promise<{
    success: boolean;
    flowId?: string;
    action?: 'created' | 'updated' | 'skipped';
    error?: string;
  }> {
    try {
      // Get business with WhatsApp credentials
      const business = await Business.findOne({ subDomain: subDomain.toLowerCase() });

      if (!business) {
        return { success: false, error: 'Business not found' };
      }

      if (!business.whatsappAccessToken || !business.fbBusinessId) {
        return {
          success: false,
          error: 'Business not configured for WhatsApp (missing access token or business ID)'
        };
      }

      // Check if catalog sync is enabled
      if (business.catalogSyncEnabled === false) {
        logger.debug('Catalog sync disabled for business, skipping flow deployment', { subDomain });
        return { success: true, action: 'skipped' };
      }

      // Get product to check if it needs a flow
      const product = await Product.findOne({
        rId: productId,
        subDomain: subDomain.toLowerCase(),
        ...(localId && { localId }),
        isActive: true
      });

      if (!product) {
        return { success: false, error: 'Product not found or inactive' };
      }

      // Check if product needs a flow (has presentations or modifiers)
      const presentations = await Presentation.find({
        productId: product.rId,
        subDomain: subDomain.toLowerCase(),
        isActive: true
      });

      const needsFlow = presentations.length > 1 || (product.modifiers && product.modifiers.length > 0);

      if (!needsFlow) {
        logger.debug('Product does not need a flow', { productId });
        return { success: true, action: 'skipped' };
      }

      // Check if flow already exists
      const existingFlowId = business.fbFlowMapping
        ? (business.fbFlowMapping as any)[productId]
        : null;

      if (existingFlowId && !forceUpdate) {
        logger.debug('Flow already exists for product', { productId, flowId: existingFlowId });
        return { success: true, flowId: existingFlowId, action: 'skipped' };
      }

      // Generate flow template
      const templateResult = await this.generateFlowTemplate(productId, subDomain, localId);

      if (!templateResult.success || !templateResult.flowJson) {
        return {
          success: false,
          error: templateResult.error || 'Failed to generate flow template'
        };
      }

      // Prepare flow data for Meta API
      const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
      const flowName = `${product.name} - Customization Flow`;
      const endpointUri = `${apiBaseUrl}/api/v1/whatsapp/flow/submit-order/${subDomain}/${localId || ''}`;

      logger.info('Deploying flow to Meta', {
        productId,
        flowName,
        existingFlowId,
        action: existingFlowId ? 'update' : 'create'
      });

      let flowId: string;
      let action: 'created' | 'updated';

      if (existingFlowId) {
        // Update existing flow
        const updateResponse = await axios.post(
          `https://graph.facebook.com/v18.0/${existingFlowId}`,
          {
            name: flowName,
            categories: ['PRODUCT_CATALOG'],
            endpoint_uri: endpointUri,
            ...templateResult.flowJson
          },
          {
            headers: {
              'Authorization': `Bearer ${business.whatsappAccessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        flowId = existingFlowId;
        action = 'updated';

        logger.info('Flow updated in Meta', {
          flowId,
          productId,
          responseStatus: updateResponse.status
        });
      } else {
        // Create new flow
        const createResponse = await axios.post(
          `https://graph.facebook.com/v18.0/${business.fbBusinessId}/flows`,
          {
            name: flowName,
            categories: ['PRODUCT_CATALOG'],
            endpoint_uri: endpointUri,
            ...templateResult.flowJson
          },
          {
            headers: {
              'Authorization': `Bearer ${business.whatsappAccessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        flowId = createResponse.data.id;
        action = 'created';

        logger.info('Flow created in Meta', {
          flowId,
          productId,
          responseStatus: createResponse.status
        });

        // Store flow mapping in business
        if (!business.fbFlowMapping) {
          business.fbFlowMapping = {} as any;
        }

        const mapping = business.fbFlowMapping as any;
        mapping[productId] = flowId;
        business.fbFlowMapping = mapping;

        await business.save();

        logger.info('Flow mapping stored in business', {
          productId,
          flowId
        });
      }

      return {
        success: true,
        flowId,
        action
      };
    } catch (error: any) {
      logger.error('Failed to deploy flow to Meta:', {
        productId,
        error: error.message,
        response: error.response?.data
      });
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message || 'Failed to deploy flow'
      };
    }
  }

  /**
   * Get flow ID for a product
   * Returns the deployed flow ID if it exists
   */
  static async getFlowIdForProduct(
    productId: string,
    subDomain: string
  ): Promise<string | null> {
    try {
      const business = await Business.findOne({ subDomain: subDomain.toLowerCase() });

      if (!business || !business.fbFlowMapping) {
        return null;
      }

      const mapping = business.fbFlowMapping as any;
      return mapping[productId] || null;
    } catch (error: any) {
      logger.error('Failed to get flow ID for product:', {
        productId,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Delete flow from Meta API
   * Removes deployed flow for a product
   */
  static async deleteFlowFromMeta(
    productId: string,
    subDomain: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const business = await Business.findOne({ subDomain: subDomain.toLowerCase() });

      if (!business) {
        return { success: false, error: 'Business not found' };
      }

      if (!business.whatsappAccessToken) {
        return { success: false, error: 'Business not configured for WhatsApp' };
      }

      const flowId = await this.getFlowIdForProduct(productId, subDomain);

      if (!flowId) {
        logger.debug('No flow found for product', { productId });
        return { success: true };
      }

      // Delete flow via Meta API
      await axios.delete(
        `https://graph.facebook.com/v18.0/${flowId}`,
        {
          headers: {
            'Authorization': `Bearer ${business.whatsappAccessToken}`
          }
        }
      );

      // Remove from mapping
      if (business.fbFlowMapping) {
        const mapping = business.fbFlowMapping as any;
        delete mapping[productId];
        business.fbFlowMapping = mapping;
        await business.save();
      }

      logger.info('Flow deleted from Meta', { productId, flowId });

      return { success: true };
    } catch (error: any) {
      logger.error('Failed to delete flow from Meta:', {
        productId,
        error: error.message,
        response: error.response?.data
      });
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message || 'Failed to delete flow'
      };
    }
  }

  /**
   * Batch deploy flows for all products in a category
   * Useful for initial deployment or bulk updates
   */
  static async deployFlowsForCategory(
    categoryId: string,
    subDomain: string,
    localId?: string
  ): Promise<{
    success: boolean;
    deployed: number;
    updated: number;
    skipped: number;
    failed: number;
    errors: Array<{ productId: string; error: string }>;
  }> {
    let deployed = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    const errors: Array<{ productId: string; error: string }> = [];

    try {
      // Get all active products in category
      const products = await Product.find({
        categoryId,
        subDomain: subDomain.toLowerCase(),
        ...(localId && { localId }),
        isActive: true
      });

      logger.info('Deploying flows for category', {
        categoryId,
        productCount: products.length
      });

      // Deploy flow for each product
      for (const product of products) {
        try {
          const result = await this.deployFlowToMeta(
            product.rId,
            subDomain,
            localId,
            false // Don't force update
          );

          if (result.success) {
            if (result.action === 'created') {
              deployed++;
            } else if (result.action === 'updated') {
              updated++;
            } else if (result.action === 'skipped') {
              skipped++;
            }
          } else {
            failed++;
            errors.push({
              productId: product.rId,
              error: result.error || 'Unknown error'
            });
          }

          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error: any) {
          failed++;
          errors.push({
            productId: product.rId,
            error: error.message
          });
        }
      }

      logger.info('Category flow deployment complete', {
        categoryId,
        deployed,
        updated,
        skipped,
        failed
      });

      return {
        success: failed === 0,
        deployed,
        updated,
        skipped,
        failed,
        errors
      };
    } catch (error: any) {
      logger.error('Failed to deploy flows for category:', {
        categoryId,
        error: error.message
      });
      return {
        success: false,
        deployed,
        updated,
        skipped,
        failed,
        errors: [{
          productId: categoryId,
          error: error.message
        }]
      };
    }
  }
}
