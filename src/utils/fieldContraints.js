/**
 * Field Day Flex Data Constraints
 * 
 * This file defines the length constraints for various data fields
 * used throughout the application to ensure data consistency and
 * proper UI display.
 */

// Project constraints
export const PROJECT_CONSTRAINTS = {
    NAME_MIN_LENGTH: 3,
    NAME_MAX_LENGTH: 50,
  };
  
  // User constraints
  export const USER_CONSTRAINTS = {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 50,
    EMAIL_MAX_LENGTH: 100,
    PASSWORD_MIN_LENGTH: 8, // Already enforced in validation
    PASSWORD_MAX_LENGTH: 64,
  };
  
  // Tab constraints
  export const TAB_CONSTRAINTS = {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 40,
  };
  
  // Column constraints
  export const COLUMN_CONSTRAINTS = {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 30,
    ENTRY_OPTION_MAX_LENGTH: 50, // For multiple choice options
  };
  
  // Entry data constraints
  export const ENTRY_CONSTRAINTS = {
    TEXT_MAX_LENGTH: 255,
    INTEGER_MAX_VALUE: 999999999, // 9 digits
    INTEGER_MIN_VALUE: -999999999,
    DECIMAL_MAX_DIGITS: 12, // Total digits including decimal places
    DECIMAL_MAX_PRECISION: 6, // Digits after decimal point
  };
  
  /**
   * Validates text against maximum length constraint
   * @param {string} text - The text to validate 
   * @param {number} maxLength - Maximum allowed length
   * @returns {boolean} - Whether the text meets the constraint
   */
  export const validateMaxLength = (text, maxLength) => {
    if (!text) return true;
    return text.length <= maxLength;
  };
  
  /**
   * Validates text against minimum length constraint
   * @param {string} text - The text to validate 
   * @param {number} minLength - Minimum allowed length
   * @returns {boolean} - Whether the text meets the constraint
   */
  export const validateMinLength = (text, minLength) => {
    if (!text) return false;
    return text.length >= minLength;
  };
  
  /**
   * Returns a truncated version of the text if it exceeds maxLength
   * @param {string} text - The text to truncate
   * @param {number} maxLength - Maximum allowed length
   * @returns {string} - Truncated text
   */
  export const truncateText = (text, maxLength) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength);
  };
  
  /**
   * Get validation error message based on constraints
   * @param {string} fieldName - The name of the field being validated
   * @param {string} text - The text being validated
   * @param {number} minLength - Minimum allowed length
   * @param {number} maxLength - Maximum allowed length
   * @returns {string|null} - Error message or null if valid
   */
  export const getValidationError = (fieldName, text, minLength, maxLength) => {
    if (!text || text.trim() === '') {
      return `${fieldName} cannot be empty`;
    }
    
    if (text.length < minLength) {
      return `${fieldName} must be at least ${minLength} characters`;
    }
    
    if (text.length > maxLength) {
      return `${fieldName} cannot exceed ${maxLength} characters`;
    }
    
    return null;
  };