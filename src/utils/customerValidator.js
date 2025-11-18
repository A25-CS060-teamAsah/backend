/* eslint-env node */
/**
 * Customer Data Validator
 * Validates customer input data
 */

// Valid values for categorical fields
const VALID_JOBS = [
  'admin.',
  'blue-collar',
  'entrepreneur',
  'housemaid',
  'management',
  'retired',
  'self-employed',
  'services',
  'student',
  'technician',
  'unemployed',
  'unknown',
];

const VALID_MARITAL = ['divorced', 'married', 'single', 'unknown'];

const VALID_EDUCATION = [
  'basic.4y',
  'basic.6y',
  'basic.9y',
  'high.school',
  'illiterate',
  'professional.course',
  'university.degree',
  'unknown',
  'primary',
  'secondary',
  'tertiary',
];

const VALID_CONTACT = ['cellular', 'telephone'];

const VALID_MONTHS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
];

const VALID_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];

const VALID_POUTCOME = ['failure', 'nonexistent', 'success'];

/**
 * Validate customer data
 * @param {Object} data - Customer data to validate
 * @param {boolean} isPartial - If true, allows partial validation (for updates)
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validateCustomerData = (data, isPartial = false) => {
  const errors = [];

  // Name validation
  if (!isPartial || data.name !== undefined) {
    if (!data.name || (typeof data.name === 'string' && data.name.trim() === '')) {
      errors.push('Name is required');
    } else if (typeof data.name !== 'string') {
      errors.push('Name must be a string');
    }
  }

  // Age validation
  if (!isPartial || data.age !== undefined) {
    if (!data.age) {
      errors.push('Age is required');
    } else if (typeof data.age !== 'number' || data.age < 18 || data.age > 100) {
      errors.push('Age must be a number between 18 and 100');
    }
  }

  // Job validation
  if (!isPartial || data.job !== undefined) {
    if (!data.job) {
      errors.push('Job is required');
    } else if (!VALID_JOBS.includes(data.job)) {
      errors.push(`Job must be one of: ${VALID_JOBS.join(', ')}`);
    }
  }

  // Marital validation
  if (!isPartial || data.marital !== undefined) {
    if (!data.marital) {
      errors.push('Marital status is required');
    } else if (!VALID_MARITAL.includes(data.marital)) {
      errors.push(`Marital status must be one of: ${VALID_MARITAL.join(', ')}`);
    }
  }

  // Education validation
  if (!isPartial || data.education !== undefined) {
    if (!data.education) {
      errors.push('Education is required');
    } else if (!VALID_EDUCATION.includes(data.education)) {
      errors.push(`Education must be one of: ${VALID_EDUCATION.join(', ')}`);
    }
  }

  // Contact validation
  if (!isPartial || data.contact !== undefined) {
    if (!data.contact) {
      errors.push('Contact type is required');
    } else if (!VALID_CONTACT.includes(data.contact)) {
      errors.push(`Contact must be one of: ${VALID_CONTACT.join(', ')}`);
    }
  }

  // Month validation
  if (!isPartial || data.month !== undefined) {
    if (!data.month) {
      errors.push('Month is required');
    } else if (!VALID_MONTHS.includes(data.month)) {
      errors.push(`Month must be one of: ${VALID_MONTHS.join(', ')}`);
    }
  }

  // Day of week validation
  if (!isPartial || data.day_of_week !== undefined) {
    if (!data.day_of_week) {
      errors.push('Day of week is required');
    } else if (!VALID_DAYS.includes(data.day_of_week)) {
      errors.push(`Day of week must be one of: ${VALID_DAYS.join(', ')}`);
    }
  }

  // Poutcome validation
  if (data.poutcome !== undefined && data.poutcome !== null) {
    if (!VALID_POUTCOME.includes(data.poutcome)) {
      errors.push(`Previous outcome must be one of: ${VALID_POUTCOME.join(', ')}`);
    }
  }

  // Boolean validations
  if (data.has_default !== undefined && typeof data.has_default !== 'boolean') {
    errors.push('has_default must be a boolean');
  }

  if (data.has_housing_loan !== undefined && typeof data.has_housing_loan !== 'boolean') {
    errors.push('has_housing_loan must be a boolean');
  }

  if (data.has_personal_loan !== undefined && typeof data.has_personal_loan !== 'boolean') {
    errors.push('has_personal_loan must be a boolean');
  }

  // Numeric validations
  if (data.campaign !== undefined) {
    if (typeof data.campaign !== 'number' || data.campaign < 1 || data.campaign > 100) {
      errors.push('Campaign must be a number between 1 and 100');
    }
  }

  if (data.pdays !== undefined) {
    if (typeof data.pdays !== 'number' || data.pdays < 0 || data.pdays > 999) {
      errors.push('Pdays must be a number between 0 and 999');
    }
  }

  if (data.previous !== undefined) {
    if (typeof data.previous !== 'number' || data.previous < 0 || data.previous > 100) {
      errors.push('Previous must be a number between 0 and 100');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Get valid values for each field (for documentation/frontend)
 */
export const getValidValues = () => ({
  jobs: VALID_JOBS,
  marital: VALID_MARITAL,
  education: VALID_EDUCATION,
  contact: VALID_CONTACT,
  months: VALID_MONTHS,
  days: VALID_DAYS,
  poutcome: VALID_POUTCOME,
});
