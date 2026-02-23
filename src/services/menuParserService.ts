import {
  TextractClient,
  DetectDocumentTextCommand,
  AnalyzeDocumentCommand,
  Block,
  DetectDocumentTextCommandInput,
  AnalyzeDocumentCommandInput
} from '@aws-sdk/client-textract';
import { config } from '../config';
import logger from '../utils/logger';

// ============= Menu Parser Types =============
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

// ============= AWS Textract Provider =============
class AWSTextractProvider {
  private client: TextractClient;
  private useAnalyze: boolean;
  name = 'AWS Textract';

  constructor() {
    if (!config.aws?.textract) {
      throw new Error('AWS Textract configuration not found');
    }

    this.client = new TextractClient({
      region: config.aws.textract.region,
      credentials: config.aws.textract.credentials,
      maxAttempts: config.aws.textract.maxRetries || 3
    });
    this.useAnalyze = config.aws.textract.useAnalyze || false;
  }

  async processImage(imageData: string | Buffer): Promise<OCRResult> {
    const imageBytes = await this.prepareImageBytes(imageData);

    if (this.useAnalyze) {
      return await this.analyzeDocument(imageBytes);
    } else {
      return await this.detectDocumentText(imageBytes);
    }
  }

  private async detectDocumentText(imageBytes: Uint8Array): Promise<OCRResult> {
    const input: DetectDocumentTextCommandInput = {
      Document: { Bytes: imageBytes }
    };

    const command = new DetectDocumentTextCommand(input);
    const response = await this.client.send(command);

    return this.parseTextractResponse(response.Blocks || []);
  }

  private async analyzeDocument(imageBytes: Uint8Array): Promise<OCRResult> {
    const input: AnalyzeDocumentCommandInput = {
      Document: { Bytes: imageBytes },
      FeatureTypes: ['TABLES', 'FORMS']
    };

    const command = new AnalyzeDocumentCommand(input);
    const response = await this.client.send(command);

    return this.parseTextractResponse(response.Blocks || []);
  }

  private parseTextractResponse(blocks: Block[]): OCRResult {
    const lines: OCRLine[] = [];
    const words: OCRResult['words'] = [];
    let fullText = '';
    let totalConfidence = 0;
    let lineCount = 0;

    for (const block of blocks) {
      if (block.BlockType === 'LINE' && block.Text) {
        const geometry = block.Geometry?.BoundingBox;
        if (geometry) {
          lines.push({
            text: block.Text,
            confidence: block.Confidence || 0,
            bbox: {
              x: geometry.Left || 0,
              y: geometry.Top || 0,
              width: geometry.Width || 0,
              height: geometry.Height || 0
            },
            blockType: 'LINE'
          });
          fullText += block.Text + '\n';
          totalConfidence += block.Confidence || 0;
          lineCount++;
        }
      }

      if (block.BlockType === 'WORD' && block.Text) {
        const geometry = block.Geometry?.BoundingBox;
        if (geometry) {
          words.push({
            text: block.Text,
            confidence: block.Confidence || 0,
            bbox: {
              x: geometry.Left || 0,
              y: geometry.Top || 0,
              width: geometry.Width || 0,
              height: geometry.Height || 0
            }
          });
        }
      }
    }

    lines.sort((a, b) => a.bbox.y - b.bbox.y);

    return {
      text: fullText.trim(),
      confidence: lineCount > 0 ? totalConfidence / lineCount : 0,
      lines,
      words
    };
  }

  private async prepareImageBytes(imageData: string | Buffer): Promise<Uint8Array> {
    if (Buffer.isBuffer(imageData)) {
      return new Uint8Array(imageData);
    }

    if (typeof imageData === 'string') {
      if (imageData.startsWith('data:')) {
        const base64 = imageData.split(',')[1];
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      }

      if (this.isBase64(imageData)) {
        const binaryString = atob(imageData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      }

      const response = await fetch(imageData);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    }

    throw new Error('Unsupported image data type');
  }

  private isBase64(str: string): boolean {
    try {
      return btoa(atob(str)) === str;
    } catch {
      return false;
    }
  }

  async processImageFromS3(bucket: string, key: string): Promise<OCRResult> {
    const input: DetectDocumentTextCommandInput = {
      Document: {
        S3Object: { Bucket: bucket, Name: key }
      }
    };

    const command = new DetectDocumentTextCommand(input);
    const response = await this.client.send(command);

    return this.parseTextractResponse(response.Blocks || []);
  }
}

// ============= Menu Parser =============
class MenuParser {
  private readonly pricePatterns = [
    /\$\s*(\d+(?:\.\d{2})?)/g,
    /(\d+(?:\.\d{2})?)\s*USD/gi,
    /€\s*(\d+(?:[.,]\d{2})?)/g,
    /£\s*(\d+(?:\.\d{2})?)/g,
    /Rs\.?\s*(\d+(?:\.\d{2})?)/gi,
    /¥\s*(\d+)/g,
    /(\d+(?:[.,]\d{2})?)\s*(?:dollars?|euros?|pounds?)/gi,
  ];

  private readonly categoryKeywords = [
    'appetizers', 'starters', 'entrees', 'mains', 'main course',
    'desserts', 'beverages', 'drinks', 'sides', 'salads',
    'soups', 'breakfast', 'lunch', 'dinner', 'specials',
    'seafood', 'vegetarian', 'vegan', 'pasta', 'pizza', 'burgers',
    'sandwiches', 'wraps', 'cocktails', 'wine', 'beer', 'coffee'
  ];

  parseMenu(ocrResult: OCRResult): ParsedMenu {
    const startTime = Date.now();
    const items = this.extractMenuItems(ocrResult);
    const sections = this.categorizeItems(items, ocrResult.lines);
    const restaurantName = this.extractRestaurantName(ocrResult.lines);

    const processingTimeMs = Date.now() - startTime;
    const metadata = {
      totalItems: items.length,
      averageConfidence: this.calculateAverageConfidence(items),
      parsedAt: new Date(),
      ocrProvider: 'AWS Textract',
      processingTimeMs
    };

    return {
      restaurantName,
      sections,
      rawText: ocrResult.text,
      metadata
    };
  }

  private extractMenuItems(ocrResult: OCRResult): MenuItem[] {
    const items: MenuItem[] = [];
    const lines = ocrResult.lines;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const text = line.text.trim();

      if (!text || this.isCategoryHeader(text)) continue;

      const priceMatch = this.extractPrice(text);

      if (priceMatch) {
        const nameMatch = text.match(/^(.+?)(?=\$|€|£|Rs|¥|\d+\.\d{2})/);
        const name = nameMatch
          ? nameMatch[1].trim()
          : text.replace(priceMatch.fullMatch, '').trim();

        if (name && name.length > 2 && !this.isNoiseText(name)) {
          const description = this.extractDescription(lines, i + 1);

          items.push({
            name: this.cleanItemName(name),
            description,
            price: priceMatch.amount,
            currency: priceMatch.currency,
            confidence: line.confidence,
            position: {
              x: line.bbox.x,
              y: line.bbox.y,
              width: line.bbox.width,
              height: line.bbox.height
            }
          });
        }
      }
    }

    return items;
  }

  private extractPrice(text: string): { amount: number; currency: string; fullMatch: string } | null {
    for (const pattern of this.pricePatterns) {
      const match = pattern.exec(text);
      pattern.lastIndex = 0;

      if (match) {
        const amount = parseFloat(match[1].replace(',', '.'));
        if (amount < 0.01 || amount > 9999) continue;

        let currency = 'USD';
        if (text.includes('€')) currency = 'EUR';
        else if (text.includes('£')) currency = 'GBP';
        else if (text.includes('Rs')) currency = 'INR';
        else if (text.includes('¥')) currency = 'JPY';

        return { amount, currency, fullMatch: match[0] };
      }
    }
    return null;
  }

  private extractDescription(lines: OCRLine[], startIndex: number): string | undefined {
    if (startIndex >= lines.length) return undefined;
    const nextLine = lines[startIndex].text.trim();

    if (
      nextLine.length > 10 &&
      nextLine.length < 200 &&
      !this.extractPrice(nextLine) &&
      !this.isCategoryHeader(nextLine) &&
      !this.isNoiseText(nextLine)
    ) {
      return nextLine;
    }
    return undefined;
  }

  private isCategoryHeader(text: string): boolean {
    const normalized = text.toLowerCase().trim();
    return this.categoryKeywords.some(keyword =>
      normalized === keyword || normalized.includes(keyword)
    );
  }

  private isNoiseText(text: string): boolean {
    const noise = ['page', 'menu', 'order', 'total', 'tax', 'subtotal'];
    const normalized = text.toLowerCase();
    return noise.some(n => normalized === n);
  }

  private categorizeItems(items: MenuItem[], lines: OCRLine[]): MenuSection[] {
    let currentCategory = 'General';
    const categorizedItems = new Set<MenuItem>();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (this.isCategoryHeader(line.text)) {
        currentCategory = this.normalizeCategory(line.text);
        continue;
      }

      for (const item of items) {
        if (!categorizedItems.has(item) && item.position && line.text.includes(item.name)) {
          item.category = currentCategory;
          categorizedItems.add(item);
        }
      }
    }

    const categoryMap = new Map<string, MenuItem[]>();
    for (const item of items) {
      const category = item.category || 'General';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(item);
    }

    const sections: MenuSection[] = [];
    for (const [category, categoryItems] of categoryMap) {
      categoryItems.sort((a, b) => {
        if (a.position && b.position) {
          return a.position.y - b.position.y;
        }
        return 0;
      });
      sections.push({ category, items: categoryItems });
    }

    return sections;
  }

  private normalizeCategory(text: string): string {
    const normalized = text.toLowerCase().trim();
    for (const keyword of this.categoryKeywords) {
      if (normalized.includes(keyword)) {
        return keyword.charAt(0).toUpperCase() + keyword.slice(1);
      }
    }
    return text.trim();
  }

  private cleanItemName(name: string): string {
    return name
      .replace(/\.{2,}/g, '')
      .replace(/_{2,}/g, '')
      .replace(/\s+/g, ' ')
      .replace(/[*•·]/g, '')
      .trim();
  }

  private extractRestaurantName(lines: OCRLine[]): string | undefined {
    for (const line of lines.slice(0, 5)) {
      const text = line.text.trim();
      if (
        text.length > 5 &&
        text.length < 50 &&
        line.confidence > 80 &&
        !this.extractPrice(text) &&
        !this.isCategoryHeader(text)
      ) {
        return text;
      }
    }
    return undefined;
  }

  private calculateAverageConfidence(items: MenuItem[]): number {
    if (items.length === 0) return 0;
    const sum = items.reduce((acc, item) => acc + item.confidence, 0);
    return Math.round(sum / items.length);
  }
}

// ============= Menu Parser Service =============
export class MenuParserService {
  private textractProvider: AWSTextractProvider;
  private menuParser: MenuParser;

  constructor() {
    this.textractProvider = new AWSTextractProvider();
    this.menuParser = new MenuParser();
  }

  async processImage(imageData: string | Buffer): Promise<OCRResult> {
    try {
      logger.info('Processing image with AWS Textract');
      return await this.textractProvider.processImage(imageData);
    } catch (error) {
      logger.error('Error processing image with Textract:', error);
      throw error;
    }
  }

  async processImageFromS3(bucket: string, key: string): Promise<OCRResult> {
    try {
      logger.info(`Processing image from S3: ${bucket}/${key}`);
      return await this.textractProvider.processImageFromS3(bucket, key);
    } catch (error) {
      logger.error('Error processing image from S3:', error);
      throw error;
    }
  }

  parseMenu(ocrResult: OCRResult): ParsedMenu {
    try {
      logger.info('Parsing menu from OCR result');
      return this.menuParser.parseMenu(ocrResult);
    } catch (error) {
      logger.error('Error parsing menu:', error);
      throw error;
    }
  }

  async parseMenuFromImage(imageSource: string | Buffer): Promise<ParsedMenu> {
    try {
      const ocrResult = await this.processImage(imageSource);
      return this.parseMenu(ocrResult);
    } catch (error) {
      logger.error('Error parsing menu from image:', error);
      throw error;
    }
  }

  async parseMenuFromS3(bucket: string, key: string): Promise<ParsedMenu> {
    try {
      const ocrResult = await this.processImageFromS3(bucket, key);
      return this.parseMenu(ocrResult);
    } catch (error) {
      logger.error('Error parsing menu from S3:', error);
      throw error;
    }
  }
}
