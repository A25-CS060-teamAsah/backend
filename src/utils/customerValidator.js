/* eslint-env node */
/**
 * Customer Data Validator
 * Validates customer input data
 */

// Valid values for categorical fields
const VALID_JOBS = [
  "admin.",
  "blue-collar",
  "entrepreneur",
  "housemaid",
  "management",
  "retired",
  "self-employed",
  "services",
  "student",
  "technician",
  "unemployed",
  "unknown",
];

const VALID_MARITAL = ["divorced", "married", "single", "unknown"];

const VALID_EDUCATION = [
  "basic.4y",
  "basic.6y",
  "basic.9y",
  "high.school",
  "illiterate",
  "professional.course",
  "university.degree",
  "unknown",
  "primary",
  "secondary",
  "tertiary",
];

// Include "unknown" to stay compatible with legacy/imported data
const VALID_CONTACT = ["cellular", "telephone", "unknown"];

const VALID_MONTHS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

const VALID_DAYS = ["mon", "tue", "wed", "thu", "fri"];

const VALID_POUTCOME = ["failure", "nonexistent", "success", "unknown"];

/**
 * Validate customer data
 * @param {Object} data - Customer data to validate
 * @param {boolean} isPartial - If true, allows partial validation (for updates)
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validateCustomerData = (data, isPartial = false) => {
  const errors = [];

  // Normalize empty strings to undefined for partial updates
  // so missing fields don't trigger "is required" errors when not provided.
  const normalizeEmpty = (val) =>
    isPartial && (val === "" || val === null) ? undefined : val;

  const normalizedData = {
    ...data,
    name: normalizeEmpty(data.name),
    job: normalizeEmpty(data.job),
    marital: normalizeEmpty(data.marital),
    education: normalizeEmpty(data.education),
    contact: normalizeEmpty(data.contact),
    month: normalizeEmpty(data.month),
    day_of_week: normalizeEmpty(data.day_of_week),
    poutcome: normalizeEmpty(data.poutcome),
  };

  // Use normalized data for validation
  const d = normalizedData;

  // Name validation
  if (!isPartial) {
    // For create: name is required
    if (!d.name || (typeof d.name === "string" && d.name.trim() === "")) {
      errors.push("Name is required");
    } else if (typeof d.name !== "string") {
      errors.push("Name must be a string");
    }
  } else if (d.name !== undefined) {
    // For update: only validate if provided
    if (d.name === "" || (typeof d.name === "string" && d.name.trim() === "")) {
      errors.push("Name cannot be empty");
    } else if (typeof d.name !== "string") {
      errors.push("Name must be a string");
    }
  }

  // Age validation
  if (!isPartial) {
    // For create: age is required
    if (!d.age) {
      errors.push("Age is required");
    } else if (typeof d.age !== "number" || d.age < 18 || d.age > 100) {
      errors.push("Age must be a number between 18 and 100");
    }
  } else if (d.age !== undefined) {
    // For update: only validate if provided
    if (typeof d.age !== "number" || d.age < 18 || d.age > 100) {
      errors.push("Age must be a number between 18 and 100");
    }
  }

  // Job validation
  if (!isPartial) {
    if (!d.job) {
      errors.push("Job is required");
    } else if (!VALID_JOBS.includes(d.job)) {
      errors.push(`Job must be one of: ${VALID_JOBS.join(", ")}`);
    }
  } else if (d.job !== undefined) {
    if (!VALID_JOBS.includes(d.job)) {
      errors.push(`Job must be one of: ${VALID_JOBS.join(", ")}`);
    }
  }

  // Marital validation
  if (!isPartial) {
    if (!d.marital) {
      errors.push("Marital status is required");
    } else if (!VALID_MARITAL.includes(d.marital)) {
      errors.push(`Marital status must be one of: ${VALID_MARITAL.join(", ")}`);
    }
  } else if (d.marital !== undefined) {
    if (!VALID_MARITAL.includes(d.marital)) {
      errors.push(`Marital status must be one of: ${VALID_MARITAL.join(", ")}`);
    }
  }

  // Education validation
  if (!isPartial) {
    if (!d.education) {
      errors.push("Education is required");
    } else if (!VALID_EDUCATION.includes(d.education)) {
      errors.push(`Education must be one of: ${VALID_EDUCATION.join(", ")}`);
    }
  } else if (d.education !== undefined) {
    if (!VALID_EDUCATION.includes(d.education)) {
      errors.push(`Education must be one of: ${VALID_EDUCATION.join(", ")}`);
    }
  }

  // Contact validation
  if (!isPartial) {
    if (!d.contact) {
      errors.push("Contact type is required");
    } else if (!VALID_CONTACT.includes(d.contact)) {
      errors.push(`Contact must be one of: ${VALID_CONTACT.join(", ")}`);
    }
  } else if (d.contact !== undefined) {
    if (!VALID_CONTACT.includes(d.contact)) {
      errors.push(`Contact must be one of: ${VALID_CONTACT.join(", ")}`);
    }
  }

  // Month validation
  if (!isPartial) {
    if (!d.month) {
      errors.push("Month is required");
    } else if (!VALID_MONTHS.includes(d.month)) {
      errors.push(`Month must be one of: ${VALID_MONTHS.join(", ")}`);
    }
  } else if (d.month !== undefined) {
    if (!VALID_MONTHS.includes(d.month)) {
      errors.push(`Month must be one of: ${VALID_MONTHS.join(", ")}`);
    }
  }

  // Day of week validation
  if (!isPartial) {
    if (!d.day_of_week) {
      errors.push("Day of week is required");
    } else if (!VALID_DAYS.includes(d.day_of_week)) {
      errors.push(`Day of week must be one of: ${VALID_DAYS.join(", ")}`);
    }
  } else if (d.day_of_week !== undefined) {
    if (!VALID_DAYS.includes(d.day_of_week)) {
      errors.push(`Day of week must be one of: ${VALID_DAYS.join(", ")}`);
    }
  }

  // Poutcome validation
  if (d.poutcome !== undefined && d.poutcome !== null) {
    if (!VALID_POUTCOME.includes(d.poutcome)) {
      errors.push(
        `Previous outcome must be one of: ${VALID_POUTCOME.join(", ")}`
      );
    }
  }

  // Boolean validations - Support both CSV format (default/housing/loan) and API format (has_default/has_housing_loan/has_personal_loan)
  const defaultValue =
    data.default !== undefined ? data.default : data.has_default;
  const housingValue =
    data.housing !== undefined ? data.housing : data.has_housing_loan;
  const loanValue =
    data.loan !== undefined ? data.loan : data.has_personal_loan;

  if (!isPartial || defaultValue !== undefined) {
    if (defaultValue !== undefined && typeof defaultValue !== "boolean") {
      errors.push("default must be a boolean");
    }
  }

  if (!isPartial || housingValue !== undefined) {
    if (housingValue !== undefined && typeof housingValue !== "boolean") {
      errors.push("housing must be a boolean");
    }
  }

  if (!isPartial || loanValue !== undefined) {
    if (loanValue !== undefined && typeof loanValue !== "boolean") {
      errors.push("loan must be a boolean");
    }
  }

  // Legacy field name validations (for API compatibility)
  if (data.has_default !== undefined && typeof data.has_default !== "boolean") {
    errors.push("has_default must be a boolean");
  }

  if (
    data.has_housing_loan !== undefined &&
    typeof data.has_housing_loan !== "boolean"
  ) {
    errors.push("has_housing_loan must be a boolean");
  }

  if (
    data.has_personal_loan !== undefined &&
    typeof data.has_personal_loan !== "boolean"
  ) {
    errors.push("has_personal_loan must be a boolean");
  }

  // Numeric validations
  if (data.campaign !== undefined) {
    if (
      typeof data.campaign !== "number" ||
      data.campaign < 1 ||
      data.campaign > 100
    ) {
      errors.push("Campaign must be a number between 1 and 100");
    }
  }

  if (data.pdays !== undefined) {
    if (typeof data.pdays !== "number" || data.pdays < 0 || data.pdays > 999) {
      errors.push("Pdays must be a number between 0 and 999");
    }
  }

  if (data.previous !== undefined) {
    if (
      typeof data.previous !== "number" ||
      data.previous < 0 ||
      data.previous > 100
    ) {
      errors.push("Previous must be a number between 0 and 100");
    }
  }

  // Balance validation (optional field)
  if (data.balance !== undefined && data.balance !== null && data.balance !== "") {
    // Allow both number and string that can be converted to number
    const balanceNum = typeof data.balance === "number" ? data.balance : Number(data.balance);
    if (isNaN(balanceNum)) {
      errors.push("Balance must be a valid number");
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
