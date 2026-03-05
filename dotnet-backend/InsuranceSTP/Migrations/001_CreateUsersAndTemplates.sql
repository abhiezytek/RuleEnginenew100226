-- =====================================================
-- Migration Script for Users and Rule Templates Tables
-- Run this script against your SQLite database
-- =====================================================

-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_login TEXT
);

-- Create index on username and email
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create Rule Templates Table
CREATE TABLE IF NOT EXISTS rule_templates (
    id TEXT PRIMARY KEY,
    template_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'stp_decision',
    condition_group TEXT NOT NULL DEFAULT '{}',
    action TEXT NOT NULL DEFAULT '{}',
    letter_flag TEXT,
    follow_up_code TEXT,
    priority INTEGER NOT NULL DEFAULT 100,
    products TEXT NOT NULL DEFAULT '[]',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
);

-- Create index on template_id
CREATE INDEX IF NOT EXISTS idx_rule_templates_template_id ON rule_templates(template_id);

-- =====================================================
-- Insert Default Admin User (password: admin123)
-- Password hash is SHA256 of 'admin123$InsuranceSTP$Salt$2024'
-- =====================================================
INSERT OR IGNORE INTO users (id, username, email, password_hash, full_name, role, is_active, created_at, updated_at)
VALUES (
    'default-admin-001',
    'admin',
    'admin@ruleengine.com',
    'c7NxV8Y0cqhyqT8ZxKqDxg7l6WvYBjqF9mN3pR5sT1w=',
    'System Administrator',
    'admin',
    1,
    datetime('now'),
    datetime('now')
);

-- =====================================================
-- Insert STP Rule Templates
-- =====================================================

-- STP001 - Gender Check
INSERT OR IGNORE INTO rule_templates (id, template_id, name, description, category, condition_group, action, letter_flag, follow_up_code, priority, products, is_active, created_at)
VALUES (
    'tpl-stp001',
    'STP001',
    'Gender Check - Transgender',
    'STP001: Gender must be Male or Female. Transgender cases require RUW.',
    'stp_decision',
    '{"logical_operator":"AND","conditions":[{"logical_operator":"OR","conditions":[{"field":"applicant_gender","operator":"not_equals","value":"M"},{"field":"applicant_gender","operator":"not_equals","value":"F"}],"is_negated":false}],"is_negated":true}',
    '{"decision":"FAIL","reason_code":"TGQ","reason_message":"Transgender - RUW required","is_hard_stop":false}',
    'O',
    'TGQ',
    10,
    '["term_life","term_pure","term_returns","endowment","ulip"]',
    1,
    datetime('now')
);

-- STP003 - Annual Income Zero
INSERT OR IGNORE INTO rule_templates (id, template_id, name, description, category, condition_group, action, letter_flag, priority, products, is_active, created_at)
VALUES (
    'tpl-stp003',
    'STP003',
    'Annual Income Zero for Earning Life',
    'STP003: Annual income cannot be 0 for earning life (non-student, non-housewife)',
    'stp_decision',
    '{"logical_operator":"AND","conditions":[{"logical_operator":"AND","conditions":[{"field":"occupation_code","operator":"not_equals","value":"student"},{"field":"occupation_code","operator":"not_equals","value":"housewife"}],"is_negated":false},{"field":"applicant_income","operator":"equals","value":0}],"is_negated":false}',
    '{"decision":"FAIL","reason_code":"INC001","reason_message":"Annual income 0 for earning life - RUW required","is_hard_stop":false}',
    'O',
    15,
    '["term_life","term_pure","term_returns","endowment","ulip"]',
    1,
    datetime('now')
);

-- STP004 - Adventurous Activities
INSERT OR IGNORE INTO rule_templates (id, template_id, name, description, category, condition_group, action, letter_flag, priority, products, is_active, created_at)
VALUES (
    'tpl-stp004',
    'STP004',
    'Adventurous Activities Check',
    'STP004: Applicants engaged in adventurous activities require RUW',
    'stp_decision',
    '{"logical_operator":"AND","conditions":[{"field":"is_adventurous","operator":"equals","value":true}],"is_negated":false}',
    '{"decision":"FAIL","reason_code":"AVO001","reason_message":"Avocation engagement - RUW required","is_hard_stop":false}',
    'O',
    20,
    '["term_life","term_pure","term_returns"]',
    1,
    datetime('now')
);

-- STP005A - High BMI
INSERT OR IGNORE INTO rule_templates (id, template_id, name, description, category, condition_group, action, letter_flag, follow_up_code, priority, products, is_active, created_at)
VALUES (
    'tpl-stp005a',
    'STP005A',
    'Life Product - High BMI Check',
    'STP005A: Life Product with BMI > 30 and Age >= 12 requires Physical MER',
    'stp_decision',
    '{"logical_operator":"AND","conditions":[{"field":"product_type","operator":"in","value":["term_life","term_pure","term_returns"]},{"field":"bmi","operator":"greater_than","value":30},{"field":"applicant_age","operator":"greater_than_or_equal","value":12}],"is_negated":false}',
    '{"decision":"FAIL","reason_code":"MPN","reason_message":"High BMI (>30) - Physical MER required","is_hard_stop":false}',
    'L',
    'MPN',
    25,
    '["term_life","term_pure","term_returns"]',
    1,
    datetime('now')
);

-- STP005C - Low BMI
INSERT OR IGNORE INTO rule_templates (id, template_id, name, description, category, condition_group, action, letter_flag, follow_up_code, priority, products, is_active, created_at)
VALUES (
    'tpl-stp005c',
    'STP005C',
    'Life Product - Low BMI Check',
    'STP005C: Life Product with BMI < 18 and Age >= 12 requires Physical MER',
    'stp_decision',
    '{"logical_operator":"AND","conditions":[{"field":"product_type","operator":"in","value":["term_life","term_pure","term_returns"]},{"field":"bmi","operator":"less_than","value":18},{"field":"applicant_age","operator":"greater_than_or_equal","value":12}],"is_negated":false}',
    '{"decision":"FAIL","reason_code":"MPN","reason_message":"Low BMI (<18) - Physical MER required","is_hard_stop":false}',
    'L',
    'MPN',
    25,
    '["term_life","term_pure","term_returns"]',
    1,
    datetime('now')
);

-- STP008E - Narcotics
INSERT OR IGNORE INTO rule_templates (id, template_id, name, description, category, condition_group, action, letter_flag, priority, products, is_active, created_at)
VALUES (
    'tpl-stp008e',
    'STP008E',
    'Narcotics/Drugs Consumption',
    'STP008E: Narcotics/Drugs consumption requires RUW',
    'stp_decision',
    '{"logical_operator":"AND","conditions":[{"field":"is_narcotic","operator":"equals","value":true}],"is_negated":false}',
    '{"decision":"FAIL","reason_code":"NAR001","reason_message":"Narcotics/Drugs consumption - RUW required","is_hard_stop":true}',
    'O',
    5,
    '["term_life","term_pure","term_returns","endowment","ulip"]',
    1,
    datetime('now')
);

-- STP009 - Health History
INSERT OR IGNORE INTO rule_templates (id, template_id, name, description, category, condition_group, action, letter_flag, priority, products, is_active, created_at)
VALUES (
    'tpl-stp009',
    'STP009',
    'Negative Health History',
    'STP009: Any positive health question response requires RUW',
    'stp_decision',
    '{"logical_operator":"AND","conditions":[{"field":"has_medical_history","operator":"equals","value":true}],"is_negated":false}',
    '{"decision":"FAIL","reason_code":"HLT001","reason_message":"Negative health history - RUW required","is_hard_stop":false}',
    'O',
    40,
    '["term_life","term_pure","term_returns","endowment","ulip"]',
    1,
    datetime('now')
);

-- STP018N - Age > 55
INSERT OR IGNORE INTO rule_templates (id, template_id, name, description, category, condition_group, action, letter_flag, priority, products, is_active, created_at)
VALUES (
    'tpl-stp018n',
    'STP018N',
    'Age Above 55',
    'STP018N: Age > 55 requires RUW',
    'stp_decision',
    '{"logical_operator":"AND","conditions":[{"field":"applicant_age","operator":"greater_than","value":55}],"is_negated":false}',
    '{"decision":"FAIL","reason_code":"AGE002","reason_message":"Age > 55 - RUW required","is_hard_stop":false}',
    'O',
    61,
    '["term_life","term_pure","term_returns"]',
    1,
    datetime('now')
);

-- STP019E - High AML
INSERT OR IGNORE INTO rule_templates (id, template_id, name, description, category, condition_group, action, letter_flag, priority, products, is_active, created_at)
VALUES (
    'tpl-stp019e',
    'STP019E',
    'High AML Category',
    'STP019E: High AML category requires RUW',
    'stp_decision',
    '{"logical_operator":"AND","conditions":[{"field":"aml_category","operator":"equals","value":"high"}],"is_negated":false}',
    '{"decision":"FAIL","reason_code":"AML001","reason_message":"AML high category - RUW required","is_hard_stop":true}',
    'O',
    3,
    '["term_life","term_pure","term_returns","endowment","ulip"]',
    1,
    datetime('now')
);

-- STP031A - Criminal Records
INSERT OR IGNORE INTO rule_templates (id, template_id, name, description, category, condition_group, action, letter_flag, priority, products, is_active, created_at)
VALUES (
    'tpl-stp031a',
    'STP031A',
    'Criminal Records Check',
    'STP031A: Criminally convicted applicants require RUW',
    'stp_decision',
    '{"logical_operator":"AND","conditions":[{"field":"is_criminally_convicted","operator":"equals","value":true}],"is_negated":false}',
    '{"decision":"FAIL","reason_code":"CRM001","reason_message":"Criminal records - RUW required","is_hard_stop":true}',
    'O',
    2,
    '["term_life","term_pure","term_returns","endowment","ulip"]',
    1,
    datetime('now')
);

-- STP031C - OFAC/Sanctions
INSERT OR IGNORE INTO rule_templates (id, template_id, name, description, category, condition_group, action, letter_flag, priority, products, is_active, created_at)
VALUES (
    'tpl-stp031c',
    'STP031C',
    'OFAC/Sanctions List Check',
    'STP031C: Applicants on OFAC/sanctions list require RUW',
    'stp_decision',
    '{"logical_operator":"AND","conditions":[{"field":"is_ofac","operator":"equals","value":true}],"is_negated":false}',
    '{"decision":"FAIL","reason_code":"OFAC001","reason_message":"Part of sanctions list - RUW required","is_hard_stop":true}',
    'O',
    1,
    '["term_life","term_pure","term_returns","endowment","ulip"]',
    1,
    datetime('now')
);

-- Verify tables created
SELECT 'Users table created with ' || COUNT(*) || ' records' FROM users;
SELECT 'Rule Templates table created with ' || COUNT(*) || ' records' FROM rule_templates;
