// Rule Categories
export const RULE_CATEGORIES = [
  { value: 'stp_decision', label: 'STP Decision', description: 'STP Pass/Fail rules' },
  { value: 'case_type', label: 'Case Type', description: 'Case classification rules' },
  { value: 'reason_flag', label: 'Reason Flag', description: 'Reason flag rules' },
  { value: 'scorecard', label: 'Scorecard', description: 'Scorecard methodology rules' },
  { value: 'income_sa_grid', label: 'Income × SA Grid', description: 'Income vs Sum Assured rules' },
  { value: 'bmi_grid', label: 'BMI Grid', description: 'BMI-based rules' },
  { value: 'occupation', label: 'Occupation', description: 'Occupation risk rules' },
  { value: 'agent_channel', label: 'Agent & Channel', description: 'Agent/channel rules' },
  { value: 'address_pincode', label: 'Address/Pincode', description: 'Location-based rules' },
  { value: 'validation', label: 'Validation', description: 'Input validation rules' },
];

// Operators
export const OPERATORS = [
  { value: 'equals', label: 'Equals', symbol: '=' },
  { value: 'not_equals', label: 'Not Equals', symbol: '≠' },
  { value: 'greater_than', label: 'Greater Than', symbol: '>' },
  { value: 'less_than', label: 'Less Than', symbol: '<' },
  { value: 'greater_than_or_equal', label: 'Greater Than or Equal', symbol: '≥' },
  { value: 'less_than_or_equal', label: 'Less Than or Equal', symbol: '≤' },
  { value: 'in', label: 'In List', symbol: '∈' },
  { value: 'not_in', label: 'Not In List', symbol: '∉' },
  { value: 'between', label: 'Between', symbol: '↔' },
  { value: 'contains', label: 'Contains', symbol: '⊃' },
  { value: 'starts_with', label: 'Starts With', symbol: '^' },
  { value: 'is_empty', label: 'Is Empty', symbol: '∅' },
  { value: 'is_not_empty', label: 'Is Not Empty', symbol: '≠∅' },
];

// Logical Operators
export const LOGICAL_OPERATORS = [
  { value: 'AND', label: 'AND', description: 'All conditions must be true' },
  { value: 'OR', label: 'OR', description: 'At least one condition must be true' },
];

// Case Types
export const CASE_TYPES = [
  { value: 0, label: 'Normal Case', description: 'Standard underwriting' },
  { value: 1, label: 'Direct Accept', description: 'Auto-approved' },
  { value: -1, label: 'Direct Fail', description: 'Auto-declined' },
  { value: 3, label: 'GCRP Case', description: 'Referred for review' },
];

// Reason Flags
export const REASON_FLAGS = [
  { value: 1, label: 'STP Fail - Print Reason', description: 'Show reason to user' },
  { value: 0, label: 'STP Pass - Skip Print', description: 'No reason needed' },
  { value: -1, label: 'Not Provided', description: 'Status not set' },
];

// Product Types
export const PRODUCT_TYPES = [
  { value: 'term_life', label: 'Term Life (Parent)', color: 'blue', isParent: true },
  { value: 'term_pure', label: 'Pure Term', color: 'blue', parent: 'term_life' },
  { value: 'term_returns', label: 'Term with Returns', color: 'cyan', parent: 'term_life' },
  { value: 'endowment', label: 'Endowment', color: 'emerald' },
  { value: 'ulip', label: 'ULIP', color: 'purple' },
];

// Available Fields for Conditions
export const AVAILABLE_FIELDS = [
  { value: 'applicant_age', label: 'Applicant Age', type: 'number' },
  { value: 'applicant_gender', label: 'Applicant Gender', type: 'string' },
  { value: 'applicant_income', label: 'Applicant Income', type: 'number' },
  { value: 'sum_assured', label: 'Sum Assured', type: 'number' },
  { value: 'premium', label: 'Premium', type: 'number' },
  { value: 'bmi', label: 'BMI', type: 'number' },
  { value: 'occupation_code', label: 'Occupation Code', type: 'string' },
  { value: 'occupation_risk', label: 'Occupation Risk', type: 'string' },
  { value: 'agent_code', label: 'Agent Code', type: 'string' },
  { value: 'agent_tier', label: 'Agent Tier', type: 'string' },
  { value: 'pincode', label: 'Pincode', type: 'string' },
  { value: 'is_smoker', label: 'Is Smoker', type: 'boolean' },
  { value: 'has_medical_history', label: 'Has Medical History', type: 'boolean' },
  { value: 'existing_coverage', label: 'Existing Coverage', type: 'number' },
  { value: 'product_type', label: 'Product Type', type: 'string' },
  // Conditional fields (dependent on parent questions)
  { value: 'cigarettes_per_day', label: 'Cigarettes per Day', type: 'number', dependsOn: 'is_smoker' },
  { value: 'smoking_years', label: 'Smoking Years', type: 'number', dependsOn: 'is_smoker' },
  { value: 'ailment_type', label: 'Ailment Type', type: 'string', dependsOn: 'has_medical_history' },
  { value: 'ailment_details', label: 'Ailment Details', type: 'string', dependsOn: 'has_medical_history' },
  { value: 'ailment_duration_years', label: 'Ailment Duration (Years)', type: 'number', dependsOn: 'has_medical_history' },
  { value: 'is_ailment_ongoing', label: 'Is Ailment Ongoing', type: 'boolean', dependsOn: 'has_medical_history' },
];

// Grid Types
export const GRID_TYPES = [
  { value: 'bmi', label: 'BMI Grid', description: 'BMI-based risk assessment' },
  { value: 'income_sa', label: 'Income × SA Grid', description: 'Income vs Sum Assured eligibility' },
  { value: 'occupation', label: 'Occupation Grid', description: 'Occupation risk categorization' },
];

// Grid Results
export const GRID_RESULTS = [
  { value: 'ACCEPT', label: 'Accept', color: 'emerald' },
  { value: 'DECLINE', label: 'Decline', color: 'red' },
  { value: 'REFER', label: 'Refer', color: 'amber' },
];

// Priority Levels
export const PRIORITY_LEVELS = [
  { min: 1, max: 25, label: 'Critical', color: 'red' },
  { min: 26, max: 50, label: 'High', color: 'orange' },
  { min: 51, max: 75, label: 'Medium', color: 'amber' },
  { min: 76, max: 100, label: 'Normal', color: 'slate' },
];

// Format helpers
export const formatCurrency = (value) => {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(2)} Cr`;
  } else if (value >= 100000) {
    return `₹${(value / 100000).toFixed(2)} L`;
  } else if (value >= 1000) {
    return `₹${(value / 1000).toFixed(2)} K`;
  }
  return `₹${value}`;
};

export const getCategoryColor = (category) => {
  const colors = {
    stp_decision: 'blue',
    case_type: 'purple',
    validation: 'amber',
    scorecard: 'emerald',
    income_sa_grid: 'cyan',
    bmi_grid: 'rose',
    occupation: 'indigo',
    agent_channel: 'orange',
    address_pincode: 'teal',
    reason_flag: 'slate',
  };
  return colors[category] || 'slate';
};

export const getPriorityLevel = (priority) => {
  return PRIORITY_LEVELS.find(level => priority >= level.min && priority <= level.max) || PRIORITY_LEVELS[3];
};
