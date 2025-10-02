/**
 * Phone number utility functions for Canadian phone numbers
 * Handles normalization, validation, and formatting
 */

/**
 * Normalize phone number to 10 digits (storage format)
 * Removes all non-digit characters and takes the last 10 digits
 * @param input - Raw phone number input
 * @returns Normalized 10-digit phone number
 * @example normalizePhone("(514) 123-4567") // "5141234567"
 * @example normalizePhone("+1 514-123-4567") // "5141234567"
 */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  return digits.slice(-10);
}

/**
 * Validate if a phone number is valid (10 digits)
 * @param phone - Phone number to validate
 * @returns true if valid, false otherwise
 */
export function isValidPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return normalized.length === 10 && /^\d{10}$/.test(normalized);
}

/**
 * Format phone number for display
 * @param phone - 10-digit normalized phone number
 * @returns Formatted phone number (514) 123-4567
 * @example formatPhoneDisplay("5141234567") // "(514) 123-4567"
 */
export function formatPhoneDisplay(phone: string): string {
  if (!phone || phone.length !== 10) {
    return phone;
  }
  return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
}

/**
 * Format phone number for Twilio API calls
 * @param phone - 10-digit normalized phone number
 * @returns Formatted phone number with +1 prefix
 * @example formatPhoneTwilio("5141234567") // "+15141234567"
 */
export function formatPhoneTwilio(phone: string): string {
  if (!phone || phone.length !== 10) {
    return phone;
  }
  return `+1${phone}`;
}

/**
 * Format phone number for href tel: link
 * @param phone - 10-digit normalized phone number
 * @returns Formatted phone number for tel: link
 * @example formatPhoneLink("5141234567") // "tel:+15141234567"
 */
export function formatPhoneLink(phone: string): string {
  return `tel:${formatPhoneTwilio(phone)}`;
}

/**
 * Parse and normalize phone input (helper for forms)
 * @param input - User input from form
 * @returns Normalized phone or empty string if invalid
 */
export function parsePhoneInput(input: string): string {
  const normalized = normalizePhone(input);
  return isValidPhone(normalized) ? normalized : "";
}
