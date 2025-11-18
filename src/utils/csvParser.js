/**
 * CSV Parser Utility
 * Team A25-CS060
 * 
 * Parses and validates CSV files for customer bulk import
 */

import { parse } from 'csv-parse/sync';
import { validateCustomerData } from './customerValidator.js';

// Required CSV columns
const REQUIRED_COLUMNS = [
  'name',
  'age',
  'job',
  'marital',
  'education',
  'default',
  'housing',
  'loan',
  'contact',
  'month',
  'day_of_week',
  'campaign',
  'pdays',
  'previous',
  'poutcome'
];

/**
 * Parse CSV file buffer
 * @param {Buffer} fileBuffer - CSV file buffer
 * @returns {Array} Parsed records
 */
export const parseCSV = (fileBuffer) => {
  try {
    const records = parse(fileBuffer, {
      columns: true, // Use first row as column names
      skip_empty_lines: true,
      trim: true,
      cast: true, // Auto-cast values
      cast_date: false
    });

    return records;
  } catch (error) {
    throw new Error(`CSV Parse Error: ${error.message}`);
  }
};

/**
 * Validate CSV structure
 * @param {Array} records - Parsed CSV records
 * @returns {Object} Validation result
 */
export const validateCSVStructure = (records) => {
  if (!records || records.length === 0) {
    return {
      isValid: false,
      error: 'CSV file is empty'
    };
  }

  // Check if all required columns exist
  const firstRecord = records[0];
  const csvColumns = Object.keys(firstRecord);
  
  const missingColumns = REQUIRED_COLUMNS.filter(
    col => !csvColumns.includes(col)
  );

  if (missingColumns.length > 0) {
    return {
      isValid: false,
      error: `Missing required columns: ${missingColumns.join(', ')}`
    };
  }

  return {
    isValid: true
  };
};

/**
 * Validate and process CSV records
 * @param {Array} records - Parsed CSV records
 * @returns {Object} Validation result with valid/invalid records
 */
export const validateCSVRecords = (records) => {
  const results = {
    valid: [],
    invalid: [],
    totalRecords: records.length
  };

  records.forEach((record, index) => {
    const rowNumber = index + 2; // +2 because index starts at 0 and row 1 is header

    // Convert string booleans to actual booleans
    const processedRecord = {
      ...record,
      name: record.name,
      default: convertToBoolean(record.default),
      housing: convertToBoolean(record.housing),
      loan: convertToBoolean(record.loan),
      age: parseInt(record.age),
      campaign: parseInt(record.campaign),
      pdays: parseInt(record.pdays),
      previous: parseInt(record.previous)
    };

    // Validate record
    const validation = validateCustomerData(processedRecord);

    if (validation.isValid) {
      results.valid.push({
        data: processedRecord,
        row: rowNumber
      });
    } else {
      results.invalid.push({
        row: rowNumber,
        data: record,
        errors: validation.errors
      });
    }
  });

  return results;
};

/**
 * Convert string to boolean
 * @param {String|Boolean} value - Value to convert
 * @returns {Boolean}
 */
const convertToBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lowerValue = value.toLowerCase().trim();
    if (lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes') return true;
    if (lowerValue === 'false' || lowerValue === '0' || lowerValue === 'no') return false;
  }
  if (typeof value === 'number') {
    return value === 1;
  }
  return false;
};

/**
 * Generate CSV template content
 * @returns {String} CSV template
 */
export const generateCSVTemplate = () => {
  const header = REQUIRED_COLUMNS.join(',');
  const example1 = 'John Doe,30,technician,married,secondary,false,true,false,cellular,may,mon,2,999,0,unknown';
  const example2 = 'Jane Smith,45,management,single,tertiary,false,false,false,telephone,jun,fri,1,999,0,success';
  const example3 = 'Bob Johnson,38,admin.,divorced,secondary,false,true,false,cellular,may,wed,3,999,0,nonexistent';

  return `${header}\n${example1}\n${example2}\n${example3}`;
};

/**
 * Parse and validate CSV file
 * Complete workflow: parse -> validate structure -> validate records
 * @param {Buffer} fileBuffer - CSV file buffer
 * @returns {Object} Complete validation result
 */
export const parseAndValidateCSV = (fileBuffer) => {
  // Step 1: Parse CSV
  const records = parseCSV(fileBuffer);

  // Step 2: Validate structure
  const structureValidation = validateCSVStructure(records);
  if (!structureValidation.isValid) {
    return {
      success: false,
      error: structureValidation.error
    };
  }

  // Step 3: Validate records
  const recordsValidation = validateCSVRecords(records);

  return {
    success: true,
    data: recordsValidation
  };
};
