using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace InsuranceSTP.Models;

// JSON options for snake_case serialization (to match Python backend and frontend)
public static class JsonOptions
{
    public static readonly JsonSerializerOptions SnakeCase = new JsonSerializerOptions
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        WriteIndented = false
    };
}

// Enums
public enum RuleCategory
{
    stp_decision,
    case_type,
    reason_flag,
    scorecard,
    income_sa_grid,
    bmi_grid,
    occupation,
    agent_channel,
    address_pincode,
    validation
}

public enum ProductType
{
    term_life,
    endowment,
    ulip
}

public enum CaseType
{
    Normal = 0,
    DirectAccept = 1,
    DirectFail = -1,
    GCRP = 3
}

// Entity Models
public class Rule
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    
    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;
    
    public string? Description { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string Category { get; set; } = "stp_decision";
    
    // Stage assignment - null means "Unassigned" (processed last)
    public string? StageId { get; set; }
    
    [Column(TypeName = "TEXT")]
    public string ConditionGroupJson { get; set; } = "{}";
    
    [Column(TypeName = "TEXT")]
    public string ActionJson { get; set; } = "{}";
    
    public int Priority { get; set; } = 100;
    
    public bool IsEnabled { get; set; } = true;
    
    public string? EffectiveFrom { get; set; }
    
    public string? EffectiveTo { get; set; }
    
    [Column(TypeName = "TEXT")]
    public string ProductsJson { get; set; } = "[]";
    
    [Column(TypeName = "TEXT")]
    public string CaseTypesJson { get; set; } = "[]";
    
    public int Version { get; set; } = 1;
    
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
    
    public string UpdatedAt { get; set; } = DateTime.UtcNow.ToString("o");
    
    // Navigation helpers
    [NotMapped]
    public ConditionGroup ConditionGroup
    {
        get => JsonSerializer.Deserialize<ConditionGroup>(ConditionGroupJson) ?? new ConditionGroup();
        set => ConditionGroupJson = JsonSerializer.Serialize(value);
    }
    
    [NotMapped]
    public RuleAction Action
    {
        get => JsonSerializer.Deserialize<RuleAction>(ActionJson) ?? new RuleAction();
        set => ActionJson = JsonSerializer.Serialize(value);
    }
    
    [NotMapped]
    public List<string> Products
    {
        get => JsonSerializer.Deserialize<List<string>>(ProductsJson) ?? new List<string>();
        set => ProductsJson = JsonSerializer.Serialize(value);
    }
    
    [NotMapped]
    public List<int> CaseTypes
    {
        get => JsonSerializer.Deserialize<List<int>>(CaseTypesJson) ?? new List<int>();
        set => CaseTypesJson = JsonSerializer.Serialize(value);
    }
}

public class Scorecard
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    
    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;
    
    public string? Description { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string Product { get; set; } = "term_life";
    
    [Column(TypeName = "TEXT")]
    public string ParametersJson { get; set; } = "[]";
    
    public int ThresholdDirectAccept { get; set; } = 80;
    
    public int ThresholdNormal { get; set; } = 50;
    
    public int ThresholdRefer { get; set; } = 30;
    
    public bool IsEnabled { get; set; } = true;
    
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
    
    public string UpdatedAt { get; set; } = DateTime.UtcNow.ToString("o");
    
    [NotMapped]
    public List<ScorecardParameter> Parameters
    {
        get => JsonSerializer.Deserialize<List<ScorecardParameter>>(ParametersJson) ?? new List<ScorecardParameter>();
        set => ParametersJson = JsonSerializer.Serialize(value);
    }
}

public class Grid
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    
    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;
    
    public string? Description { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string GridType { get; set; } = "bmi";
    
    [MaxLength(100)]
    public string RowField { get; set; } = string.Empty;
    
    [MaxLength(100)]
    public string ColField { get; set; } = string.Empty;
    
    [Column(TypeName = "TEXT")]
    public string RowLabelsJson { get; set; } = "[]";
    
    [Column(TypeName = "TEXT")]
    public string ColLabelsJson { get; set; } = "[]";
    
    [Column(TypeName = "TEXT")]
    public string CellsJson { get; set; } = "[]";
    
    [Column(TypeName = "TEXT")]
    public string ProductsJson { get; set; } = "[]";
    
    public bool IsEnabled { get; set; } = true;
    
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
    
    public string UpdatedAt { get; set; } = DateTime.UtcNow.ToString("o");
    
    [NotMapped]
    public List<string> RowLabels
    {
        get => JsonSerializer.Deserialize<List<string>>(RowLabelsJson) ?? new List<string>();
        set => RowLabelsJson = JsonSerializer.Serialize(value);
    }
    
    [NotMapped]
    public List<string> ColLabels
    {
        get => JsonSerializer.Deserialize<List<string>>(ColLabelsJson) ?? new List<string>();
        set => ColLabelsJson = JsonSerializer.Serialize(value);
    }
    
    [NotMapped]
    public List<GridCell> Cells
    {
        get => JsonSerializer.Deserialize<List<GridCell>>(CellsJson) ?? new List<GridCell>();
        set => CellsJson = JsonSerializer.Serialize(value);
    }
    
    [NotMapped]
    public List<string> Products
    {
        get => JsonSerializer.Deserialize<List<string>>(ProductsJson) ?? new List<string>();
        set => ProductsJson = JsonSerializer.Serialize(value);
    }
}

public class Product
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    
    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(50)]
    public string ProductType { get; set; } = "term_life";
    
    public string? Description { get; set; }
    
    public string? ParentProductId { get; set; }
    
    public int MinAge { get; set; } = 18;
    
    public int MaxAge { get; set; } = 65;
    
    public long MinSumAssured { get; set; } = 100000;
    
    public long MaxSumAssured { get; set; } = 10000000;
    
    public int MinPremium { get; set; } = 1000;
    
    public bool HasMaturityBenefit { get; set; } = false;
    
    public bool IsEnabled { get; set; } = true;
    
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
}

public class Evaluation
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    
    [Required]
    [MaxLength(100)]
    public string ProposalId { get; set; } = string.Empty;
    
    [MaxLength(10)]
    public string StpDecision { get; set; } = "PASS";
    
    public int CaseTypeValue { get; set; } = 0;
    
    [MaxLength(50)]
    public string CaseTypeLabel { get; set; } = "Normal Case";
    
    public int ReasonFlag { get; set; } = 0;
    
    public int ScorecardValue { get; set; } = 0;
    
    [Column(TypeName = "TEXT")]
    public string TriggeredRulesJson { get; set; } = "[]";
    
    [Column(TypeName = "TEXT")]
    public string ValidationErrorsJson { get; set; } = "[]";
    
    [Column(TypeName = "TEXT")]
    public string ReasonCodesJson { get; set; } = "[]";
    
    [Column(TypeName = "TEXT")]
    public string ReasonMessagesJson { get; set; } = "[]";
    
    [Column(TypeName = "TEXT")]
    public string RuleTraceJson { get; set; } = "[]";
    
    public double EvaluationTimeMs { get; set; } = 0;
    
    public string EvaluatedAt { get; set; } = DateTime.UtcNow.ToString("o");
}

public class AuditLog
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    
    [Required]
    [MaxLength(50)]
    public string Action { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(50)]
    public string EntityType { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(36)]
    public string EntityId { get; set; } = string.Empty;
    
    [MaxLength(255)]
    public string EntityName { get; set; } = string.Empty;
    
    [Column(TypeName = "TEXT")]
    public string ChangesJson { get; set; } = "{}";
    
    [MaxLength(100)]
    public string PerformedBy { get; set; } = "system";
    
    public string PerformedAt { get; set; } = DateTime.UtcNow.ToString("o");
}

// Rule Stage Model for grouping rules into sequential execution stages
public class RuleStage
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    
    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;
    
    public string? Description { get; set; }
    
    // Order determines the sequence of stage execution (lower = earlier)
    public int ExecutionOrder { get; set; } = 1;
    
    // If true, stop evaluation if any rule in this stage fails
    public bool StopOnFail { get; set; } = false;
    
    // Color for UI display
    [MaxLength(20)]
    public string Color { get; set; } = "slate";
    
    public bool IsEnabled { get; set; } = true;
    
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
    
    public string UpdatedAt { get; set; } = DateTime.UtcNow.ToString("o");
}

// DTOs
public class ConditionGroup
{
    public string LogicalOperator { get; set; } = "AND";
    public List<object> Conditions { get; set; } = new();
    public bool IsNegated { get; set; } = false;
}

public class Condition
{
    public string Field { get; set; } = string.Empty;
    public string Operator { get; set; } = "equals";
    public object? Value { get; set; }
    public object? Value2 { get; set; }
}

public class RuleAction
{
    public string? Decision { get; set; }
    public int? ScoreImpact { get; set; }
    public int? CaseType { get; set; }
    public string? ReasonCode { get; set; }
    public string? ReasonMessage { get; set; }
    public bool IsHardStop { get; set; } = false;
}

public class ScorecardParameter
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public string Field { get; set; } = string.Empty;
    public double Weight { get; set; } = 1.0;
    public List<ScorecardBand> Bands { get; set; } = new();
}

public class ScorecardBand
{
    public double Min { get; set; }
    public double Max { get; set; }
    public int Score { get; set; }
    public string? Label { get; set; }
}

public class GridCell
{
    public string RowValue { get; set; } = string.Empty;
    public string ColValue { get; set; } = string.Empty;
    public string Result { get; set; } = "ACCEPT";
    public int? ScoreImpact { get; set; }
}

public class ProposalData
{
    public string ProposalId { get; set; } = string.Empty;
    public string ProductCode { get; set; } = string.Empty;
    public string ProductType { get; set; } = "term_life";
    public int ApplicantAge { get; set; }
    public string ApplicantGender { get; set; } = "M";
    public double ApplicantIncome { get; set; }
    public double SumAssured { get; set; }
    public double Premium { get; set; }
    public double? Bmi { get; set; }
    public string? OccupationCode { get; set; }
    public string? OccupationRisk { get; set; }
    public string? AgentCode { get; set; }
    public string? AgentTier { get; set; }
    public string? Pincode { get; set; }
    public bool IsSmoker { get; set; } = false;
    public bool HasMedicalHistory { get; set; } = false;
    public double ExistingCoverage { get; set; } = 0;
    // Conditional fields for dependent rules
    public int? CigarettesPerDay { get; set; }
    public int? SmokingYears { get; set; }
    public string? AilmentType { get; set; }
    public string? AilmentDetails { get; set; }
    public int? AilmentDurationYears { get; set; }
    public bool? IsAilmentOngoing { get; set; }
}

public class RuleExecutionTrace
{
    public string RuleId { get; set; } = string.Empty;
    public string RuleName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public bool Triggered { get; set; }
    public Dictionary<string, object?> InputValues { get; set; } = new();
    public bool ConditionResult { get; set; }
    public RuleAction? ActionApplied { get; set; }
    public double ExecutionTimeMs { get; set; }
}

public class EvaluationResult
{
    public string ProposalId { get; set; } = string.Empty;
    public string StpDecision { get; set; } = "PASS";
    public int CaseType { get; set; } = 0;
    public string CaseTypeLabel { get; set; } = "Normal Case";
    public int ReasonFlag { get; set; } = 0;
    public int ScorecardValue { get; set; } = 0;
    public List<string> TriggeredRules { get; set; } = new();
    public List<string> ValidationErrors { get; set; } = new();
    public List<string> ReasonCodes { get; set; } = new();
    public List<string> ReasonMessages { get; set; } = new();
    public List<RuleExecutionTrace> RuleTrace { get; set; } = new();
    public List<StageExecutionTrace> StageTrace { get; set; } = new();
    public RiskLoadingResult? RiskLoading { get; set; }
    public double EvaluationTimeMs { get; set; }
    public string EvaluatedAt { get; set; } = DateTime.UtcNow.ToString("o");
}

// Request/Response DTOs
public class RuleCreateDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = "stp_decision";
    public string? StageId { get; set; }
    public ConditionGroup ConditionGroup { get; set; } = new();
    public RuleAction Action { get; set; } = new();
    public int Priority { get; set; } = 100;
    public bool IsEnabled { get; set; } = true;
    public string? EffectiveFrom { get; set; }
    public string? EffectiveTo { get; set; }
    public List<string> Products { get; set; } = new();
    public List<int> CaseTypes { get; set; } = new();
}

public class RuleResponseDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;
    public string? StageId { get; set; }
    public string? StageName { get; set; }
    public ConditionGroup ConditionGroup { get; set; } = new();
    public RuleAction Action { get; set; } = new();
    public int Priority { get; set; }
    public bool IsEnabled { get; set; }
    public string? EffectiveFrom { get; set; }
    public string? EffectiveTo { get; set; }
    public List<string> Products { get; set; } = new();
    public List<int> CaseTypes { get; set; } = new();
    public int Version { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
    public string UpdatedAt { get; set; } = string.Empty;
}

// Stage DTOs
public class RuleStageCreateDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int ExecutionOrder { get; set; } = 1;
    public bool StopOnFail { get; set; } = false;
    public string Color { get; set; } = "slate";
    public bool IsEnabled { get; set; } = true;
}

public class RuleStageResponseDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int ExecutionOrder { get; set; }
    public bool StopOnFail { get; set; }
    public string Color { get; set; } = string.Empty;
    public bool IsEnabled { get; set; }
    public int RuleCount { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
    public string UpdatedAt { get; set; } = string.Empty;
}

// Stage execution trace for evaluation results
public class StageExecutionTrace
{
    public string StageId { get; set; } = string.Empty;
    public string StageName { get; set; } = string.Empty;
    public int ExecutionOrder { get; set; }
    public string Status { get; set; } = "passed"; // passed, failed, skipped
    public List<RuleExecutionTrace> RulesExecuted { get; set; } = new();
    public int TriggeredRulesCount { get; set; }
    public double ExecutionTimeMs { get; set; }
}

public class ScorecardCreateDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Product { get; set; } = "term_life";
    public List<ScorecardParameter> Parameters { get; set; } = new();
    public int ThresholdDirectAccept { get; set; } = 80;
    public int ThresholdNormal { get; set; } = 50;
    public int ThresholdRefer { get; set; } = 30;
    public bool IsEnabled { get; set; } = true;
}

public class GridCreateDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string GridType { get; set; } = "bmi";
    public string RowField { get; set; } = string.Empty;
    public string ColField { get; set; } = string.Empty;
    public List<string> RowLabels { get; set; } = new();
    public List<string> ColLabels { get; set; } = new();
    public List<GridCell> Cells { get; set; } = new();
    public List<string> Products { get; set; } = new();
    public bool IsEnabled { get; set; } = true;
}

public class ProductCreateDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string ProductType { get; set; } = "term_life";
    public string? Description { get; set; }
    public int MinAge { get; set; } = 18;
    public int MaxAge { get; set; } = 65;
    public long MinSumAssured { get; set; } = 100000;
    public long MaxSumAssured { get; set; } = 10000000;
    public int MinPremium { get; set; } = 1000;
    public bool IsEnabled { get; set; } = true;
}

// Risk Band Entity Model
public class RiskBand
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    
    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;
    
    public string? Description { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string Category { get; set; } = "age"; // age, smoking, medical, bmi, occupation
    
    [Column(TypeName = "TEXT")]
    public string ConditionJson { get; set; } = "{}";
    
    public double LoadingPercentage { get; set; } = 0;
    
    public int RiskScore { get; set; } = 0;
    
    [Column(TypeName = "TEXT")]
    public string ProductsJson { get; set; } = "[]";
    
    public int Priority { get; set; } = 100;
    
    public bool IsEnabled { get; set; } = true;
    
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
    
    public string UpdatedAt { get; set; } = DateTime.UtcNow.ToString("o");
    
    [NotMapped]
    public RiskBandCondition Condition
    {
        get => JsonSerializer.Deserialize<RiskBandCondition>(ConditionJson) ?? new RiskBandCondition();
        set => ConditionJson = JsonSerializer.Serialize(value);
    }
    
    [NotMapped]
    public List<string> Products
    {
        get => JsonSerializer.Deserialize<List<string>>(ProductsJson) ?? new List<string>();
        set => ProductsJson = JsonSerializer.Serialize(value);
    }
}

// Risk Band DTOs
public class RiskBandCondition
{
    [JsonPropertyName("field")]
    public string Field { get; set; } = string.Empty;
    
    [JsonPropertyName("operator")]
    public string Operator { get; set; } = "equals";
    
    [JsonPropertyName("value")]
    public object? Value { get; set; }
    
    [JsonPropertyName("value2")]
    public object? Value2 { get; set; }
}

public class RiskBandCreateDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = "age";
    public RiskBandCondition Condition { get; set; } = new();
    public double LoadingPercentage { get; set; } = 0;
    public int RiskScore { get; set; } = 0;
    public List<string> Products { get; set; } = new();
    public int Priority { get; set; } = 100;
    public bool IsEnabled { get; set; } = true;
}

public class RiskLoadingResult
{
    public int TotalRiskScore { get; set; }
    public double TotalLoadingPercentage { get; set; }
    public double BasePremium { get; set; }
    public double LoadedPremium { get; set; }
    public List<AppliedRiskBand> AppliedBands { get; set; } = new();
}

public class AppliedRiskBand
{
    public string BandId { get; set; } = string.Empty;
    public string BandName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public double LoadingPercentage { get; set; }
    public int RiskScore { get; set; }
    public string ConditionField { get; set; } = string.Empty;
    public object? FieldValue { get; set; }
}

