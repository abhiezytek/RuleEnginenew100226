using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InsuranceSTP.Data;
using InsuranceSTP.Models;
using InsuranceSTP.Services;
using System.Diagnostics;
using System.Text.Json;

namespace InsuranceSTP.Controllers;

[ApiController]
[Route("api")]
public class ApiController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly RuleEngine _ruleEngine;
    
    public ApiController(AppDbContext context, RuleEngine ruleEngine)
    {
        _context = context;
        _ruleEngine = ruleEngine;
    }
    
    // Health endpoints
    [HttpGet]
    public IActionResult Root() => Ok(new { message = "Life Insurance STP & Underwriting Rule Engine API", status = "healthy" });
    
    [HttpGet("health")]
    public IActionResult Health() => Ok(new { status = "healthy", timestamp = DateTime.UtcNow.ToString("o") });
    
    // Rules CRUD
    [HttpGet("rules")]
    public async Task<IActionResult> GetRules([FromQuery] string? category, [FromQuery] string? product, [FromQuery] bool? is_enabled, [FromQuery] string? search)
    {
        var query = _context.Rules.AsQueryable();
        
        if (!string.IsNullOrEmpty(category))
            query = query.Where(r => r.Category == category);
        if (is_enabled.HasValue)
            query = query.Where(r => r.IsEnabled == is_enabled.Value);
        if (!string.IsNullOrEmpty(search))
            query = query.Where(r => r.Name.Contains(search) || (r.Description != null && r.Description.Contains(search)));
        
        var rules = await query.OrderBy(r => r.Priority).ToListAsync();
        
        if (!string.IsNullOrEmpty(product))
            rules = rules.Where(r => r.Products.Contains(product)).ToList();
        
        return Ok(rules.Select(ToRuleResponse));
    }
    
    [HttpGet("rules/{id}")]
    public async Task<IActionResult> GetRule(string id)
    {
        var rule = await _context.Rules.FindAsync(id);
        if (rule == null) return NotFound(new { detail = "Rule not found" });
        return Ok(ToRuleResponse(rule));
    }
    
    [HttpPost("rules")]
    public async Task<IActionResult> CreateRule([FromBody] RuleCreateDto dto)
    {
        var rule = new Rule
        {
            Name = dto.Name,
            Description = dto.Description,
            Category = dto.Category,
            StageId = dto.StageId,
            ConditionGroup = dto.ConditionGroup,
            Action = dto.Action,
            Priority = dto.Priority,
            IsEnabled = dto.IsEnabled,
            EffectiveFrom = dto.EffectiveFrom,
            EffectiveTo = dto.EffectiveTo,
            Products = dto.Products,
            CaseTypes = dto.CaseTypes
        };
        
        _context.Rules.Add(rule);
        await _context.SaveChangesAsync();
        await LogAudit("CREATE", "rule", rule.Id, rule.Name);
        
        return Ok(ToRuleResponse(rule));
    }
    
    [HttpPut("rules/{id}")]
    public async Task<IActionResult> UpdateRule(string id, [FromBody] RuleCreateDto dto)
    {
        var rule = await _context.Rules.FindAsync(id);
        if (rule == null) return NotFound(new { detail = "Rule not found" });
        
        rule.Name = dto.Name;
        rule.Description = dto.Description;
        rule.Category = dto.Category;
        rule.StageId = dto.StageId;
        rule.ConditionGroup = dto.ConditionGroup;
        rule.Action = dto.Action;
        rule.Priority = dto.Priority;
        rule.IsEnabled = dto.IsEnabled;
        rule.EffectiveFrom = dto.EffectiveFrom;
        rule.EffectiveTo = dto.EffectiveTo;
        rule.Products = dto.Products;
        rule.CaseTypes = dto.CaseTypes;
        rule.Version++;
        rule.UpdatedAt = DateTime.UtcNow.ToString("o");
        
        await _context.SaveChangesAsync();
        await LogAudit("UPDATE", "rule", rule.Id, rule.Name);
        
        return Ok(ToRuleResponse(rule));
    }
    
    [HttpDelete("rules/{id}")]
    public async Task<IActionResult> DeleteRule(string id)
    {
        var rule = await _context.Rules.FindAsync(id);
        if (rule == null) return NotFound(new { detail = "Rule not found" });
        
        _context.Rules.Remove(rule);
        await _context.SaveChangesAsync();
        await LogAudit("DELETE", "rule", id, rule.Name);
        
        return Ok(new { message = "Rule deleted successfully" });
    }
    
    [HttpPatch("rules/{id}/toggle")]
    public async Task<IActionResult> ToggleRule(string id)
    {
        var rule = await _context.Rules.FindAsync(id);
        if (rule == null) return NotFound(new { detail = "Rule not found" });
        
        rule.IsEnabled = !rule.IsEnabled;
        rule.UpdatedAt = DateTime.UtcNow.ToString("o");
        await _context.SaveChangesAsync();
        await LogAudit("TOGGLE", "rule", rule.Id, rule.Name);
        
        return Ok(new { id, is_enabled = rule.IsEnabled });
    }
    
    // Scorecards CRUD
    [HttpGet("scorecards")]
    public async Task<IActionResult> GetScorecards([FromQuery] string? product)
    {
        var query = _context.Scorecards.AsQueryable();
        if (!string.IsNullOrEmpty(product))
            query = query.Where(s => s.Product == product);
        var scorecards = await query.ToListAsync();
        return Ok(scorecards.Select(ToScorecardResponse));
    }
    
    [HttpGet("scorecards/{id}")]
    public async Task<IActionResult> GetScorecard(string id)
    {
        var scorecard = await _context.Scorecards.FindAsync(id);
        if (scorecard == null) return NotFound(new { detail = "Scorecard not found" });
        return Ok(ToScorecardResponse(scorecard));
    }
    
    [HttpPost("scorecards")]
    public async Task<IActionResult> CreateScorecard([FromBody] ScorecardCreateDto dto)
    {
        var scorecard = new Scorecard
        {
            Name = dto.Name,
            Description = dto.Description,
            Product = dto.Product,
            Parameters = dto.Parameters,
            ThresholdDirectAccept = dto.ThresholdDirectAccept,
            ThresholdNormal = dto.ThresholdNormal,
            ThresholdRefer = dto.ThresholdRefer,
            IsEnabled = dto.IsEnabled
        };
        
        _context.Scorecards.Add(scorecard);
        await _context.SaveChangesAsync();
        await LogAudit("CREATE", "scorecard", scorecard.Id, scorecard.Name);
        
        return Ok(ToScorecardResponse(scorecard));
    }
    
    [HttpPut("scorecards/{id}")]
    public async Task<IActionResult> UpdateScorecard(string id, [FromBody] ScorecardCreateDto dto)
    {
        var scorecard = await _context.Scorecards.FindAsync(id);
        if (scorecard == null) return NotFound(new { detail = "Scorecard not found" });
        
        scorecard.Name = dto.Name;
        scorecard.Description = dto.Description;
        scorecard.Product = dto.Product;
        scorecard.Parameters = dto.Parameters;
        scorecard.ThresholdDirectAccept = dto.ThresholdDirectAccept;
        scorecard.ThresholdNormal = dto.ThresholdNormal;
        scorecard.ThresholdRefer = dto.ThresholdRefer;
        scorecard.IsEnabled = dto.IsEnabled;
        scorecard.UpdatedAt = DateTime.UtcNow.ToString("o");
        
        await _context.SaveChangesAsync();
        await LogAudit("UPDATE", "scorecard", scorecard.Id, scorecard.Name);
        
        return Ok(ToScorecardResponse(scorecard));
    }
    
    [HttpDelete("scorecards/{id}")]
    public async Task<IActionResult> DeleteScorecard(string id)
    {
        var scorecard = await _context.Scorecards.FindAsync(id);
        if (scorecard == null) return NotFound(new { detail = "Scorecard not found" });
        
        _context.Scorecards.Remove(scorecard);
        await _context.SaveChangesAsync();
        await LogAudit("DELETE", "scorecard", id, scorecard.Name);
        
        return Ok(new { message = "Scorecard deleted successfully" });
    }
    
    // Grids CRUD
    [HttpGet("grids")]
    public async Task<IActionResult> GetGrids([FromQuery] string? grid_type, [FromQuery] string? product)
    {
        var query = _context.Grids.AsQueryable();
        if (!string.IsNullOrEmpty(grid_type))
            query = query.Where(g => g.GridType == grid_type);
        var grids = await query.ToListAsync();
        
        if (!string.IsNullOrEmpty(product))
            grids = grids.Where(g => g.Products.Contains(product)).ToList();
        
        return Ok(grids.Select(ToGridResponse));
    }
    
    [HttpGet("grids/{id}")]
    public async Task<IActionResult> GetGrid(string id)
    {
        var grid = await _context.Grids.FindAsync(id);
        if (grid == null) return NotFound(new { detail = "Grid not found" });
        return Ok(ToGridResponse(grid));
    }
    
    [HttpPost("grids")]
    public async Task<IActionResult> CreateGrid([FromBody] GridCreateDto dto)
    {
        var grid = new Grid
        {
            Name = dto.Name,
            Description = dto.Description,
            GridType = dto.GridType,
            RowField = dto.RowField,
            ColField = dto.ColField,
            RowLabels = dto.RowLabels,
            ColLabels = dto.ColLabels,
            Cells = dto.Cells,
            Products = dto.Products,
            IsEnabled = dto.IsEnabled
        };
        
        _context.Grids.Add(grid);
        await _context.SaveChangesAsync();
        await LogAudit("CREATE", "grid", grid.Id, grid.Name);
        
        return Ok(ToGridResponse(grid));
    }
    
    [HttpPut("grids/{id}")]
    public async Task<IActionResult> UpdateGrid(string id, [FromBody] GridCreateDto dto)
    {
        var grid = await _context.Grids.FindAsync(id);
        if (grid == null) return NotFound(new { detail = "Grid not found" });
        
        grid.Name = dto.Name;
        grid.Description = dto.Description;
        grid.GridType = dto.GridType;
        grid.RowField = dto.RowField;
        grid.ColField = dto.ColField;
        grid.RowLabels = dto.RowLabels;
        grid.ColLabels = dto.ColLabels;
        grid.Cells = dto.Cells;
        grid.Products = dto.Products;
        grid.IsEnabled = dto.IsEnabled;
        grid.UpdatedAt = DateTime.UtcNow.ToString("o");
        
        await _context.SaveChangesAsync();
        await LogAudit("UPDATE", "grid", grid.Id, grid.Name);
        
        return Ok(ToGridResponse(grid));
    }
    
    [HttpDelete("grids/{id}")]
    public async Task<IActionResult> DeleteGrid(string id)
    {
        var grid = await _context.Grids.FindAsync(id);
        if (grid == null) return NotFound(new { detail = "Grid not found" });
        
        _context.Grids.Remove(grid);
        await _context.SaveChangesAsync();
        await LogAudit("DELETE", "grid", id, grid.Name);
        
        return Ok(new { message = "Grid deleted successfully" });
    }
    
    // Products CRUD
    [HttpGet("products")]
    public async Task<IActionResult> GetProducts([FromQuery] string? product_type)
    {
        var query = _context.Products.AsQueryable();
        if (!string.IsNullOrEmpty(product_type))
            query = query.Where(p => p.ProductType == product_type);
        var products = await query.ToListAsync();
        return Ok(products.Select(ToProductResponse));
    }
    
    [HttpGet("products/{id}")]
    public async Task<IActionResult> GetProduct(string id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound(new { detail = "Product not found" });
        return Ok(ToProductResponse(product));
    }
    
    [HttpPost("products")]
    public async Task<IActionResult> CreateProduct([FromBody] ProductCreateDto dto)
    {
        var product = new Product
        {
            Code = dto.Code,
            Name = dto.Name,
            ProductType = dto.ProductType,
            Description = dto.Description,
            MinAge = dto.MinAge,
            MaxAge = dto.MaxAge,
            MinSumAssured = dto.MinSumAssured,
            MaxSumAssured = dto.MaxSumAssured,
            MinPremium = dto.MinPremium,
            IsEnabled = dto.IsEnabled
        };
        
        _context.Products.Add(product);
        await _context.SaveChangesAsync();
        await LogAudit("CREATE", "product", product.Id, product.Name);
        
        return Ok(ToProductResponse(product));
    }
    
    [HttpPut("products/{id}")]
    public async Task<IActionResult> UpdateProduct(string id, [FromBody] ProductCreateDto dto)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound(new { detail = "Product not found" });
        
        product.Code = dto.Code;
        product.Name = dto.Name;
        product.ProductType = dto.ProductType;
        product.Description = dto.Description;
        product.MinAge = dto.MinAge;
        product.MaxAge = dto.MaxAge;
        product.MinSumAssured = dto.MinSumAssured;
        product.MaxSumAssured = dto.MaxSumAssured;
        product.MinPremium = dto.MinPremium;
        product.IsEnabled = dto.IsEnabled;
        
        await _context.SaveChangesAsync();
        await LogAudit("UPDATE", "product", product.Id, product.Name);
        
        return Ok(ToProductResponse(product));
    }
    
    [HttpDelete("products/{id}")]
    public async Task<IActionResult> DeleteProduct(string id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound(new { detail = "Product not found" });
        
        _context.Products.Remove(product);
        await _context.SaveChangesAsync();
        await LogAudit("DELETE", "product", id, product.Name);
        
        return Ok(new { message = "Product deleted successfully" });
    }
    
    // Rule Stages CRUD
    [HttpGet("stages")]
    public async Task<IActionResult> GetStages()
    {
        var stages = await _context.RuleStages.OrderBy(s => s.ExecutionOrder).ToListAsync();
        var result = new List<object>();
        
        foreach (var stage in stages)
        {
            var ruleCount = await _context.Rules.CountAsync(r => r.StageId == stage.Id);
            result.Add(ToStageResponse(stage, ruleCount));
        }
        
        return Ok(result);
    }
    
    [HttpGet("stages/{id}")]
    public async Task<IActionResult> GetStage(string id)
    {
        var stage = await _context.RuleStages.FindAsync(id);
        if (stage == null) return NotFound(new { detail = "Stage not found" });
        
        var ruleCount = await _context.Rules.CountAsync(r => r.StageId == id);
        return Ok(ToStageResponse(stage, ruleCount));
    }
    
    [HttpPost("stages")]
    public async Task<IActionResult> CreateStage([FromBody] RuleStageCreateDto dto)
    {
        var stage = new RuleStage
        {
            Name = dto.Name,
            Description = dto.Description,
            ExecutionOrder = dto.ExecutionOrder,
            StopOnFail = dto.StopOnFail,
            Color = dto.Color,
            IsEnabled = dto.IsEnabled
        };
        
        _context.RuleStages.Add(stage);
        await _context.SaveChangesAsync();
        await LogAudit("CREATE", "stage", stage.Id, stage.Name);
        
        return Ok(ToStageResponse(stage, 0));
    }
    
    [HttpPut("stages/{id}")]
    public async Task<IActionResult> UpdateStage(string id, [FromBody] RuleStageCreateDto dto)
    {
        var stage = await _context.RuleStages.FindAsync(id);
        if (stage == null) return NotFound(new { detail = "Stage not found" });
        
        stage.Name = dto.Name;
        stage.Description = dto.Description;
        stage.ExecutionOrder = dto.ExecutionOrder;
        stage.StopOnFail = dto.StopOnFail;
        stage.Color = dto.Color;
        stage.IsEnabled = dto.IsEnabled;
        stage.UpdatedAt = DateTime.UtcNow.ToString("o");
        
        await _context.SaveChangesAsync();
        await LogAudit("UPDATE", "stage", stage.Id, stage.Name);
        
        var ruleCount = await _context.Rules.CountAsync(r => r.StageId == id);
        return Ok(ToStageResponse(stage, ruleCount));
    }
    
    [HttpDelete("stages/{id}")]
    public async Task<IActionResult> DeleteStage(string id)
    {
        var stage = await _context.RuleStages.FindAsync(id);
        if (stage == null) return NotFound(new { detail = "Stage not found" });
        
        // Remove stage assignment from rules
        var rules = await _context.Rules.Where(r => r.StageId == id).ToListAsync();
        foreach (var rule in rules)
        {
            rule.StageId = null;
        }
        
        _context.RuleStages.Remove(stage);
        await _context.SaveChangesAsync();
        await LogAudit("DELETE", "stage", id, stage.Name);
        
        return Ok(new { message = "Stage deleted successfully", rules_unassigned = rules.Count });
    }
    
    [HttpPatch("stages/{id}/toggle")]
    public async Task<IActionResult> ToggleStage(string id)
    {
        var stage = await _context.RuleStages.FindAsync(id);
        if (stage == null) return NotFound(new { detail = "Stage not found" });
        
        stage.IsEnabled = !stage.IsEnabled;
        stage.UpdatedAt = DateTime.UtcNow.ToString("o");
        await _context.SaveChangesAsync();
        await LogAudit("TOGGLE", "stage", stage.Id, stage.Name);
        
        return Ok(new { id, is_enabled = stage.IsEnabled });
    }
    
    // Get rules by stage
    [HttpGet("stages/{id}/rules")]
    public async Task<IActionResult> GetRulesByStage(string id)
    {
        var stage = await _context.RuleStages.FindAsync(id);
        if (stage == null) return NotFound(new { detail = "Stage not found" });
        
        var rules = await _context.Rules.Where(r => r.StageId == id).OrderBy(r => r.Priority).ToListAsync();
        return Ok(rules.Select(ToRuleResponse));
    }
    
    // Underwriting Evaluation
    [HttpPost("underwriting/evaluate")]
    public async Task<IActionResult> EvaluateProposal([FromBody] ProposalData proposal)
    {
        var stopwatch = Stopwatch.StartNew();
        
        var stpDecision = "PASS";
        var caseType = 0;
        var reasonFlag = 0;
        var scorecardValue = 0;
        var triggeredRules = new List<string>();
        var validationErrors = new List<string>();
        var reasonCodes = new List<string>();
        var reasonMessages = new List<string>();
        var ruleTrace = new List<RuleExecutionTrace>();
        var stageTrace = new List<StageExecutionTrace>();
        
        var proposalDict = new Dictionary<string, object?>
        {
            ["proposal_id"] = proposal.ProposalId,
            ["product_code"] = proposal.ProductCode,
            ["product_type"] = proposal.ProductType,
            ["applicant_age"] = proposal.ApplicantAge,
            ["applicant_gender"] = proposal.ApplicantGender,
            ["applicant_income"] = proposal.ApplicantIncome,
            ["sum_assured"] = proposal.SumAssured,
            ["premium"] = proposal.Premium,
            ["bmi"] = proposal.Bmi,
            ["occupation_code"] = proposal.OccupationCode,
            ["occupation_risk"] = proposal.OccupationRisk,
            ["agent_code"] = proposal.AgentCode,
            ["agent_tier"] = proposal.AgentTier,
            ["pincode"] = proposal.Pincode,
            ["is_smoker"] = proposal.IsSmoker,
            ["has_medical_history"] = proposal.HasMedicalHistory,
            ["existing_coverage"] = proposal.ExistingCoverage
        };
        
        // Get all stages ordered by execution order
        var stages = await _context.RuleStages
            .Where(s => s.IsEnabled)
            .OrderBy(s => s.ExecutionOrder)
            .ToListAsync();
        
        // Get all enabled rules
        var allRules = await _context.Rules.Where(r => r.IsEnabled).ToListAsync();
        
        var shouldStopProcessing = false;
        
        // Process each stage in order
        foreach (var stage in stages)
        {
            if (shouldStopProcessing)
            {
                // Add skipped stage to trace
                stageTrace.Add(new StageExecutionTrace
                {
                    StageId = stage.Id,
                    StageName = stage.Name,
                    ExecutionOrder = stage.ExecutionOrder,
                    Status = "skipped",
                    RulesExecuted = new List<RuleExecutionTrace>(),
                    TriggeredRulesCount = 0,
                    ExecutionTimeMs = 0
                });
                continue;
            }
            
            var stageStopwatch = Stopwatch.StartNew();
            var stageRules = allRules
                .Where(r => r.StageId == stage.Id)
                .OrderBy(r => r.Priority)
                .ToList();
            
            var stageRuleTrace = new List<RuleExecutionTrace>();
            var stageTriggeredCount = 0;
            var stageHasFail = false;
            
            foreach (var rule in stageRules)
            {
                var ruleStopwatch = Stopwatch.StartNew();
                
                if (!_ruleEngine.IsRuleApplicable(rule, proposal.ProductType, caseType))
                    continue;
                
                var conditionJson = JsonDocument.Parse(rule.ConditionGroupJson).RootElement;
                var triggered = _ruleEngine.EvaluateConditionGroup(conditionJson, proposalDict);
                
                var trace = new RuleExecutionTrace
                {
                    RuleId = rule.Id,
                    RuleName = rule.Name,
                    Category = rule.Category,
                    Triggered = triggered,
                    ConditionResult = triggered,
                    ActionApplied = triggered ? rule.Action : null,
                    ExecutionTimeMs = ruleStopwatch.Elapsed.TotalMilliseconds
                };
                
                stageRuleTrace.Add(trace);
                ruleTrace.Add(trace);
                
                if (triggered)
                {
                    stageTriggeredCount++;
                    var action = rule.Action;
                    triggeredRules.Add(rule.Name);
                    
                    // Handle validation errors
                    if (rule.Category == "validation" && !string.IsNullOrEmpty(action.ReasonMessage))
                        validationErrors.Add(action.ReasonMessage);
                    
                    // Handle decisions
                    if (action.Decision == "FAIL")
                    {
                        stpDecision = "FAIL";
                        reasonFlag = 1;
                        stageHasFail = true;
                    }
                    
                    // Handle case type
                    if (action.CaseType.HasValue)
                        caseType = action.CaseType.Value;
                    
                    // Handle score impact
                    if (action.ScoreImpact.HasValue)
                        scorecardValue += action.ScoreImpact.Value;
                    
                    // Collect reason codes/messages
                    if (!string.IsNullOrEmpty(action.ReasonCode))
                        reasonCodes.Add(action.ReasonCode);
                    if (!string.IsNullOrEmpty(action.ReasonMessage))
                        reasonMessages.Add(action.ReasonMessage);
                    
                    // Hard stop handling
                    if (action.IsHardStop)
                    {
                        stpDecision = "FAIL";
                        caseType = -1;
                        reasonFlag = 1;
                        stageHasFail = true;
                        shouldStopProcessing = true;
                        break;
                    }
                }
            }
            
            stageStopwatch.Stop();
            
            // Determine stage status
            var stageStatus = "passed";
            if (stageHasFail)
            {
                stageStatus = "failed";
                if (stage.StopOnFail)
                    shouldStopProcessing = true;
            }
            
            stageTrace.Add(new StageExecutionTrace
            {
                StageId = stage.Id,
                StageName = stage.Name,
                ExecutionOrder = stage.ExecutionOrder,
                Status = stageStatus,
                RulesExecuted = stageRuleTrace,
                TriggeredRulesCount = stageTriggeredCount,
                ExecutionTimeMs = Math.Round(stageStopwatch.Elapsed.TotalMilliseconds, 2)
            });
        }
        
        // Process unassigned rules (rules without a stage) - processed last
        if (!shouldStopProcessing)
        {
            var unassignedStageStopwatch = Stopwatch.StartNew();
            var unassignedRules = allRules
                .Where(r => r.StageId == null)
                .OrderBy(r => r.Priority)
                .ToList();
            
            if (unassignedRules.Any())
            {
                var unassignedRuleTrace = new List<RuleExecutionTrace>();
                var unassignedTriggeredCount = 0;
                var unassignedHasFail = false;
                
                foreach (var rule in unassignedRules)
                {
                    var ruleStopwatch = Stopwatch.StartNew();
                    
                    if (!_ruleEngine.IsRuleApplicable(rule, proposal.ProductType, caseType))
                        continue;
                    
                    var conditionJson = JsonDocument.Parse(rule.ConditionGroupJson).RootElement;
                    var triggered = _ruleEngine.EvaluateConditionGroup(conditionJson, proposalDict);
                    
                    var trace = new RuleExecutionTrace
                    {
                        RuleId = rule.Id,
                        RuleName = rule.Name,
                        Category = rule.Category,
                        Triggered = triggered,
                        ConditionResult = triggered,
                        ActionApplied = triggered ? rule.Action : null,
                        ExecutionTimeMs = ruleStopwatch.Elapsed.TotalMilliseconds
                    };
                    
                    unassignedRuleTrace.Add(trace);
                    ruleTrace.Add(trace);
                    
                    if (triggered)
                    {
                        unassignedTriggeredCount++;
                        var action = rule.Action;
                        triggeredRules.Add(rule.Name);
                        
                        if (rule.Category == "validation" && !string.IsNullOrEmpty(action.ReasonMessage))
                            validationErrors.Add(action.ReasonMessage);
                        
                        if (action.Decision == "FAIL")
                        {
                            stpDecision = "FAIL";
                            reasonFlag = 1;
                            unassignedHasFail = true;
                        }
                        
                        if (action.CaseType.HasValue)
                            caseType = action.CaseType.Value;
                        
                        if (action.ScoreImpact.HasValue)
                            scorecardValue += action.ScoreImpact.Value;
                        
                        if (!string.IsNullOrEmpty(action.ReasonCode))
                            reasonCodes.Add(action.ReasonCode);
                        if (!string.IsNullOrEmpty(action.ReasonMessage))
                            reasonMessages.Add(action.ReasonMessage);
                        
                        if (action.IsHardStop)
                        {
                            stpDecision = "FAIL";
                            caseType = -1;
                            reasonFlag = 1;
                            break;
                        }
                    }
                }
                
                unassignedStageStopwatch.Stop();
                
                stageTrace.Add(new StageExecutionTrace
                {
                    StageId = "unassigned",
                    StageName = "Unassigned Rules",
                    ExecutionOrder = 999,
                    Status = unassignedHasFail ? "failed" : "passed",
                    RulesExecuted = unassignedRuleTrace,
                    TriggeredRulesCount = unassignedTriggeredCount,
                    ExecutionTimeMs = Math.Round(unassignedStageStopwatch.Elapsed.TotalMilliseconds, 2)
                });
            }
        }
        
        stopwatch.Stop();
        
        // Calculate Risk Loading
        var riskLoading = CalculateRiskLoading(proposal);
        
        var caseTypeLabel = caseType switch
        {
            0 => "Normal Case",
            1 => "Direct Accept",
            -1 => "Direct Fail",
            3 => "GCRP Case",
            _ => "Unknown"
        };
        
        var result = new EvaluationResult
        {
            ProposalId = proposal.ProposalId,
            StpDecision = stpDecision,
            CaseType = caseType,
            CaseTypeLabel = caseTypeLabel,
            ReasonFlag = reasonFlag,
            ScorecardValue = scorecardValue,
            TriggeredRules = triggeredRules,
            ValidationErrors = validationErrors,
            ReasonCodes = reasonCodes.Distinct().ToList(),
            ReasonMessages = reasonMessages.Distinct().ToList(),
            RuleTrace = ruleTrace,
            StageTrace = stageTrace,
            RiskLoading = riskLoading,
            EvaluationTimeMs = Math.Round(stopwatch.Elapsed.TotalMilliseconds, 2),
            EvaluatedAt = DateTime.UtcNow.ToString("o")
        };
        
        // Store evaluation
        var evaluation = new Evaluation
        {
            ProposalId = result.ProposalId,
            StpDecision = result.StpDecision,
            CaseTypeValue = result.CaseType,
            CaseTypeLabel = result.CaseTypeLabel,
            ReasonFlag = result.ReasonFlag,
            ScorecardValue = result.ScorecardValue,
            TriggeredRulesJson = JsonSerializer.Serialize(result.TriggeredRules),
            ValidationErrorsJson = JsonSerializer.Serialize(result.ValidationErrors),
            ReasonCodesJson = JsonSerializer.Serialize(result.ReasonCodes),
            ReasonMessagesJson = JsonSerializer.Serialize(result.ReasonMessages),
            RuleTraceJson = JsonSerializer.Serialize(result.RuleTrace),
            EvaluationTimeMs = result.EvaluationTimeMs,
            EvaluatedAt = result.EvaluatedAt
        };
        
        _context.Evaluations.Add(evaluation);
        await _context.SaveChangesAsync();
        
        return Ok(result);
    }
    
    // Audit Logs
    [HttpGet("audit-logs")]
    public async Task<IActionResult> GetAuditLogs([FromQuery] string? entity_type, [FromQuery] string? action, [FromQuery] int limit = 100)
    {
        var query = _context.AuditLogs.AsQueryable();
        
        if (!string.IsNullOrEmpty(entity_type))
            query = query.Where(a => a.EntityType == entity_type);
        if (!string.IsNullOrEmpty(action))
            query = query.Where(a => a.Action == action);
        
        var logs = await query.OrderByDescending(a => a.PerformedAt).Take(limit).ToListAsync();
        return Ok(logs.Select(ToAuditLogResponse));
    }
    
    // Evaluations History
    [HttpGet("evaluations")]
    public async Task<IActionResult> GetEvaluations([FromQuery] string? stp_decision, [FromQuery] int limit = 100)
    {
        var query = _context.Evaluations.AsQueryable();
        
        if (!string.IsNullOrEmpty(stp_decision))
            query = query.Where(e => e.StpDecision == stp_decision);
        
        var evaluations = await query.OrderByDescending(e => e.EvaluatedAt).Take(limit).ToListAsync();
        return Ok(evaluations.Select(ToEvaluationResponse));
    }
    
    [HttpGet("evaluations/{id}")]
    public async Task<IActionResult> GetEvaluation(string id)
    {
        var evaluation = await _context.Evaluations.FindAsync(id);
        if (evaluation == null) return NotFound(new { detail = "Evaluation not found" });
        return Ok(ToEvaluationResponse(evaluation));
    }
    
    // Dashboard Stats
    [HttpGet("dashboard/stats")]
    public async Task<IActionResult> GetDashboardStats()
    {
        var totalRules = await _context.Rules.CountAsync();
        var activeRules = await _context.Rules.Where(r => r.IsEnabled).CountAsync();
        var totalEvaluations = await _context.Evaluations.CountAsync();
        var stpPass = await _context.Evaluations.Where(e => e.StpDecision == "PASS").CountAsync();
        var stpFail = await _context.Evaluations.Where(e => e.StpDecision == "FAIL").CountAsync();
        var totalStages = await _context.RuleStages.CountAsync();
        var activeStages = await _context.RuleStages.Where(s => s.IsEnabled).CountAsync();
        
        var stpRate = totalEvaluations > 0 ? Math.Round((double)stpPass / totalEvaluations * 100, 2) : 0;
        
        var categoryDist = await _context.Rules
            .GroupBy(r => r.Category)
            .Select(g => new { category = g.Key, count = g.Count() })
            .ToListAsync();
        
        var recentEvals = await _context.Evaluations
            .OrderByDescending(e => e.EvaluatedAt)
            .Take(10)
            .ToListAsync();
        
        return Ok(new
        {
            total_rules = totalRules,
            active_rules = activeRules,
            inactive_rules = totalRules - activeRules,
            total_stages = totalStages,
            active_stages = activeStages,
            total_evaluations = totalEvaluations,
            stp_pass = stpPass,
            stp_fail = stpFail,
            stp_rate = stpRate,
            category_distribution = categoryDist,
            recent_evaluations = recentEvals.Select(ToEvaluationResponse)
        });
    }
    
    // Risk Bands CRUD
    [HttpGet("risk-bands")]
    public async Task<IActionResult> GetRiskBands([FromQuery] string? category)
    {
        var query = _context.RiskBands.OrderBy(r => r.Category).ThenBy(r => r.Priority);
        if (!string.IsNullOrEmpty(category))
            query = (IOrderedQueryable<RiskBand>)query.Where(r => r.Category == category);
        
        var bands = await query.ToListAsync();
        return Ok(bands.Select(ToRiskBandResponse));
    }
    
    [HttpGet("risk-bands/{id}")]
    public async Task<IActionResult> GetRiskBand(string id)
    {
        var band = await _context.RiskBands.FindAsync(id);
        if (band == null) return NotFound(new { detail = "Risk band not found" });
        return Ok(ToRiskBandResponse(band));
    }
    
    [HttpPost("risk-bands")]
    public async Task<IActionResult> CreateRiskBand([FromBody] RiskBandCreateDto dto)
    {
        var band = new RiskBand
        {
            Name = dto.Name,
            Description = dto.Description,
            Category = dto.Category,
            Condition = dto.Condition,
            LoadingPercentage = dto.LoadingPercentage,
            RiskScore = dto.RiskScore,
            Products = dto.Products,
            Priority = dto.Priority,
            IsEnabled = dto.IsEnabled
        };
        
        _context.RiskBands.Add(band);
        await _context.SaveChangesAsync();
        await LogAudit("CREATE", "risk_band", band.Id, band.Name);
        
        return Ok(ToRiskBandResponse(band));
    }
    
    [HttpPut("risk-bands/{id}")]
    public async Task<IActionResult> UpdateRiskBand(string id, [FromBody] RiskBandCreateDto dto)
    {
        var band = await _context.RiskBands.FindAsync(id);
        if (band == null) return NotFound(new { detail = "Risk band not found" });
        
        band.Name = dto.Name;
        band.Description = dto.Description;
        band.Category = dto.Category;
        band.Condition = dto.Condition;
        band.LoadingPercentage = dto.LoadingPercentage;
        band.RiskScore = dto.RiskScore;
        band.Products = dto.Products;
        band.Priority = dto.Priority;
        band.IsEnabled = dto.IsEnabled;
        band.UpdatedAt = DateTime.UtcNow.ToString("o");
        
        await _context.SaveChangesAsync();
        await LogAudit("UPDATE", "risk_band", band.Id, band.Name);
        
        return Ok(ToRiskBandResponse(band));
    }
    
    [HttpDelete("risk-bands/{id}")]
    public async Task<IActionResult> DeleteRiskBand(string id)
    {
        var band = await _context.RiskBands.FindAsync(id);
        if (band == null) return NotFound(new { detail = "Risk band not found" });
        
        _context.RiskBands.Remove(band);
        await _context.SaveChangesAsync();
        await LogAudit("DELETE", "risk_band", id, band.Name);
        
        return Ok(new { message = "Risk band deleted successfully" });
    }
    
    [HttpPatch("risk-bands/{id}/toggle")]
    public async Task<IActionResult> ToggleRiskBand(string id)
    {
        var band = await _context.RiskBands.FindAsync(id);
        if (band == null) return NotFound(new { detail = "Risk band not found" });
        
        band.IsEnabled = !band.IsEnabled;
        band.UpdatedAt = DateTime.UtcNow.ToString("o");
        await _context.SaveChangesAsync();
        await LogAudit("TOGGLE", "risk_band", band.Id, band.Name);
        
        return Ok(new { id, is_enabled = band.IsEnabled });
    }
    
    private RiskLoadingResult CalculateRiskLoading(ProposalData proposal)
    {
        var bands = _context.RiskBands.Where(b => b.IsEnabled).OrderBy(b => b.Priority).ToList();
        var proposalDict = GetProposalDict(proposal);
        
        var totalRiskScore = 0;
        var totalLoadingPercentage = 0.0;
        var appliedBands = new List<AppliedRiskBand>();
        
        foreach (var band in bands)
        {
            if (band.Products.Any() && !band.Products.Contains(proposal.ProductType))
                continue;
            
            var condition = band.Condition;
            var fieldValue = GetFieldValue(proposalDict, condition.Field);
            
            if (fieldValue == null && condition.Operator != "is_empty" && condition.Operator != "is_not_empty")
                continue;
            
            var triggered = EvaluateCondition(fieldValue, condition.Operator, condition.Value, condition.Value2);
            
            if (triggered)
            {
                totalRiskScore += band.RiskScore;
                totalLoadingPercentage += band.LoadingPercentage;
                appliedBands.Add(new AppliedRiskBand
                {
                    BandId = band.Id,
                    BandName = band.Name,
                    Category = band.Category,
                    LoadingPercentage = band.LoadingPercentage,
                    RiskScore = band.RiskScore,
                    ConditionField = condition.Field,
                    FieldValue = fieldValue
                });
            }
        }
        
        var basePremium = proposal.Premium;
        var loadedPremium = basePremium * (1 + totalLoadingPercentage / 100);
        
        return new RiskLoadingResult
        {
            TotalRiskScore = totalRiskScore,
            TotalLoadingPercentage = Math.Round(totalLoadingPercentage, 2),
            BasePremium = basePremium,
            LoadedPremium = Math.Round(loadedPremium, 2),
            AppliedBands = appliedBands
        };
    }
    
    private Dictionary<string, object?> GetProposalDict(ProposalData proposal)
    {
        return new Dictionary<string, object?>
        {
            ["proposal_id"] = proposal.ProposalId,
            ["product_code"] = proposal.ProductCode,
            ["product_type"] = proposal.ProductType,
            ["applicant_age"] = proposal.ApplicantAge,
            ["applicant_gender"] = proposal.ApplicantGender,
            ["applicant_income"] = proposal.ApplicantIncome,
            ["sum_assured"] = proposal.SumAssured,
            ["premium"] = proposal.Premium,
            ["bmi"] = proposal.Bmi,
            ["occupation_code"] = proposal.OccupationCode,
            ["occupation_risk"] = proposal.OccupationRisk,
            ["agent_code"] = proposal.AgentCode,
            ["agent_tier"] = proposal.AgentTier,
            ["pincode"] = proposal.Pincode,
            ["is_smoker"] = proposal.IsSmoker,
            ["has_medical_history"] = proposal.HasMedicalHistory,
            ["existing_coverage"] = proposal.ExistingCoverage,
            ["cigarettes_per_day"] = proposal.CigarettesPerDay,
            ["smoking_years"] = proposal.SmokingYears,
            ["ailment_type"] = proposal.AilmentType,
            ["ailment_details"] = proposal.AilmentDetails,
            ["ailment_duration_years"] = proposal.AilmentDurationYears,
            ["is_ailment_ongoing"] = proposal.IsAilmentOngoing
        };
    }
    
    private object? GetFieldValue(Dictionary<string, object?> data, string field)
    {
        return data.TryGetValue(field, out var value) ? value : null;
    }
    
    private bool EvaluateCondition(object? fieldValue, string op, object? value, object? value2)
    {
        try
        {
            return op switch
            {
                "equals" => fieldValue?.ToString() == value?.ToString(),
                "not_equals" => fieldValue?.ToString() != value?.ToString(),
                "greater_than" => Convert.ToDouble(fieldValue) > Convert.ToDouble(value),
                "less_than" => Convert.ToDouble(fieldValue) < Convert.ToDouble(value),
                "greater_than_or_equal" => Convert.ToDouble(fieldValue) >= Convert.ToDouble(value),
                "less_than_or_equal" => Convert.ToDouble(fieldValue) <= Convert.ToDouble(value),
                "between" => Convert.ToDouble(fieldValue) >= Convert.ToDouble(value) && Convert.ToDouble(fieldValue) <= Convert.ToDouble(value2),
                "in_list" or "in" => value is JsonElement je && je.ValueKind == JsonValueKind.Array 
                    ? je.EnumerateArray().Any(x => x.ToString() == fieldValue?.ToString())
                    : fieldValue?.ToString() == value?.ToString(),
                _ => false
            };
        }
        catch
        {
            return false;
        }
    }
    
    private static object ToRiskBandResponse(RiskBand b) => new
    {
        id = b.Id,
        name = b.Name,
        description = b.Description,
        category = b.Category,
        condition = b.Condition,
        loading_percentage = b.LoadingPercentage,
        risk_score = b.RiskScore,
        products = b.Products,
        priority = b.Priority,
        is_enabled = b.IsEnabled,
        created_at = b.CreatedAt,
        updated_at = b.UpdatedAt
    };
    
    // Seed Data
    [HttpPost("seed")]
    public async Task<IActionResult> SeedData()
    {
        // Clear existing data
        _context.Rules.RemoveRange(_context.Rules);
        _context.RuleStages.RemoveRange(_context.RuleStages);
        _context.RiskBands.RemoveRange(_context.RiskBands);
        _context.Scorecards.RemoveRange(_context.Scorecards);
        _context.Grids.RemoveRange(_context.Grids);
        _context.Products.RemoveRange(_context.Products);
        await _context.SaveChangesAsync();
        
        // Add stages
        var stage1 = new RuleStage { Name = "1. Data Validation", Description = "Validate input data completeness and basic eligibility", ExecutionOrder = 1, StopOnFail = true, Color = "amber" };
        var stage2 = new RuleStage { Name = "2. Risk Assessment", Description = "Evaluate risk factors and STP eligibility", ExecutionOrder = 2, StopOnFail = false, Color = "blue" };
        var stage3 = new RuleStage { Name = "3. Case Classification", Description = "Determine case type and routing", ExecutionOrder = 3, StopOnFail = false, Color = "purple" };
        var stage4 = new RuleStage { Name = "4. Scoring", Description = "Calculate scorecard values", ExecutionOrder = 4, StopOnFail = false, Color = "emerald" };
        
        _context.RuleStages.AddRange(stage1, stage2, stage3, stage4);
        await _context.SaveChangesAsync();
        
        // Add products
        var products = new[]
        {
            new Product { Code = "TERM001", Name = "Term Life Protect", ProductType = "term_life", Description = "Pure term life insurance", MinAge = 18, MaxAge = 65, MinSumAssured = 500000, MaxSumAssured = 50000000, MinPremium = 5000 },
            new Product { Code = "ENDOW001", Name = "Endowment Savings Plan", ProductType = "endowment", Description = "Endowment plan with maturity benefit", MinAge = 18, MaxAge = 55, MinSumAssured = 100000, MaxSumAssured = 10000000, MinPremium = 10000 },
            new Product { Code = "ULIP001", Name = "ULIP Growth Fund", ProductType = "ulip", Description = "Unit linked insurance plan", MinAge = 18, MaxAge = 60, MinSumAssured = 250000, MaxSumAssured = 25000000, MinPremium = 25000 }
        };
        _context.Products.AddRange(products);
        
        // Add validation rules with stage assignment
        var rules = new List<Rule>
        {
            CreateRuleJsonWithStage("Missing Income Validation", "validation", stage1.Id, @"{""logical_operator"":""OR"",""conditions"":[{""field"":""applicant_income"",""operator"":""is_empty"",""value"":null},{""field"":""applicant_income"",""operator"":""less_than_or_equal"",""value"":0}],""is_negated"":false}", @"{""decision"":""FAIL"",""reason_code"":""VAL001"",""reason_message"":""Applicant income is missing or invalid"",""is_hard_stop"":true}", 10),
            CreateRuleJsonWithStage("Missing Premium Validation", "validation", stage1.Id, @"{""logical_operator"":""OR"",""conditions"":[{""field"":""premium"",""operator"":""is_empty"",""value"":null},{""field"":""premium"",""operator"":""less_than_or_equal"",""value"":0}],""is_negated"":false}", @"{""decision"":""FAIL"",""reason_code"":""VAL002"",""reason_message"":""Premium amount is missing or invalid"",""is_hard_stop"":true}", 10),
            CreateRuleJsonWithStage("Age Eligibility Check", "validation", stage1.Id, @"{""logical_operator"":""OR"",""conditions"":[{""field"":""applicant_age"",""operator"":""less_than"",""value"":18},{""field"":""applicant_age"",""operator"":""greater_than"",""value"":70}],""is_negated"":false}", @"{""decision"":""FAIL"",""reason_code"":""VAL003"",""reason_message"":""Applicant age must be between 18 and 70 years"",""is_hard_stop"":true}", 10),
            CreateRuleJsonWithStage("High Sum Assured Check", "stp_decision", stage2.Id, @"{""logical_operator"":""AND"",""conditions"":[{""field"":""sum_assured"",""operator"":""greater_than"",""value"":10000000}],""is_negated"":false}", @"{""decision"":""FAIL"",""reason_code"":""STP001"",""reason_message"":""Sum assured exceeds STP limit - Medical required"",""is_hard_stop"":false}", 20),
            CreateRuleJsonWithStage("Smoker High Risk", "stp_decision", stage2.Id, @"{""logical_operator"":""AND"",""conditions"":[{""field"":""is_smoker"",""operator"":""equals"",""value"":true},{""field"":""sum_assured"",""operator"":""greater_than"",""value"":5000000}],""is_negated"":false}", @"{""decision"":""FAIL"",""reason_code"":""STP002"",""reason_message"":""Smoker with high coverage - Additional underwriting required"",""is_hard_stop"":false}", 25),
            CreateRuleJsonWithStage("Medical History Check", "stp_decision", stage2.Id, @"{""logical_operator"":""AND"",""conditions"":[{""field"":""has_medical_history"",""operator"":""equals"",""value"":true}],""is_negated"":false}", @"{""decision"":""FAIL"",""reason_code"":""STP003"",""reason_message"":""Medical history present - Underwriter review required"",""is_hard_stop"":false}", 30),
            CreateRuleJsonWithStage("Heavy Smoker Check", "stp_decision", stage2.Id, @"{""logical_operator"":""AND"",""conditions"":[{""field"":""is_smoker"",""operator"":""equals"",""value"":true},{""field"":""cigarettes_per_day"",""operator"":""greater_than"",""value"":20}],""is_negated"":false}", @"{""decision"":""FAIL"",""reason_code"":""SMK001"",""reason_message"":""Heavy smoker (>20/day) - Medical examination required"",""is_hard_stop"":false}", 26),
            CreateRuleJsonWithStage("Long-term Smoker Penalty", "scorecard", stage4.Id, @"{""logical_operator"":""AND"",""conditions"":[{""field"":""is_smoker"",""operator"":""equals"",""value"":true},{""field"":""smoking_years"",""operator"":""greater_than"",""value"":10}],""is_negated"":false}", @"{""score_impact"":-25,""reason_code"":""SMK002"",""reason_message"":""Long-term smoker penalty (>10 years)""}", 101),
            CreateRuleJsonWithStage("Diabetes Management Check", "case_type", stage3.Id, @"{""logical_operator"":""AND"",""conditions"":[{""field"":""has_medical_history"",""operator"":""equals"",""value"":true},{""field"":""ailment_type"",""operator"":""equals"",""value"":""diabetes""},{""field"":""is_ailment_ongoing"",""operator"":""equals"",""value"":true}],""is_negated"":false}", @"{""case_type"":3,""reason_code"":""MED003"",""reason_message"":""Diabetes case - Refer to GCRP with medical reports""}", 55),
            CreateRuleJsonWithStage("Low Risk Direct Accept", "case_type", stage3.Id, @"{""logical_operator"":""AND"",""conditions"":[{""field"":""applicant_age"",""operator"":""between"",""value"":25,""value2"":45},{""field"":""is_smoker"",""operator"":""equals"",""value"":false},{""field"":""has_medical_history"",""operator"":""equals"",""value"":false},{""field"":""sum_assured"",""operator"":""less_than_or_equal"",""value"":5000000}],""is_negated"":false}", @"{""case_type"":1,""reason_code"":""CT001"",""reason_message"":""Low risk profile - Direct Accept""}", 50),
            CreateRuleJsonWithStage("GCRP Referral", "case_type", stage3.Id, @"{""logical_operator"":""OR"",""conditions"":[{""field"":""occupation_risk"",""operator"":""equals"",""value"":""high""},{""field"":""applicant_age"",""operator"":""greater_than"",""value"":55}],""is_negated"":false}", @"{""case_type"":3,""reason_code"":""CT002"",""reason_message"":""Referred to GCRP for additional review""}", 60),
            CreateRuleJsonWithStage("Age Score - Young Adult Bonus", "scorecard", stage4.Id, @"{""logical_operator"":""AND"",""conditions"":[{""field"":""applicant_age"",""operator"":""between"",""value"":25,""value2"":35}],""is_negated"":false}", @"{""score_impact"":15,""reason_code"":""SC001"",""reason_message"":""Age bonus: 25-35 years""}", 100),
            CreateRuleJsonWithStage("Non-Smoker Bonus", "scorecard", stage4.Id, @"{""logical_operator"":""AND"",""conditions"":[{""field"":""is_smoker"",""operator"":""equals"",""value"":false}],""is_negated"":false}", @"{""score_impact"":20,""reason_code"":""SC002"",""reason_message"":""Non-smoker bonus""}", 100)
        };
        _context.Rules.AddRange(rules);
        
        // Add Risk Bands
        var riskBands = new List<RiskBand>
        {
            new RiskBand { Name = "Young Adult (18-25)", Category = "age", ConditionJson = @"{""field"":""applicant_age"",""operator"":""between"",""value"":18,""value2"":25}", LoadingPercentage = -5, RiskScore = -10, ProductsJson = @"[""term_pure"",""term_returns"",""term_life""]", Priority = 10 },
            new RiskBand { Name = "Prime Age (26-40)", Category = "age", ConditionJson = @"{""field"":""applicant_age"",""operator"":""between"",""value"":26,""value2"":40}", LoadingPercentage = 0, RiskScore = 0, ProductsJson = @"[""term_pure"",""term_returns"",""term_life""]", Priority = 10 },
            new RiskBand { Name = "Middle Age (41-50)", Category = "age", ConditionJson = @"{""field"":""applicant_age"",""operator"":""between"",""value"":41,""value2"":50}", LoadingPercentage = 15, RiskScore = 15, ProductsJson = @"[""term_pure"",""term_returns"",""term_life""]", Priority = 10 },
            new RiskBand { Name = "Senior (51-60)", Category = "age", ConditionJson = @"{""field"":""applicant_age"",""operator"":""between"",""value"":51,""value2"":60}", LoadingPercentage = 35, RiskScore = 30, ProductsJson = @"[""term_pure"",""term_returns"",""term_life""]", Priority = 10 },
            new RiskBand { Name = "Elder (60+)", Category = "age", ConditionJson = @"{""field"":""applicant_age"",""operator"":""greater_than"",""value"":60}", LoadingPercentage = 75, RiskScore = 50, ProductsJson = @"[""term_pure"",""term_life""]", Priority = 10 },
            new RiskBand { Name = "Smoker Base Loading", Category = "smoking", ConditionJson = @"{""field"":""is_smoker"",""operator"":""equals"",""value"":true}", LoadingPercentage = 25, RiskScore = 25, ProductsJson = @"[""term_pure"",""term_returns"",""term_life"",""endowment""]", Priority = 20 },
            new RiskBand { Name = "Heavy Smoker (>20/day)", Category = "smoking", ConditionJson = @"{""field"":""cigarettes_per_day"",""operator"":""greater_than"",""value"":20}", LoadingPercentage = 30, RiskScore = 35, ProductsJson = @"[""term_pure"",""term_returns"",""term_life""]", Priority = 21 },
            new RiskBand { Name = "Long-term Smoker (>10 years)", Category = "smoking", ConditionJson = @"{""field"":""smoking_years"",""operator"":""greater_than"",""value"":10}", LoadingPercentage = 20, RiskScore = 20, ProductsJson = @"[""term_pure"",""term_returns"",""term_life""]", Priority = 22 },
            new RiskBand { Name = "Diabetes - Ongoing", Category = "medical", ConditionJson = @"{""field"":""ailment_type"",""operator"":""equals"",""value"":""diabetes""}", LoadingPercentage = 40, RiskScore = 40, ProductsJson = @"[""term_pure"",""term_returns"",""term_life"",""endowment""]", Priority = 30 },
            new RiskBand { Name = "Hypertension", Category = "medical", ConditionJson = @"{""field"":""ailment_type"",""operator"":""equals"",""value"":""hypertension""}", LoadingPercentage = 30, RiskScore = 30, ProductsJson = @"[""term_pure"",""term_returns"",""term_life"",""endowment""]", Priority = 30 },
            new RiskBand { Name = "Underweight (BMI < 18.5)", Category = "bmi", ConditionJson = @"{""field"":""bmi"",""operator"":""less_than"",""value"":18.5}", LoadingPercentage = 10, RiskScore = 10, ProductsJson = @"[""term_pure"",""term_returns"",""term_life""]", Priority = 40 },
            new RiskBand { Name = "Overweight (BMI 25-30)", Category = "bmi", ConditionJson = @"{""field"":""bmi"",""operator"":""between"",""value"":25,""value2"":30}", LoadingPercentage = 10, RiskScore = 10, ProductsJson = @"[""term_pure"",""term_returns"",""term_life""]", Priority = 40 },
            new RiskBand { Name = "Obese (BMI > 30)", Category = "bmi", ConditionJson = @"{""field"":""bmi"",""operator"":""greater_than"",""value"":30}", LoadingPercentage = 25, RiskScore = 25, ProductsJson = @"[""term_pure"",""term_returns"",""term_life""]", Priority = 40 },
            new RiskBand { Name = "High Risk Occupation", Category = "occupation", ConditionJson = @"{""field"":""occupation_risk"",""operator"":""equals"",""value"":""high""}", LoadingPercentage = 50, RiskScore = 40, ProductsJson = @"[""term_pure"",""term_returns"",""term_life""]", Priority = 50 }
        };
        _context.RiskBands.AddRange(riskBands);
        
        await _context.SaveChangesAsync();
        
        return Ok(new { message = "Sample data seeded successfully", products = products.Length, rules = rules.Count, stages = 4, risk_bands = riskBands.Count, scorecards = 0, grids = 0 });
    }
    
    // Helper methods
    private Rule CreateRuleJsonWithStage(string name, string category, string? stageId, string conditionGroupJson, string actionJson, int priority)
    {
        return new Rule
        {
            Name = name,
            Category = category,
            StageId = stageId,
            ConditionGroupJson = conditionGroupJson,
            ActionJson = actionJson,
            Priority = priority,
            ProductsJson = @"[""term_life"",""endowment"",""ulip""]"
        };
    }
    
    private Rule CreateRuleJson(string name, string category, string conditionGroupJson, string actionJson, int priority)
    {
        return CreateRuleJsonWithStage(name, category, null, conditionGroupJson, actionJson, priority);
    }
    
    private async Task LogAudit(string action, string entityType, string entityId, string entityName, object? changes = null)
    {
        var log = new AuditLog
        {
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            EntityName = entityName,
            ChangesJson = changes != null ? JsonSerializer.Serialize(changes) : "{}"
        };
        _context.AuditLogs.Add(log);
        await _context.SaveChangesAsync();
    }
    
    private object ToRuleResponse(Rule r)
    {
        var stageName = r.StageId != null 
            ? _context.RuleStages.FirstOrDefault(s => s.Id == r.StageId)?.Name 
            : null;
        
        return new
        {
            id = r.Id,
            name = r.Name,
            description = r.Description,
            category = r.Category,
            stage_id = r.StageId,
            stage_name = stageName,
            condition_group = JsonSerializer.Deserialize<object>(r.ConditionGroupJson),
            action = JsonSerializer.Deserialize<object>(r.ActionJson),
            priority = r.Priority,
            is_enabled = r.IsEnabled,
            effective_from = r.EffectiveFrom,
            effective_to = r.EffectiveTo,
            products = r.Products,
            case_types = r.CaseTypes,
            version = r.Version,
            created_at = r.CreatedAt,
            updated_at = r.UpdatedAt
        };
    }
    
    private static object ToScorecardResponse(Scorecard s) => new
    {
        id = s.Id,
        name = s.Name,
        description = s.Description,
        product = s.Product,
        parameters = s.Parameters,
        threshold_direct_accept = s.ThresholdDirectAccept,
        threshold_normal = s.ThresholdNormal,
        threshold_refer = s.ThresholdRefer,
        is_enabled = s.IsEnabled,
        created_at = s.CreatedAt,
        updated_at = s.UpdatedAt
    };
    
    private static object ToGridResponse(Grid g) => new
    {
        id = g.Id,
        name = g.Name,
        description = g.Description,
        grid_type = g.GridType,
        row_field = g.RowField,
        col_field = g.ColField,
        row_labels = g.RowLabels,
        col_labels = g.ColLabels,
        cells = g.Cells,
        products = g.Products,
        is_enabled = g.IsEnabled,
        created_at = g.CreatedAt,
        updated_at = g.UpdatedAt
    };
    
    private static object ToProductResponse(Product p) => new
    {
        id = p.Id,
        code = p.Code,
        name = p.Name,
        product_type = p.ProductType,
        description = p.Description,
        min_age = p.MinAge,
        max_age = p.MaxAge,
        min_sum_assured = p.MinSumAssured,
        max_sum_assured = p.MaxSumAssured,
        min_premium = p.MinPremium,
        is_enabled = p.IsEnabled,
        created_at = p.CreatedAt
    };
    
    private static object ToEvaluationResponse(Evaluation e) => new
    {
        id = e.Id,
        proposal_id = e.ProposalId,
        stp_decision = e.StpDecision,
        case_type = e.CaseTypeValue,
        case_type_label = e.CaseTypeLabel,
        reason_flag = e.ReasonFlag,
        scorecard_value = e.ScorecardValue,
        triggered_rules = JsonSerializer.Deserialize<List<string>>(e.TriggeredRulesJson),
        validation_errors = JsonSerializer.Deserialize<List<string>>(e.ValidationErrorsJson),
        reason_codes = JsonSerializer.Deserialize<List<string>>(e.ReasonCodesJson),
        reason_messages = JsonSerializer.Deserialize<List<string>>(e.ReasonMessagesJson),
        rule_trace = JsonSerializer.Deserialize<List<object>>(e.RuleTraceJson),
        evaluation_time_ms = e.EvaluationTimeMs,
        evaluated_at = e.EvaluatedAt
    };
    
    private static object ToAuditLogResponse(AuditLog a) => new
    {
        id = a.Id,
        action = a.Action,
        entity_type = a.EntityType,
        entity_id = a.EntityId,
        entity_name = a.EntityName,
        changes = JsonSerializer.Deserialize<object>(a.ChangesJson),
        performed_by = a.PerformedBy,
        performed_at = a.PerformedAt
    };
    
    private static object ToStageResponse(RuleStage s, int ruleCount) => new
    {
        id = s.Id,
        name = s.Name,
        description = s.Description,
        execution_order = s.ExecutionOrder,
        stop_on_fail = s.StopOnFail,
        color = s.Color,
        is_enabled = s.IsEnabled,
        rule_count = ruleCount,
        created_at = s.CreatedAt,
        updated_at = s.UpdatedAt
    };
}
