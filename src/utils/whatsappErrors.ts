/**
 * Custom error class for WhatsApp API responses
 * Supports the { type, message, data } response format
 */
export class WhatsAppAPIError extends Error {
  status: number;
  type: '1' | '3';
  data: any;
  cause?: any;

  constructor(
    message: string,
    status: number = 500,
    type: '1' | '3' = '3',
    data: any = null
  ) {
    super(message);
    this.name = 'WhatsAppAPIError';
    this.status = status;
    this.type = type;
    this.data = data;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WhatsAppAPIError);
    }
  }
}

/**
 * Helper to create a validation error (400)
 */
export const createValidationError = (message: string): WhatsAppAPIError => {
  return new WhatsAppAPIError(message, 400, '3', null);
};

/**
 * Helper to create a not found error (404)
 */
export const createNotFoundError = (message: string): WhatsAppAPIError => {
  return new WhatsAppAPIError(message, 404, '3', null);
};

/**
 * Helper to create a server error (500)
 */
export const createServerError = (message: string, originalError?: any): WhatsAppAPIError => {
  const error = new WhatsAppAPIError(message, 500, '3', null);
  if (originalError) {
    error.cause = originalError;
  }
  return error;
};

