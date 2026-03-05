using InsuranceSTP.Models;
using InsuranceSTP.Data;
using System.Text.Json;

namespace InsuranceSTP.Services;

public static class RuleTemplateSeeder
{
    public static List<RuleTemplate> GetSTPTemplates()
    {
        return new List<RuleTemplate>
        {
            // STP001 - Gender
            new RuleTemplate
            {
                TemplateId = "STP001",
                Name = "Gender Check - Transgender",
                Description = "STP001: Gender must be Male or Female. Transgender cases require RUW.",
                Category = "stp_decision",
                ConditionGroupJson = JsonSerializer.Serialize(new {
                    logical_operator = "AND",
                    conditions = new object[] {
                        new {
                            logical_operator = "OR",
                            conditions = new object[] {
                                new { field = "applicant_gender", @operator = "not_equals", value = "M" },
                                new { field = "applicant_gender", @operator = "not_equals", value = "F" }
                            },
                            is_negated = false
                        }
                    },
                    is_negated = true
                }),
                ActionJson = JsonSerializer.Serialize(new {
                    decision = "FAIL",
                    reason_code = "TGQ",
                    reason_message = "Transgender - RUW required",
                    is_hard_stop = false
                }),
                LetterFlag = "O",
                FollowUpCode = "TGQ",
                Priority = 10,
                ProductsJson = "[\"term_life\",\"term_pure\",\"term_returns\",\"endowment\",\"ulip\"]"
            },
            
            // STP003 - Annual Income
            new RuleTemplate
            {
                TemplateId = "STP003",
                Name = "Annual Income Zero for Earning Life",
                Description = "STP003: Annual income cannot be 0 for earning life (non-student, non-housewife)",
                Category = "stp_decision",
                ConditionGroupJson = JsonSerializer.Serialize(new {
                    logical_operator = "AND",
                    conditions = new object[] {
                        new {
                            logical_operator = "AND",
                            conditions = new object[] {
                                new { field = "occupation_code", @operator = "not_equals", value = "student" },
                                new { field = "occupation_code", @operator = "not_equals", value = "housewife" }
                            },
                            is_negated = false
                        },
                        new { field = "applicant_income", @operator = "equals", value = 0 }
                    },
                    is_negated = false
                }),
                ActionJson = JsonSerializer.Serialize(new {
                    decision = "FAIL",
                    reason_code = "INC001",
                    reason_message = "Annual income 0 for earning life - RUW required",
                    is_hard_stop = false
                }),
                LetterFlag = "O",
                Priority = 15,
                ProductsJson = "[\"term_life\",\"term_pure\",\"term_returns\",\"endowment\",\"ulip\"]"
            },
            
            // STP004 - Avocation
            new RuleTemplate
            {
                TemplateId = "STP004",
                Name = "Adventurous Activities Check",
                Description = "STP004: Applicants engaged in adventurous activities require RUW",
                Category = "stp_decision",
                ConditionGroupJson = JsonSerializer.Serialize(new {
                    logical_operator = "AND",
                    conditions = new object[] {
                        new { field = "is_adventurous", @operator = "equals", value = true }
                    },
                    is_negated = false
                }),
                ActionJson = JsonSerializer.Serialize(new {
                    decision = "FAIL",
                    reason_code = "AVO001",
                    reason_message = "Avocation engagement - RUW required",
                    is_hard_stop = false
                }),
                LetterFlag = "O",
                Priority = 20,
                ProductsJson = "[\"term_life\",\"term_pure\",\"term_returns\"]"
            },
            
            // STP005A - Build (Life Product BMI > 30)
            new RuleTemplate
            {
                TemplateId = "STP005A",
                Name = "Life Product - High BMI Check",
                Description = "STP005A: Life Product with BMI > 30 and Age >= 12 requires Physical MER",
                Category = "stp_decision",
                ConditionGroupJson = JsonSerializer.Serialize(new {
                    logical_operator = "AND",
                    conditions = new object[] {
                        new { field = "product_type", @operator = "in", value = new[] { "term_life", "term_pure", "term_returns" } },
                        new { field = "bmi", @operator = "greater_than", value = 30 },
                        new { field = "applicant_age", @operator = "greater_than_or_equal", value = 12 }
                    },
                    is_negated = false
                }),
                ActionJson = JsonSerializer.Serialize(new {
                    decision = "FAIL",
                    reason_code = "MPN",
                    reason_message = "High BMI (>30) - Physical MER required",
                    is_hard_stop = false
                }),
                LetterFlag = "L",
                FollowUpCode = "MPN",
                Priority = 25,
                ProductsJson = "[\"term_life\",\"term_pure\",\"term_returns\"]"
            },
            
            // STP005C - Build (Life Product Low BMI < 18)
            new RuleTemplate
            {
                TemplateId = "STP005C",
                Name = "Life Product - Low BMI Check",
                Description = "STP005C: Life Product with BMI < 18 and Age >= 12 requires Physical MER",
                Category = "stp_decision",
                ConditionGroupJson = JsonSerializer.Serialize(new {
                    logical_operator = "AND",
                    conditions = new object[] {
                        new { field = "product_type", @operator = "in", value = new[] { "term_life", "term_pure", "term_returns" } },
                        new { field = "bmi", @operator = "less_than", value = 18 },
                        new { field = "applicant_age", @operator = "greater_than_or_equal", value = 12 }
                    },
                    is_negated = false
                }),
                ActionJson = JsonSerializer.Serialize(new {
                    decision = "FAIL",
                    reason_code = "MPN",
                    reason_message = "Low BMI (<18) - Physical MER required",
                    is_hard_stop = false
                }),
                LetterFlag = "L",
                FollowUpCode = "MPN",
                Priority = 25,
                ProductsJson = "[\"term_life\",\"term_pure\",\"term_returns\"]"
            },
            
            // STP008E - Narcotics/Drugs
            new RuleTemplate
            {
                TemplateId = "STP008E",
                Name = "Narcotics/Drugs Consumption",
                Description = "STP008E: Narcotics/Drugs consumption requires RUW",
                Category = "stp_decision",
                ConditionGroupJson = JsonSerializer.Serialize(new {
                    logical_operator = "AND",
                    conditions = new object[] {
                        new { field = "is_narcotic", @operator = "equals", value = true }
                    },
                    is_negated = false
                }),
                ActionJson = JsonSerializer.Serialize(new {
                    decision = "FAIL",
                    reason_code = "NAR001",
                    reason_message = "Narcotics/Drugs consumption - RUW required",
                    is_hard_stop = true
                }),
                LetterFlag = "O",
                Priority = 5,
                ProductsJson = "[\"term_life\",\"term_pure\",\"term_returns\",\"endowment\",\"ulip\"]"
            },
            
            // STP009 - Health History
            new RuleTemplate
            {
                TemplateId = "STP009",
                Name = "Negative Health History",
                Description = "STP009: Any positive health question response requires RUW",
                Category = "stp_decision",
                ConditionGroupJson = JsonSerializer.Serialize(new {
                    logical_operator = "AND",
                    conditions = new object[] {
                        new { field = "has_medical_history", @operator = "equals", value = true }
                    },
                    is_negated = false
                }),
                ActionJson = JsonSerializer.Serialize(new {
                    decision = "FAIL",
                    reason_code = "HLT001",
                    reason_message = "Negative health history - RUW required",
                    is_hard_stop = false
                }),
                LetterFlag = "O",
                Priority = 40,
                ProductsJson = "[\"term_life\",\"term_pure\",\"term_returns\",\"endowment\",\"ulip\"]"
            },
            
            // STP018N - Age > 55
            new RuleTemplate
            {
                TemplateId = "STP018N",
                Name = "Age Above 55",
                Description = "STP018N: Age > 55 requires RUW",
                Category = "stp_decision",
                ConditionGroupJson = JsonSerializer.Serialize(new {
                    logical_operator = "AND",
                    conditions = new object[] {
                        new { field = "applicant_age", @operator = "greater_than", value = 55 }
                    },
                    is_negated = false
                }),
                ActionJson = JsonSerializer.Serialize(new {
                    decision = "FAIL",
                    reason_code = "AGE002",
                    reason_message = "Age > 55 - RUW required",
                    is_hard_stop = false
                }),
                LetterFlag = "O",
                Priority = 61,
                ProductsJson = "[\"term_life\",\"term_pure\",\"term_returns\"]"
            },
            
            // STP019E - High AML Category
            new RuleTemplate
            {
                TemplateId = "STP019E",
                Name = "High AML Category",
                Description = "STP019E: High AML category requires RUW",
                Category = "stp_decision",
                ConditionGroupJson = JsonSerializer.Serialize(new {
                    logical_operator = "AND",
                    conditions = new object[] {
                        new { field = "aml_category", @operator = "equals", value = "high" }
                    },
                    is_negated = false
                }),
                ActionJson = JsonSerializer.Serialize(new {
                    decision = "FAIL",
                    reason_code = "AML001",
                    reason_message = "AML high category - RUW required",
                    is_hard_stop = true
                }),
                LetterFlag = "O",
                Priority = 3,
                ProductsJson = "[\"term_life\",\"term_pure\",\"term_returns\",\"endowment\",\"ulip\"]"
            },
            
            // STP031A - Criminal Records
            new RuleTemplate
            {
                TemplateId = "STP031A",
                Name = "Criminal Records Check",
                Description = "STP031A: Criminally convicted applicants require RUW",
                Category = "stp_decision",
                ConditionGroupJson = JsonSerializer.Serialize(new {
                    logical_operator = "AND",
                    conditions = new object[] {
                        new { field = "is_criminally_convicted", @operator = "equals", value = true }
                    },
                    is_negated = false
                }),
                ActionJson = JsonSerializer.Serialize(new {
                    decision = "FAIL",
                    reason_code = "CRM001",
                    reason_message = "Criminal records - RUW required",
                    is_hard_stop = true
                }),
                LetterFlag = "O",
                Priority = 2,
                ProductsJson = "[\"term_life\",\"term_pure\",\"term_returns\",\"endowment\",\"ulip\"]"
            },
            
            // STP031C - OFAC/Sanctions List
            new RuleTemplate
            {
                TemplateId = "STP031C",
                Name = "OFAC/Sanctions List Check",
                Description = "STP031C: Applicants on OFAC/sanctions list require RUW",
                Category = "stp_decision",
                ConditionGroupJson = JsonSerializer.Serialize(new {
                    logical_operator = "AND",
                    conditions = new object[] {
                        new { field = "is_ofac", @operator = "equals", value = true }
                    },
                    is_negated = false
                }),
                ActionJson = JsonSerializer.Serialize(new {
                    decision = "FAIL",
                    reason_code = "OFAC001",
                    reason_message = "Part of sanctions list - RUW required",
                    is_hard_stop = true
                }),
                LetterFlag = "O",
                Priority = 1,
                ProductsJson = "[\"term_life\",\"term_pure\",\"term_returns\",\"endowment\",\"ulip\"]"
            }
        };
    }
    
    public static void SeedTemplates(AppDbContext context)
    {
        if (!context.RuleTemplates.Any())
        {
            var templates = GetSTPTemplates();
            context.RuleTemplates.AddRange(templates);
            context.SaveChanges();
        }
    }
    
    public static void SeedDefaultAdmin(AppDbContext context, IAuthService authService)
    {
        if (!context.Users.Any(u => u.Username == "admin"))
        {
            var admin = new User
            {
                Username = "admin",
                Email = "admin@ruleengine.com",
                PasswordHash = authService.HashPassword("admin123"),
                FullName = "System Administrator",
                Role = UserRoles.Admin,
                IsActive = true
            };
            context.Users.Add(admin);
            context.SaveChanges();
        }
    }
}
