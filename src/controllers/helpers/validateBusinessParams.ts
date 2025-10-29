/**
 * Validates business parameters (subDomain and localId)
 * @param subDomain - Business subdomain
 * @param localId - Business location ID
 * @returns Validation result with error details if invalid
 */
export interface ValidationResult {
  valid: boolean;
  error?: {
    type: string;
    message: string;
    data: null;
  };
}

export function validateBusinessParams(subDomain: string, localId: string): ValidationResult {
  // Check if required parameters are provided
  if (!subDomain || !localId) {
    return {
      valid: false,
      error: {
        type: "701",
        message: "subDomain and localId are required",
        data: null
      }
    };
  }

  // Validate subdomain format
  const subDomainRegex = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
  if (!subDomainRegex.test(subDomain)) {
    return {
      valid: false,
      error: {
        type: "701",
        message: "Invalid subDomain format",
        data: null
      }
    };
  }

  return { valid: true };
}

/**
 * Validates that request body is provided and not empty
 * @param body - Request body object
 * @returns Validation result with error details if invalid
 */
export function validateRequestBody(body: any): ValidationResult {
  if (!body || Object.keys(body).length === 0) {
    return {
      valid: false,
      error: {
        type: "701",
        message: "Request body is required",
        data: null
      }
    };
  }

  return { valid: true };
}
