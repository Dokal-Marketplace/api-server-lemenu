import { Product, IProduct } from '../../models/Product';
import { Presentation, IPresentation } from '../../models/Presentation';
import { Modifier, IModifier, IModifierOption } from '../../models/Modifier';
import { Business } from '../../models/Business';
import logger from '../../utils/logger';

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
            id: product._id.toString(),
            rId: product.rId,
            name: product.name,
            description: product.description,
            imageUrl: product.imageUrl,
            basePrice: product.basePrice || 0,
            categoryId: product.categoryId
          },
          presentations: presentations.map(p => ({
            id: p._id.toString(),
            rId: p.rId,
            name: p.name,
            price: p.price,
            discountedPrice: p.amountWithDiscount !== p.price ? p.amountWithDiscount : undefined,
            isDefault: p.isDefault || false
          })),
          modifiers: modifiers.map(m => ({
            id: m._id.toString(),
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
        const modifierGroups = modifiers.map((modifier, index) => ({
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
}
