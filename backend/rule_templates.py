"""STP Rule Templates based on the document specification"""

# Rule templates from the STP Rule Engine document
STP_RULE_TEMPLATES = [
    # STP001 - Gender
    {
        "template_id": "STP001",
        "name": "Gender Check - Transgender",
        "description": "STP001: Gender must be Male or Female. Transgender cases require RUW.",
        "category": "stp_decision",
        "condition_group": {
            "logical_operator": "AND",
            "conditions": [
                {
                    "logical_operator": "OR",
                    "conditions": [
                        {"field": "applicant_gender", "operator": "not_equals", "value": "M"},
                        {"field": "applicant_gender", "operator": "not_equals", "value": "F"}
                    ],
                    "is_negated": False
                }
            ],
            "is_negated": True
        },
        "action": {
            "decision": "FAIL",
            "reason_code": "TGQ",
            "reason_message": "Transgender - RUW required",
            "is_hard_stop": False
        },
        "letter_flag": "O",
        "follow_up_code": "TGQ",
        "priority": 10,
        "products": ["term_life", "term_pure", "term_returns", "endowment", "ulip"]
    },
    
    # STP003 - Annual Income
    {
        "template_id": "STP003",
        "name": "Annual Income Zero for Earning Life",
        "description": "STP003: Annual income cannot be 0 for earning life (non-student, non-housewife)",
        "category": "stp_decision",
        "condition_group": {
            "logical_operator": "AND",
            "conditions": [
                {
                    "logical_operator": "AND",
                    "conditions": [
                        {"field": "occupation_code", "operator": "not_equals", "value": "student"},
                        {"field": "occupation_code", "operator": "not_equals", "value": "housewife"}
                    ],
                    "is_negated": False
                },
                {"field": "applicant_income", "operator": "equals", "value": 0}
            ],
            "is_negated": False
        },
        "action": {
            "decision": "FAIL",
            "reason_code": "INC001",
            "reason_message": "Annual income 0 for earning life - RUW required",
            "is_hard_stop": False
        },
        "letter_flag": "O",
        "priority": 15,
        "products": ["term_life", "term_pure", "term_returns", "endowment", "ulip"]
    },
    
    # STP004 - Avocation
    {
        "template_id": "STP004",
        "name": "Adventurous Activities Check",
        "description": "STP004: Applicants engaged in adventurous activities require RUW",
        "category": "stp_decision",
        "condition_group": {
            "logical_operator": "AND",
            "conditions": [
                {"field": "is_adventurous", "operator": "equals", "value": True}
            ],
            "is_negated": False
        },
        "action": {
            "decision": "FAIL",
            "reason_code": "AVO001",
            "reason_message": "Avocation engagement - RUW required",
            "is_hard_stop": False
        },
        "letter_flag": "O",
        "priority": 20,
        "products": ["term_life", "term_pure", "term_returns"]
    },
    
    # STP005A - Build (Life Product BMI > 30)
    {
        "template_id": "STP005A",
        "name": "Life Product - High BMI Check",
        "description": "STP005A: Life Product with BMI > 30 and Age >= 12 requires Physical MER",
        "category": "stp_decision",
        "condition_group": {
            "logical_operator": "AND",
            "conditions": [
                {"field": "product_type", "operator": "in", "value": ["term_life", "term_pure", "term_returns"]},
                {"field": "bmi", "operator": "greater_than", "value": 30},
                {"field": "applicant_age", "operator": "greater_than_or_equal", "value": 12}
            ],
            "is_negated": False
        },
        "action": {
            "decision": "FAIL",
            "reason_code": "MPN",
            "reason_message": "High BMI (>30) - Physical MER required",
            "is_hard_stop": False
        },
        "letter_flag": "L",
        "follow_up_code": "MPN",
        "priority": 25,
        "products": ["term_life", "term_pure", "term_returns"]
    },
    
    # STP005B - Build (Health Product BMI > 29)
    {
        "template_id": "STP005B",
        "name": "Health Product - High BMI Check",
        "description": "STP005B: Health Product with BMI > 29 and Age >= 12 requires Physical MER",
        "category": "stp_decision",
        "condition_group": {
            "logical_operator": "AND",
            "conditions": [
                {"field": "product_type", "operator": "equals", "value": "health"},
                {"field": "bmi", "operator": "greater_than", "value": 29},
                {"field": "applicant_age", "operator": "greater_than_or_equal", "value": 12}
            ],
            "is_negated": False
        },
        "action": {
            "decision": "FAIL",
            "reason_code": "MPN",
            "reason_message": "High BMI (>29) for Health - Physical MER required",
            "is_hard_stop": False
        },
        "letter_flag": "L",
        "follow_up_code": "MPN",
        "priority": 25,
        "products": []
    },
    
    # STP005C - Build (Life Product Low BMI < 18)
    {
        "template_id": "STP005C",
        "name": "Life Product - Low BMI Check",
        "description": "STP005C: Life Product with BMI < 18 and Age >= 12 requires Physical MER",
        "category": "stp_decision",
        "condition_group": {
            "logical_operator": "AND",
            "conditions": [
                {"field": "product_type", "operator": "in", "value": ["term_life", "term_pure", "term_returns"]},
                {"field": "bmi", "operator": "less_than", "value": 18},
                {"field": "applicant_age", "operator": "greater_than_or_equal", "value": 12}
            ],
            "is_negated": False
        },
        "action": {
            "decision": "FAIL",
            "reason_code": "MPN",
            "reason_message": "Low BMI (<18) - Physical MER required",
            "is_hard_stop": False
        },
        "letter_flag": "L",
        "follow_up_code": "MPN",
        "priority": 25,
        "products": ["term_life", "term_pure", "term_returns"]
    },
    
    # STP005G - Height Check (Short Stature)
    {
        "template_id": "STP005G",
        "name": "Short Stature Check",
        "description": "STP005G: Height < 146 cm at adult age (>18) requires RUW",
        "category": "stp_decision",
        "condition_group": {
            "logical_operator": "AND",
            "conditions": [
                {"field": "height_cm", "operator": "less_than", "value": 146},
                {"field": "applicant_age", "operator": "greater_than", "value": 18}
            ],
            "is_negated": False
        },
        "action": {
            "decision": "FAIL",
            "reason_code": "HT001",
            "reason_message": "Height < 146 cm at adult age - RUW required",
            "is_hard_stop": False
        },
        "letter_flag": "O",
        "priority": 26,
        "products": ["term_life", "term_pure", "term_returns", "endowment", "ulip"]
    },
    
    # STP005H - Height Check (Tall Stature)
    {
        "template_id": "STP005H",
        "name": "Tall Stature Check",
        "description": "STP005H: Height > 190 cm requires RUW",
        "category": "stp_decision",
        "condition_group": {
            "logical_operator": "AND",
            "conditions": [
                {"field": "height_cm", "operator": "greater_than", "value": 190}
            ],
            "is_negated": False
        },
        "action": {
            "decision": "FAIL",
            "reason_code": "HT002",
            "reason_message": "Height > 190 cm - RUW required",
            "is_hard_stop": False
        },
        "letter_flag": "O",
        "priority": 26,
        "products": ["term_life", "term_pure", "term_returns", "endowment", "ulip"]
    },
    
    # STP006 - Education
    {
        "template_id": "STP006",
        "name": "Education Below SSC for Adult",
        "description": "STP006: Age > 18 with education below SSC requires RUW",
        "category": "stp_decision",
        "condition_group": {
            "logical_operator": "AND",
            "conditions": [
                {"field": "applicant_age", "operator": "greater_than", "value": 18},
                {"field": "education_code", "operator": "in", "value": ["Q05", "Q06", "below_ssc"]}
            ],
            "is_negated": False
        },
        "action": {
            "decision": "FAIL",
            "reason_code": "EDU001",
            "reason_message": "Age >18 & education below SSC - RUW required",
            "is_hard_stop": False
        },
        "letter_flag": "O",
        "priority": 30,
        "products": ["term_life", "term_pure", "term_returns", "endowment", "ulip"]
    },
    
    # STP008A - Habits (Smoker - Physical/Amex Mode)
    {
        "template_id": "STP008A",
        "name": "Smoker Questionnaire - Physical/Amex",
        "description": "STP008A: Smoker in Physical/Amex mode requires Smoker Questionnaire",
        "category": "stp_decision",
        "condition_group": {
            "logical_operator": "AND",
            "conditions": [
                {"field": "mode", "operator": "in", "value": ["physical", "amex"]},
                {"field": "is_smoker", "operator": "equals", "value": True}
            ],
            "is_negated": False
        },
        "action": {
            "decision": "FAIL",
            "reason_code": "QSQ",
            "reason_message": "Smoker - Smoker's Questionnaire required",
            "is_hard_stop": False
        },
        "letter_flag": "L",
        "follow_up_code": "QSQ",
        "priority": 35,
        "products": ["term_life", "term_pure", "term_returns", "endowment"]
    },
    
    # STP008C - Tobacco Consumption Beyond Limits
    {
        "template_id": "STP008C",
        "name": "High Tobacco Consumption",
        "description": "STP008C: Tobacco quantity > 10 requires RUW",
        "category": "stp_decision",
        "condition_group": {
            "logical_operator": "AND",
            "conditions": [
                {"field": "is_smoker", "operator": "equals", "value": True},
                {"field": "cigarettes_per_day", "operator": "greater_than", "value": 10}
            ],
            "is_negated": False
        },
        "action": {
            "decision": "FAIL",
            "reason_code": "TOB001",
            "reason_message": "Tobacco consumption beyond STP limits - RUW required",
            "is_hard_stop": False
        },
        "letter_flag": "O",
        "priority": 36,
        "products": ["term_life", "term_pure", "term_returns"]
    },
    
    # STP008E - Narcotics/Drugs
    {
        "template_id": "STP008E",
        "name": "Narcotics/Drugs Consumption",
        "description": "STP008E: Narcotics/Drugs consumption requires RUW",
        "category": "stp_decision",
        "condition_group": {
            "logical_operator": "AND",
            "conditions": [
                {"field": "is_narcotic", "operator": "equals", "value": True}
            ],
            "is_negated": False
        },
        "action": {
            "decision": "FAIL",
            "reason_code": "NAR001",
            "reason_message": "Narcotics/Drugs consumption - RUW required",
            "is_hard_stop": True
        },
        "letter_flag": "O",
        "priority": 5,
        "products": ["term_life", "term_pure", "term_returns", "endowment", "ulip"]
    },
    
    # STP009 - Health History
    {
        "template_id": "STP009",
        "name": "Negative Health History",
        "description": "STP009: Any positive health question response requires RUW",
        "category": "stp_decision",
        "condition_group": {
            "logical_operator": "AND",
            "conditions": [
                {"field": "has_medical_history", "operator": "equals", "value": True}
            ],
            "is_negated": False
        },
        "action": {
            "decision": "FAIL",
            "reason_code": "HLT001",
            "reason_message": "Negative health history - RUW required",
            "is_hard_stop": False
        },
        "letter_flag": "O",
        "priority": 40,
        "products": ["term_life", "term_pure", "term_returns", "endowment", "ulip"]
    },
    
    # STP013 - Loss/Gain of Weight
    {
        "template_id": "STP013",
        "name": "Weight Change Check",
        "description": "STP013: Significant weight change requires Physical MER",
        "category": "stp_decision",
        "condition_group": {
            "logical_operator": "AND",
            "conditions": [
                {"field": "has_weight_changed", "operator": "equals", "value": True}
            ],
            "is_negated": False
        },
        "action": {
            "decision": "FAIL",
            "reason_code": "MPN",
            "reason_message": "Weight change detected - Physical MER required",
            "is_hard_stop": False
        },
        "letter_flag": "O",
        "follow_up_code": "MPN",
        "priority": 42,
        "products": ["term_life", "term_pure", "term_returns", "endowment"]
    },
    
    # STP014 - Nominee Relationship
    {
        "template_id": "STP014",
        "name": "Invalid Nominee Relationship",
        "description": "STP014: Nominee must be immediate family member",
        "category": "stp_decision",
        "condition_group": {
            "logical_operator": "AND",
            "conditions": [
                {"field": "nominee_relation", "operator": "not_in", "value": ["husband", "wife", "son", "daughter", "father", "mother", "grandfather", "grandmother", "grandson", "granddaughter"]}
            ],
            "is_negated": False
        },
        "action": {
            "decision": "FAIL",
            "reason_code": "NOM001",
            "reason_message": "Not acceptable nominee relationship - RUW required",
            "is_hard_stop": False
        },
        "letter_flag": "O",
        "priority": 45,
        "products": ["term_life", "term_pure", "term_returns", "endowment", "ulip"]
    },
    
    # STP015A - Occupation (Student)
    {
        "template_id": "STP015A",
        "name": "Student - Education Proof Required",
        "description": "STP015A: Students require education proof",
        "category": "stp_decision",
        "condition_group": {
            "logical_operator": "AND",
            "conditions": [
                {"field": "occupation_code", "operator": "equals", "value": "student"}
            ],
            "is_negated": False
        },
        "action": {
            "decision": "FAIL",
            "reason_code": "JSM",
            "reason_message": "Student - Education proof required",
            "is_hard_stop": False
        },
        "letter_flag": "L",
        "follow_up_code": "JSM",
        "priority": 50,
        "products": ["term_life", "term_pure", "term_returns", "endowment", "ulip"]
    },
    
    # STP015B - Occupation (Armed Forces/Police)
    {
        "template_id": "STP015B",
        "name": "Armed Forces/Police Questionnaire",
        "description": "STP015B: Armed forces or police personnel require questionnaire",
        "category": "stp_decision",
        "condition_group": {
            "logical_operator": "AND",
            "conditions": [
                {"field": "occupation_code", "operator": "in", "value": ["armed_forces", "police"]}
            ],
            "is_negated": False
        },
        "action": {
            "decision": "FAIL",
            "reason_code": "Q2M",
            "reason_message": "Armed Forces/Police - Armed forces questionnaire required",
            "is_hard_stop": False
        },
        "letter_flag": "L",
        "follow_up_code": "Q2M",
        "priority": 50,
        "products": ["term_life", "term_pure", "term_returns", "endowment"]
    },
    
    # STP015C - Hazardous Occupation
    {
        "template_id": "STP015C",
        "name": "Hazardous Occupation",
        "description": "STP015C: Hazardous occupation requires RUW",
        "category": "stp_decision",
        "condition_group": {
            "logical_operator": "AND",
            "conditions": [
                {"field": "occupation_risk", "operator": "equals", "value": "hazardous"}
            ],
            "is_negated": False
        },
        "action": {
            "decision": "FAIL",
            "reason_code": "OCC001",
            "reason_message": "Hazardous occupation - RUW required",
            "is_hard_stop": False
        },
        "letter_flag": "O",
        "priority": 51,
        "products": ["term_life", "term_pure", "term_returns", "endowment"]
    },
    
    # STP017 - Negative Pincode
    {
        "template_id": "STP017",
        "name": "Negative Pincode Location",
        "description": "STP017: Applicant from negative pincode requires RUW",
        "category": "stp_decision",
        "condition_group": {
            "logical_operator": "AND",
            "conditions": [
                {"field": "is_negative_pincode", "operator": "equals", "value": True},
                {"field": "risk_category", "operator": "equals", "value": "low"}
            ],
            "is_negated": False
        },
        "action": {
            "decision": "FAIL",
            "reason_code": "PIN001",
            "reason_message": "Negative PINCode - RUW required",
            "is_hard_stop": False
        },
        "letter_flag": "O",
        "priority": 55,
        "products": ["term_life", "term_pure", "term_returns", "endowment", "ulip"]
    },
    
    # STP018M - Age 51-55 with High SA
    {
        "template_id": "STP018M",
        "name": "Age 51-55 with High Sum Assured",
        "description": "STP018M: Age 51-55 with FSAR > 20 Lakhs requires RUW",
        "category": "stp_decision",
        "condition_group": {
            "logical_operator": "AND",
            "conditions": [
                {"field": "applicant_age", "operator": "between", "value": 51, "value2": 55},
                {"field": "sum_assured", "operator": "greater_than", "value": 2000000}
            ],
            "is_negated": False
        },
        "action": {
            "decision": "FAIL",
            "reason_code": "AGE001",
            "reason_message": "Age > 50 & SA > 20L - RUW required",
            "is_hard_stop": False
        },
        "letter_flag": "O",
        "priority": 60,
        "products": ["term_life", "term_pure", "term_returns"]
    },
    
    # STP018N - Age > 55
    {
        "template_id": "STP018N",
        "name": "Age Above 55",
        "description": "STP018N: Age > 55 requires RUW",
        "category": "stp_decision",
        "condition_group": {
            "logical_operator": "AND",
            "conditions": [
                {"field": "applicant_age", "operator": "greater_than", "value": 55}
            ],
            "is_negated": False
        },
        "action": {
            "decision": "FAIL",
            "reason_code": "AGE002",
            "reason_message": "Age > 55 - RUW required",
            "is_hard_stop": False
        },
        "letter_flag": "O",
        "priority": 61,
        "products": ["term_life", "term_pure", "term_returns"]
    },
    
    # STP019E - High AML Category
    {
        "template_id": "STP019E",
        "name": "High AML Category",
        "description": "STP019E: High AML category requires RUW",
        "category": "stp_decision",
        "condition_group": {
            "logical_operator": "AND",
            "conditions": [
                {"field": "aml_category", "operator": "equals", "value": "high"}
            ],
            "is_negated": False
        },
        "action": {
            "decision": "FAIL",
            "reason_code": "AML001",
            "reason_message": "AML high category - RUW required",
            "is_hard_stop": True
        },
        "letter_flag": "O",
        "priority": 3,
        "products": ["term_life", "term_pure", "term_returns", "endowment", "ulip"]
    },
    
    # STP019F - Premium > 50% of Income
    {
        "template_id": "STP019F",
        "name": "Premium Affordability Check",
        "description": "STP019F: APE > 50% of annual income requires income proof",
        "category": "stp_decision",
        "condition_group": {
            "logical_operator": "AND",
            "conditions": [
                {"field": "premium_to_income_ratio", "operator": "greater_than", "value": 0.5}
            ],
            "is_negated": False
        },
        "action": {
            "decision": "FAIL",
            "reason_code": "IPR",
            "reason_message": "Premium > 50% of income - Income proof required",
            "is_hard_stop": False
        },
        "letter_flag": "L",
        "follow_up_code": "IPR",
        "priority": 65,
        "products": ["term_life", "term_pure", "term_returns", "endowment", "ulip"]
    },
    
    # STP020A - Financial Viability (Age 18-40)
    {
        "template_id": "STP020A",
        "name": "Financial Viability - Age 18-40",
        "description": "STP020A: For age 18-40, FSAR should be <= 25x Annual Income",
        "category": "stp_decision",
        "condition_group": {
            "logical_operator": "AND",
            "conditions": [
                {"field": "applicant_age", "operator": "between", "value": 18, "value2": 40},
                {"field": "sa_to_income_ratio", "operator": "greater_than", "value": 25}
            ],
            "is_negated": False
        },
        "action": {
            "decision": "FAIL",
            "reason_code": "FIN001",
            "reason_message": "SA exceeds 25x income for age 18-40 - Income proof required",
            "is_hard_stop": False
        },
        "letter_flag": "O",
        "priority": 70,
        "products": ["term_life", "term_pure", "term_returns"]
    },
    
    # STP020B - Financial Viability (Age 41-45)
    {
        "template_id": "STP020B",
        "name": "Financial Viability - Age 41-45",
        "description": "STP020B: For age 41-45, FSAR should be <= 20x Annual Income",
        "category": "stp_decision",
        "condition_group": {
            "logical_operator": "AND",
            "conditions": [
                {"field": "applicant_age", "operator": "between", "value": 41, "value2": 45},
                {"field": "sa_to_income_ratio", "operator": "greater_than", "value": 20}
            ],
            "is_negated": False
        },
        "action": {
            "decision": "FAIL",
            "reason_code": "FIN002",
            "reason_message": "SA exceeds 20x income for age 41-45 - Income proof required",
            "is_hard_stop": False
        },
        "letter_flag": "O",
        "priority": 71,
        "products": ["term_life", "term_pure", "term_returns"]
    },
    
    # STP020C - Financial Viability (Age 46-50)
    {
        "template_id": "STP020C",
        "name": "Financial Viability - Age 46-50",
        "description": "STP020C: For age 46-50, FSAR should be <= 15x Annual Income",
        "category": "stp_decision",
        "condition_group": {
            "logical_operator": "AND",
            "conditions": [
                {"field": "applicant_age", "operator": "between", "value": 46, "value2": 50},
                {"field": "sa_to_income_ratio", "operator": "greater_than", "value": 15}
            ],
            "is_negated": False
        },
        "action": {
            "decision": "FAIL",
            "reason_code": "FIN003",
            "reason_message": "SA exceeds 15x income for age 46-50 - Income proof required",
            "is_hard_stop": False
        },
        "letter_flag": "O",
        "priority": 72,
        "products": ["term_life", "term_pure", "term_returns"]
    },
    
    # STP020D - Financial Viability (Age 51-55)
    {
        "template_id": "STP020D",
        "name": "Financial Viability - Age 51-55",
        "description": "STP020D: For age 51-55, FSAR should be <= 10x Annual Income",
        "category": "stp_decision",
        "condition_group": {
            "logical_operator": "AND",
            "conditions": [
                {"field": "applicant_age", "operator": "between", "value": 51, "value2": 55},
                {"field": "sa_to_income_ratio", "operator": "greater_than", "value": 10}
            ],
            "is_negated": False
        },
        "action": {
            "decision": "FAIL",
            "reason_code": "FIN004",
            "reason_message": "SA exceeds 10x income for age 51-55 - Income proof required",
            "is_hard_stop": False
        },
        "letter_flag": "O",
        "priority": 73,
        "products": ["term_life", "term_pure", "term_returns"]
    },
    
    # STP025A - High Risk Category
    {
        "template_id": "STP025A",
        "name": "High Risk Category",
        "description": "STP025A: High risk category cases require RUW",
        "category": "stp_decision",
        "condition_group": {
            "logical_operator": "AND",
            "conditions": [
                {"field": "risk_category", "operator": "equals", "value": "high"}
            ],
            "is_negated": False
        },
        "action": {
            "decision": "FAIL",
            "reason_code": "RSK001",
            "reason_message": "High risk case - RUW required",
            "is_hard_stop": False
        },
        "letter_flag": "O",
        "priority": 75,
        "products": ["term_life", "term_pure", "term_returns", "endowment", "ulip"]
    },
    
    # STP028 - Family History
    {
        "template_id": "STP028",
        "name": "Negative Family History",
        "description": "STP028: Age < 60 with 2+ family members having medical history requires RUW",
        "category": "stp_decision",
        "condition_group": {
            "logical_operator": "AND",
            "conditions": [
                {"field": "applicant_age", "operator": "less_than", "value": 60},
                {"field": "family_history_count", "operator": "greater_than_or_equal", "value": 2}
            ],
            "is_negated": False
        },
        "action": {
            "decision": "FAIL",
            "reason_code": "FAM001",
            "reason_message": "Negative family history - RUW required",
            "is_hard_stop": False
        },
        "letter_flag": "O",
        "priority": 80,
        "products": ["term_life", "term_pure", "term_returns", "endowment"]
    },
    
    # STP031A - Criminal Records
    {
        "template_id": "STP031A",
        "name": "Criminal Records Check",
        "description": "STP031A: Criminally convicted applicants require RUW",
        "category": "stp_decision",
        "condition_group": {
            "logical_operator": "AND",
            "conditions": [
                {"field": "is_criminally_convicted", "operator": "equals", "value": True}
            ],
            "is_negated": False
        },
        "action": {
            "decision": "FAIL",
            "reason_code": "CRM001",
            "reason_message": "Criminal records - RUW required",
            "is_hard_stop": True
        },
        "letter_flag": "O",
        "priority": 2,
        "products": ["term_life", "term_pure", "term_returns", "endowment", "ulip"]
    },
    
    # STP031B - Politically Exposed Person
    {
        "template_id": "STP031B",
        "name": "Politically Exposed Person (PEP)",
        "description": "STP031B: Politically exposed persons require RUW",
        "category": "stp_decision",
        "condition_group": {
            "logical_operator": "AND",
            "conditions": [
                {"field": "is_politically_exposed", "operator": "equals", "value": True}
            ],
            "is_negated": False
        },
        "action": {
            "decision": "FAIL",
            "reason_code": "PEP001",
            "reason_message": "Politically Exposed Person (PEP) - RUW required",
            "is_hard_stop": False
        },
        "letter_flag": "O",
        "priority": 4,
        "products": ["term_life", "term_pure", "term_returns", "endowment", "ulip"]
    },
    
    # STP031C - OFAC/Sanctions List
    {
        "template_id": "STP031C",
        "name": "OFAC/Sanctions List Check",
        "description": "STP031C: Applicants on OFAC/sanctions list require RUW",
        "category": "stp_decision",
        "condition_group": {
            "logical_operator": "AND",
            "conditions": [
                {"field": "is_ofac", "operator": "equals", "value": True}
            ],
            "is_negated": False
        },
        "action": {
            "decision": "FAIL",
            "reason_code": "OFAC001",
            "reason_message": "Part of sanctions list - RUW required",
            "is_hard_stop": True
        },
        "letter_flag": "O",
        "priority": 1,
        "products": ["term_life", "term_pure", "term_returns", "endowment", "ulip"]
    },
    
    # STP035 - Medical Case
    {
        "template_id": "STP035",
        "name": "Medical Case Generated",
        "description": "STP035: Cases with medical reports generated require RUW",
        "category": "stp_decision",
        "condition_group": {
            "logical_operator": "AND",
            "conditions": [
                {"field": "is_medical_generated", "operator": "equals", "value": True}
            ],
            "is_negated": False
        },
        "action": {
            "decision": "FAIL",
            "reason_code": "MED001",
            "reason_message": "Medical Case - RUW required",
            "is_hard_stop": False
        },
        "letter_flag": "O",
        "priority": 85,
        "products": ["term_life", "term_pure", "term_returns", "endowment", "ulip"]
    },
]

# Template categories for better organization
TEMPLATE_CATEGORIES = {
    "identity": ["STP001"],
    "income": ["STP003", "STP019F", "STP020A", "STP020B", "STP020C", "STP020D"],
    "avocation": ["STP004"],
    "build": ["STP005A", "STP005B", "STP005C", "STP005G", "STP005H", "STP013"],
    "education": ["STP006"],
    "habits": ["STP008A", "STP008C", "STP008E"],
    "health": ["STP009", "STP028", "STP035"],
    "nominee": ["STP014"],
    "occupation": ["STP015A", "STP015B", "STP015C"],
    "location": ["STP017"],
    "age": ["STP018M", "STP018N"],
    "compliance": ["STP019E", "STP025A", "STP031A", "STP031B", "STP031C"],
}
