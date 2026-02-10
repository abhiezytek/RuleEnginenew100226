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
        
        var rules = await _context.Rules.Where(r => r.IsEnabled).OrderBy(r => r.Priority).ToListAsync();
        
        // Phase 1: Validation Rules
        foreach (var rule in rules.Where(r => r.Category == "validation"))
        {
            var ruleStopwatch = Stopwatch.StartNew();
            
            if (!_ruleEngine.IsRuleApplicable(rule, proposal.ProductType, caseType))
                continue;
            
            var conditionJson = JsonDocument.Parse(rule.ConditionGroupJson).RootElement;
            var triggered = _ruleEngine.EvaluateConditionGroup(conditionJson, proposalDict);
            
            ruleTrace.Add(new RuleExecutionTrace
            {
                RuleId = rule.Id,
                RuleName = rule.Name,
                Category = rule.Category,
                Triggered = triggered,
                ConditionResult = triggered,
                ActionApplied = triggered ? rule.Action : null,
                ExecutionTimeMs = ruleStopwatch.Elapsed.TotalMilliseconds
            });
            
            if (triggered)
            {
                var action = rule.Action;
                if (!string.IsNullOrEmpty(action.ReasonMessage))
                    validationErrors.Add(action.ReasonMessage);
                if (!string.IsNullOrEmpty(action.ReasonCode))
                    reasonCodes.Add(action.ReasonCode);
                triggeredRules.Add(rule.Name);
                
                if (action.IsHardStop)
                {
                    stpDecision = "FAIL";
                    caseType = -1;
                    reasonFlag = 1;
                }
            }
        }
        
        // Phase 2: STP Decision Rules
        if (stpDecision == "PASS")
        {
            foreach (var rule in rules.Where(r => r.Category == "stp_decision"))
            {
                var ruleStopwatch = Stopwatch.StartNew();
                
                if (!_ruleEngine.IsRuleApplicable(rule, proposal.ProductType, caseType))
                    continue;
                
                var conditionJson = JsonDocument.Parse(rule.ConditionGroupJson).RootElement;
                var triggered = _ruleEngine.EvaluateConditionGroup(conditionJson, proposalDict);
                
                ruleTrace.Add(new RuleExecutionTrace
                {
                    RuleId = rule.Id,
                    RuleName = rule.Name,
                    Category = rule.Category,
                    Triggered = triggered,
                    ConditionResult = triggered,
                    ActionApplied = triggered ? rule.Action : null,
                    ExecutionTimeMs = ruleStopwatch.Elapsed.TotalMilliseconds
                });
                
                if (triggered)
                {
                    var action = rule.Action;
                    triggeredRules.Add(rule.Name);
                    
                    if (action.Decision == "FAIL")
                    {
                        stpDecision = "FAIL";
                        reasonFlag = 1;
                    }
                    
                    if (!string.IsNullOrEmpty(action.ReasonCode))
                        reasonCodes.Add(action.ReasonCode);
                    if (!string.IsNullOrEmpty(action.ReasonMessage))
                        reasonMessages.Add(action.ReasonMessage);
                    
                    if (action.IsHardStop)
                    {
                        caseType = -1;
                        break;
                    }
                }
            }
        }
        
        // Phase 3: Case Type Rules
        foreach (var rule in rules.Where(r => r.Category == "case_type"))
        {
            var ruleStopwatch = Stopwatch.StartNew();
            
            if (!_ruleEngine.IsRuleApplicable(rule, proposal.ProductType, caseType))
                continue;
            
            var conditionJson = JsonDocument.Parse(rule.ConditionGroupJson).RootElement;
            var triggered = _ruleEngine.EvaluateConditionGroup(conditionJson, proposalDict);
            
            ruleTrace.Add(new RuleExecutionTrace
            {
                RuleId = rule.Id,
                RuleName = rule.Name,
                Category = rule.Category,
                Triggered = triggered,
                ConditionResult = triggered,
                ActionApplied = triggered ? rule.Action : null,
                ExecutionTimeMs = ruleStopwatch.Elapsed.TotalMilliseconds
            });
            
            if (triggered)
            {
                var action = rule.Action;
                triggeredRules.Add(rule.Name);
                
                if (action.CaseType.HasValue)
                    caseType = action.CaseType.Value;
                
                if (!string.IsNullOrEmpty(action.ReasonCode))
                    reasonCodes.Add(action.ReasonCode);
                if (!string.IsNullOrEmpty(action.ReasonMessage))
                    reasonMessages.Add(action.ReasonMessage);
            }
        }
        
        stopwatch.Stop();
        
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
            total_evaluations = totalEvaluations,
            stp_pass = stpPass,
            stp_fail = stpFail,
            stp_rate = stpRate,
            category_distribution = categoryDist,
            recent_evaluations = recentEvals.Select(ToEvaluationResponse)
        });
    }
    
    // Seed Data
    [HttpPost("seed")]
    public async Task<IActionResult> SeedData()
    {
        // Clear existing data
        _context.Rules.RemoveRange(_context.Rules);
        _context.Scorecards.RemoveRange(_context.Scorecards);
        _context.Grids.RemoveRange(_context.Grids);
        _context.Products.RemoveRange(_context.Products);
        await _context.SaveChangesAsync();
        
        // Add products
        var products = new[]
        {
            new Product { Code = "TERM001", Name = "Term Life Protect", ProductType = "term_life", Description = "Pure term life insurance", MinAge = 18, MaxAge = 65, MinSumAssured = 500000, MaxSumAssured = 50000000, MinPremium = 5000 },
            new Product { Code = "ENDOW001", Name = "Endowment Savings Plan", ProductType = "endowment", Description = "Endowment plan with maturity benefit", MinAge = 18, MaxAge = 55, MinSumAssured = 100000, MaxSumAssured = 10000000, MinPremium = 10000 },
            new Product { Code = "ULIP001", Name = "ULIP Growth Fund", ProductType = "ulip", Description = "Unit linked insurance plan", MinAge = 18, MaxAge = 60, MinSumAssured = 250000, MaxSumAssured = 25000000, MinPremium = 25000 }
        };
        _context.Products.AddRange(products);
        
        // Add validation rules using JSON strings
        var rules = new List<Rule>
        {
            CreateRuleJson("Missing Income Validation", "validation", @"{""logical_operator"":""OR"",""conditions"":[{""field"":""applicant_income"",""operator"":""is_empty"",""value"":null},{""field"":""applicant_income"",""operator"":""less_than_or_equal"",""value"":0}],""is_negated"":false}", @"{""decision"":""FAIL"",""reason_code"":""VAL001"",""reason_message"":""Applicant income is missing or invalid"",""is_hard_stop"":true}", 10),
            CreateRuleJson("Missing Premium Validation", "validation", @"{""logical_operator"":""OR"",""conditions"":[{""field"":""premium"",""operator"":""is_empty"",""value"":null},{""field"":""premium"",""operator"":""less_than_or_equal"",""value"":0}],""is_negated"":false}", @"{""decision"":""FAIL"",""reason_code"":""VAL002"",""reason_message"":""Premium amount is missing or invalid"",""is_hard_stop"":true}", 10),
            CreateRuleJson("Age Eligibility Check", "validation", @"{""logical_operator"":""OR"",""conditions"":[{""field"":""applicant_age"",""operator"":""less_than"",""value"":18},{""field"":""applicant_age"",""operator"":""greater_than"",""value"":70}],""is_negated"":false}", @"{""decision"":""FAIL"",""reason_code"":""VAL003"",""reason_message"":""Applicant age must be between 18 and 70 years"",""is_hard_stop"":true}", 10),
            CreateRuleJson("High Sum Assured Check", "stp_decision", @"{""logical_operator"":""AND"",""conditions"":[{""field"":""sum_assured"",""operator"":""greater_than"",""value"":10000000}],""is_negated"":false}", @"{""decision"":""FAIL"",""reason_code"":""STP001"",""reason_message"":""Sum assured exceeds STP limit - Medical required"",""is_hard_stop"":false}", 20),
            CreateRuleJson("Smoker High Risk", "stp_decision", @"{""logical_operator"":""AND"",""conditions"":[{""field"":""is_smoker"",""operator"":""equals"",""value"":true},{""field"":""sum_assured"",""operator"":""greater_than"",""value"":5000000}],""is_negated"":false}", @"{""decision"":""FAIL"",""reason_code"":""STP002"",""reason_message"":""Smoker with high coverage - Additional underwriting required"",""is_hard_stop"":false}", 25),
            CreateRuleJson("Medical History Check", "stp_decision", @"{""logical_operator"":""AND"",""conditions"":[{""field"":""has_medical_history"",""operator"":""equals"",""value"":true}],""is_negated"":false}", @"{""decision"":""FAIL"",""reason_code"":""STP003"",""reason_message"":""Medical history present - Underwriter review required"",""is_hard_stop"":false}", 30),
            CreateRuleJson("Low Risk Direct Accept", "case_type", @"{""logical_operator"":""AND"",""conditions"":[{""field"":""applicant_age"",""operator"":""between"",""value"":25,""value2"":45},{""field"":""is_smoker"",""operator"":""equals"",""value"":false},{""field"":""has_medical_history"",""operator"":""equals"",""value"":false},{""field"":""sum_assured"",""operator"":""less_than_or_equal"",""value"":5000000}],""is_negated"":false}", @"{""case_type"":1,""reason_code"":""CT001"",""reason_message"":""Low risk profile - Direct Accept""}", 50),
            CreateRuleJson("GCRP Referral", "case_type", @"{""logical_operator"":""OR"",""conditions"":[{""field"":""occupation_risk"",""operator"":""equals"",""value"":""high""},{""field"":""applicant_age"",""operator"":""greater_than"",""value"":55}],""is_negated"":false}", @"{""case_type"":3,""reason_code"":""CT002"",""reason_message"":""Referred to GCRP for additional review""}", 60),
            CreateRuleJson("Age Score - Young Adult Bonus", "scorecard", @"{""logical_operator"":""AND"",""conditions"":[{""field"":""applicant_age"",""operator"":""between"",""value"":25,""value2"":35}],""is_negated"":false}", @"{""score_impact"":15,""reason_code"":""SC001"",""reason_message"":""Age bonus: 25-35 years""}", 100),
            CreateRuleJson("Non-Smoker Bonus", "scorecard", @"{""logical_operator"":""AND"",""conditions"":[{""field"":""is_smoker"",""operator"":""equals"",""value"":false}],""is_negated"":false}", @"{""score_impact"":20,""reason_code"":""SC002"",""reason_message"":""Non-smoker bonus""}", 100)
        };
        _context.Rules.AddRange(rules);
        
        await _context.SaveChangesAsync();
        
        return Ok(new { message = "Sample data seeded successfully", products = products.Length, rules = rules.Count, scorecards = 0, grids = 0 });
    }
    
    // Helper methods
    private Rule CreateRuleJson(string name, string category, string conditionGroupJson, string actionJson, int priority)
    {
        return new Rule
        {
            Name = name,
            Category = category,
            ConditionGroupJson = conditionGroupJson,
            ActionJson = actionJson,
            Priority = priority,
            ProductsJson = @"[""term_life"",""endowment"",""ulip""]"
        };
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
