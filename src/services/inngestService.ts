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

// Export functions
export const functions = [
  processMenuFromUrl,
  processMenuFromS3,
  batchProcessMenus,
  retryFailedMenu
];

// Export Inngest serve function for Express integration
export const inngestServe = serve({ 
  client: inngest, 
  functions,
  servePath: '/api/inngest'
});
