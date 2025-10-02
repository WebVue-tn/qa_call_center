/**
 * Canadian postal code utility functions
 * Handles validation and normalization of Canadian postal codes
 */

/**
 * Validate if a string is a valid Canadian postal code
 * Format: A1A 1A1 or A1A1A1 (case insensitive)
 * @param code - Postal code to validate
 * @returns true if valid Canadian postal code, false otherwise
 */
export function isValidPostalCode(code: string): boolean {
  if (!code) return false;
  const regex = /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i;
  return regex.test(code.trim());
}

/**
 * Normalize postal code to standard format (A1A 1A1)
 * @param code - Raw postal code input
 * @returns Normalized postal code in format "A1A 1A1"
 * @example normalizePostalCode("h3a1b2") // "H3A 1B2"
 * @example normalizePostalCode("H3A 1B2") // "H3A 1B2"
 * @example normalizePostalCode("h3a  1b2") // "H3A 1B2"
 */
export function normalizePostalCode(code: string): string {
  if (!code) return code;

  // Remove all spaces and convert to uppercase
  const clean = code.replace(/\s/g, "").toUpperCase();

  // Validate length
  if (clean.length !== 6) {
    return code; // Return original if invalid length
  }

  // Format as A1A 1A1
  return `${clean.slice(0, 3)} ${clean.slice(3)}`;
}

/**
 * Parse and normalize postal code input (helper for forms)
 * @param input - User input from form
 * @returns Normalized postal code or empty string if invalid
 */
export function parsePostalCodeInput(input: string): string {
  if (!input) return "";

  const normalized = normalizePostalCode(input);
  return isValidPostalCode(normalized) ? normalized : "";
}

/**
 * Extract Forward Sortation Area (FSA) from postal code
 * FSA is the first 3 characters (e.g., "H3A" from "H3A 1B2")
 * @param code - Postal code
 * @returns FSA (first 3 characters)
 */
export function getFSA(code: string): string {
  const normalized = normalizePostalCode(code);
  return normalized.slice(0, 3);
}

/**
 * Extract Local Delivery Unit (LDU) from postal code
 * LDU is the last 3 characters (e.g., "1B2" from "H3A 1B2")
 * @param code - Postal code
 * @returns LDU (last 3 characters)
 */
export function getLDU(code: string): string {
  const normalized = normalizePostalCode(code);
  return normalized.slice(4);
}

/**
 * Format postal code for display (same as normalize)
 * @param code - Postal code
 * @returns Formatted postal code
 */
export function formatPostalCodeDisplay(code: string): string {
  return normalizePostalCode(code);
}
