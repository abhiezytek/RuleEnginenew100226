using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using InsuranceSTP.Data;
using InsuranceSTP.Models;

namespace InsuranceSTP.Controllers;

[ApiController]
[Route("api/templates")]
public class TemplatesController : ControllerBase
{
    private readonly AppDbContext _context;
    
    public TemplatesController(AppDbContext context)
    {
        _context = context;
    }
    
    private bool HasPermission(string permission)
    {
        var role = User.FindFirst("role")?.Value ?? "";
        return Permissions.HasPermission(role, permission);
    }
    
    [HttpGet]
    public IActionResult GetTemplates([FromQuery] string? category = null, [FromQuery] string? search = null)
    {
        var query = _context.RuleTemplates.Where(t => t.IsActive);
        
        if (!string.IsNullOrEmpty(category))
        {
            query = query.Where(t => t.Category == category);
        }
        
        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(t => 
                t.Name.Contains(search) || 
                t.TemplateId.Contains(search) || 
                (t.Description != null && t.Description.Contains(search)));
        }
        
        var templates = query.OrderBy(t => t.Priority).ToList();
        return Ok(templates.Select(MapTemplateToResponse));
    }
    
    [HttpGet("{templateId}")]
    public IActionResult GetTemplate(string templateId)
    {
        var template = _context.RuleTemplates
            .FirstOrDefault(t => t.Id == templateId || t.TemplateId == templateId);
        
        if (template == null)
        {
            return NotFound(new { detail = "Template not found" });
        }
        
        return Ok(MapTemplateToResponse(template));
    }
    
    [HttpPost("{templateId}/create-rule")]
    [Authorize]
    public IActionResult CreateRuleFromTemplate(string templateId, [FromQuery] string? stage_id = null)
    {
        if (!HasPermission(Permissions.CanCreateRules))
        {
            return Forbid();
        }
        
        var template = _context.RuleTemplates
            .FirstOrDefault(t => t.Id == templateId || t.TemplateId == templateId);
        
        if (template == null)
        {
            return NotFound(new { detail = "Template not found" });
        }
        
        // Create rule from template
        var rule = new Rule
        {
            Name = template.Name,
            Description = template.Description,
            Category = template.Category,
            StageId = stage_id,
            ConditionGroupJson = template.ConditionGroupJson,
            ActionJson = template.ActionJson,
            Priority = template.Priority,
            IsEnabled = true,
            ProductsJson = template.ProductsJson
        };
        
        _context.Rules.Add(rule);
        _context.SaveChanges();
        
        // Log audit
        var log = new AuditLog
        {
            Action = "CREATE_FROM_TEMPLATE",
            EntityType = "rule",
            EntityId = rule.Id,
            EntityName = rule.Name,
            ChangesJson = $"{{\"template_id\":\"{template.TemplateId}\"}}" ,
            PerformedBy = User.FindFirst("sub")?.Value ?? "system"
        };
        _context.AuditLogs.Add(log);
        _context.SaveChanges();
        
        // Return the created rule
        var stage = rule.StageId != null ? _context.RuleStages.Find(rule.StageId) : null;
        
        return Ok(new RuleResponseDto
        {
            Id = rule.Id,
            Name = rule.Name,
            Description = rule.Description,
            Category = rule.Category,
            StageId = rule.StageId,
            StageName = stage?.Name,
            ConditionGroup = rule.ConditionGroup,
            Action = rule.Action,
            Priority = rule.Priority,
            IsEnabled = rule.IsEnabled,
            EffectiveFrom = rule.EffectiveFrom,
            EffectiveTo = rule.EffectiveTo,
            Products = rule.Products,
            CaseTypes = rule.CaseTypes,
            Version = rule.Version,
            CreatedAt = rule.CreatedAt,
            UpdatedAt = rule.UpdatedAt
        });
    }
    
    [HttpGet("categories/list")]
    public IActionResult GetCategories()
    {
        return Ok(new Dictionary<string, List<string>>
        {
            ["identity"] = new() { "STP001" },
            ["income"] = new() { "STP003", "STP019F", "STP020A", "STP020B", "STP020C", "STP020D" },
            ["avocation"] = new() { "STP004" },
            ["build"] = new() { "STP005A", "STP005B", "STP005C", "STP005G", "STP005H", "STP013" },
            ["education"] = new() { "STP006" },
            ["habits"] = new() { "STP008A", "STP008C", "STP008E" },
            ["health"] = new() { "STP009", "STP028", "STP035" },
            ["nominee"] = new() { "STP014" },
            ["occupation"] = new() { "STP015A", "STP015B", "STP015C" },
            ["location"] = new() { "STP017" },
            ["age"] = new() { "STP018M", "STP018N" },
            ["compliance"] = new() { "STP019E", "STP025A", "STP031A", "STP031B", "STP031C" }
        });
    }
    
    private static RuleTemplateResponse MapTemplateToResponse(RuleTemplate template)
    {
        return new RuleTemplateResponse
        {
            Id = template.Id,
            TemplateId = template.TemplateId,
            Name = template.Name,
            Description = template.Description,
            Category = template.Category,
            ConditionGroup = template.ConditionGroup,
            Action = template.Action,
            LetterFlag = template.LetterFlag,
            FollowUpCode = template.FollowUpCode,
            Priority = template.Priority,
            Products = template.Products,
            IsActive = template.IsActive,
            CreatedAt = template.CreatedAt
        };
    }
}
