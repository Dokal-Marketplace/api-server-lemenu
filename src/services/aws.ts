import {
    TextractClient,
    DetectDocumentTextCommand,
    AnalyzeDocumentCommand,
    Block,
    DetectDocumentTextCommandInput,
    AnalyzeDocumentCommandInput
  } from '@aws-sdk/client-textract';
  
  // Types
  interface MenuItem {
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
  
  interface MenuSection {
    category: string;
    items: MenuItem[];
  }
  
  interface ParsedMenu {
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
  
  interface OCRLine {
    text: string;
    confidence: number;
    bbox: { x: number; y: number; width: number; height: number };
    blockType?: string;
  }
  
  interface OCRResult {
    text: string;
    confidence: number;
    lines: OCRLine[];
    words?: Array<{
      text: string;
      confidence: number;
      bbox: { x: number; y: number; width: number; height: number };
    }>;
  }
  
  // AWS Textract Configuration
  interface TextractConfig {
    region: string;
    credentials: {
      accessKeyId: string;
      secretAccessKey: string;
    };
    maxRetries?: number;
    useAnalyze?: boolean; // Use AnalyzeDocument for better structure detection
  }
  
  // AWS Textract OCR Provider
  class AWSTextractProvider {
    private client: TextractClient;
    private useAnalyze: boolean;
    name = 'AWS Textract';
  
    constructor(config: TextractConfig) {
      this.client = new TextractClient({
        region: config.region,
        credentials: config.credentials,
        maxAttempts: config.maxRetries || 3
      });
      this.useAnalyze = config.useAnalyze || false;
    }
  
    /**
     * Process image with AWS Textract
     */
    async processImage(imageData: string | Buffer | File): Promise<OCRResult> {
      const imageBytes = await this.prepareImageBytes(imageData);
  
      if (this.useAnalyze) {
        return await this.analyzeDocument(imageBytes);
      } else {
        return await this.detectDocumentText(imageBytes);
      }
    }
  
    /**
     * Detect document text (faster, basic OCR)
     */
    private async detectDocumentText(imageBytes: Uint8Array): Promise<OCRResult> {
      const input: DetectDocumentTextCommandInput = {
        Document: {
          Bytes: imageBytes
        }
      };
  
      const command = new DetectDocumentTextCommand(input);
      const response = await this.client.send(command);
  
      return this.parseTextractResponse(response.Blocks || []);
    }
  
    /**
     * Analyze document (slower, better structure detection)
     */
    private async analyzeDocument(imageBytes: Uint8Array): Promise<OCRResult> {
      const input: AnalyzeDocumentCommandInput = {
        Document: {
          Bytes: imageBytes
        },
        FeatureTypes: ['TABLES', 'FORMS'] // Detect tables and key-value pairs
      };
  
      const command = new AnalyzeDocumentCommand(input);
      const response = await this.client.send(command);
  
      return this.parseTextractResponse(response.Blocks || []);
    }
  
    /**
     * Parse Textract response blocks
     */
    private parseTextractResponse(blocks: Block[]): OCRResult {
      const lines: OCRLine[] = [];
      const words: OCRResult['words'] = [];
      let fullText = '';
      let totalConfidence = 0;
      let lineCount = 0;
  
      for (const block of blocks) {
        // Process LINE blocks
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
  
        // Process WORD blocks for granular data
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
  
      // Sort lines by vertical position (top to bottom)
      lines.sort((a, b) => a.bbox.y - b.bbox.y);
  
      return {
        text: fullText.trim(),
        confidence: lineCount > 0 ? totalConfidence / lineCount : 0,
        lines,
        words
      };
    }
  
    /**
     * Prepare image bytes from various input types
     */
    private async prepareImageBytes(
      imageData: string | Buffer | File
    ): Promise<Uint8Array> {
      // Handle Buffer
      if (Buffer.isBuffer(imageData)) {
        return new Uint8Array(imageData);
      }
  
      // Handle File (browser)
      if (imageData instanceof File) {
        const arrayBuffer = await imageData.arrayBuffer();
        return new Uint8Array(arrayBuffer);
      }
  
      // Handle URL or base64 string
      if (typeof imageData === 'string') {
        // Base64 data URL
        if (imageData.startsWith('data:')) {
          const base64 = imageData.split(',')[1];
          const binaryString = atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          return bytes;
        }
  
        // Plain base64
        if (this.isBase64(imageData)) {
          const binaryString = atob(imageData);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          return bytes;
        }
  
        // URL - fetch the image
        const response = await fetch(imageData);
        if (!response.ok) {
          throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        return new Uint8Array(arrayBuffer);
      }
  
      throw new Error('Unsupported image data type');
    }
  
    /**
     * Check if string is base64
     */
    private isBase64(str: string): boolean {
      try {
        return btoa(atob(str)) === str;
      } catch {
        return false;
      }
    }
  
    /**
     * Process image from S3 bucket (alternative method)
     */
    async processImageFromS3(bucket: string, key: string): Promise<OCRResult> {
      const input: DetectDocumentTextCommandInput = {
        Document: {
          S3Object: {
            Bucket: bucket,
            Name: key
          }
        }
      };
  
      const command = new DetectDocumentTextCommand(input);
      const response = await this.client.send(command);
  
      return this.parseTextractResponse(response.Blocks || []);
    }
  }
  
  // Menu Parser Class
  class MenuParser {
    private textractProvider: AWSTextractProvider;
  
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
  
    constructor(textractConfig: TextractConfig) {
      this.textractProvider = new AWSTextractProvider(textractConfig);
    }
  
    /**
     * Parse menu from image using AWS Textract
     */
    async parseMenuFromImage(
      imageSource: string | File | Buffer
    ): Promise<ParsedMenu> {
      const startTime = Date.now();
  
      try {
        // Step 1: Perform OCR using AWS Textract
        const ocrResult = await this.textractProvider.processImage(imageSource);
  
        // Step 2: Extract menu items
        const items = this.extractMenuItems(ocrResult);
  
        // Step 3: Categorize items
        const sections = this.categorizeItems(items, ocrResult.lines);
  
        // Step 4: Extract restaurant name
        const restaurantName = this.extractRestaurantName(ocrResult.lines);
  
        // Step 5: Calculate metadata
        const processingTimeMs = Date.now() - startTime;
        const metadata = {
          totalItems: items.length,
          averageConfidence: this.calculateAverageConfidence(items),
          parsedAt: new Date(),
          ocrProvider: this.textractProvider.name,
          processingTimeMs
        };
  
        return {
          restaurantName,
          sections,
          rawText: ocrResult.text,
          metadata
        };
      } catch (error) {
        console.error('Error parsing menu:', error);
        throw new Error(`Menu parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  
    /**
     * Parse menu from S3 bucket
     */
    async parseMenuFromS3(bucket: string, key: string): Promise<ParsedMenu> {
      const startTime = Date.now();
  
      try {
        const ocrResult = await this.textractProvider.processImageFromS3(bucket, key);
        const items = this.extractMenuItems(ocrResult);
        const sections = this.categorizeItems(items, ocrResult.lines);
        const restaurantName = this.extractRestaurantName(ocrResult.lines);
  
        const processingTimeMs = Date.now() - startTime;
        const metadata = {
          totalItems: items.length,
          averageConfidence: this.calculateAverageConfidence(items),
          parsedAt: new Date(),
          ocrProvider: this.textractProvider.name,
          processingTimeMs
        };
  
        return {
          restaurantName,
          sections,
          rawText: ocrResult.text,
          metadata
        };
      } catch (error) {
        console.error('Error parsing menu from S3:', error);
        throw new Error(`Menu parsing from S3 failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
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
  
    private extractPrice(text: string): {
      amount: number;
      currency: string;
      fullMatch: string;
    } | null {
      for (const pattern of this.pricePatterns) {
        const match = pattern.exec(text);
        pattern.lastIndex = 0;
  
        if (match) {
          const amount = parseFloat(match[1].replace(',', '.'));
          
          // Validate price is reasonable (between $0.01 and $9999)
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
        nextLine.length < 200 && // Reasonable description length
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
  
      // First pass: assign categories based on spatial proximity to headers
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
  
        if (this.isCategoryHeader(line.text)) {
          currentCategory = this.normalizeCategory(line.text);
          continue;
        }
  
        for (const item of items) {
          if (
            !categorizedItems.has(item) &&
            item.position &&
            line.text.includes(item.name)
          ) {
            item.category = currentCategory;
            categorizedItems.add(item);
          }
        }
      }
  
      // Group items by category
      const categoryMap = new Map<string, MenuItem[]>();
  
      for (const item of items) {
        const category = item.category || 'General';
        if (!categoryMap.has(category)) {
          categoryMap.set(category, []);
        }
        categoryMap.get(category)!.push(item);
      }
  
      // Convert to sections array and sort items by position
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
        .replace(/[*•·]/g, '') // Remove bullet points
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
  
    exportToJSON(menu: ParsedMenu): string {
      return JSON.stringify(menu, null, 2);
    }
  
    exportToCSV(menu: ParsedMenu): string {
      let csv = 'Category,Item Name,Description,Price,Currency,Confidence\n';
  
      for (const section of menu.sections) {
        for (const item of section.items) {
          const row = [
            section.category,
            `"${item.name.replace(/"/g, '""')}"`,
            `"${(item.description || '').replace(/"/g, '""')}"`,
            item.price,
            item.currency,
            Math.round(item.confidence)
          ].join(',');
          csv += row + '\n';
        }
      }
  
      return csv;
    }
  }
  
  // Export
  export {
    MenuParser,
    AWSTextractProvider,
    MenuItem,
    MenuSection,
    ParsedMenu,
    OCRResult,
    TextractConfig
  };