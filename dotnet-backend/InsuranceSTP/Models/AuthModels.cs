using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InsuranceSTP.Models;

// User Roles
public static class UserRoles
{
    public const string Admin = "admin";
    public const string Manager = "manager";
    public const string Viewer = "viewer";
}

// Permission definitions
public static class Permissions
{
    public const string CanCreateRules = "can_create_rules";
    public const string CanEditRules = "can_edit_rules";
    public const string CanDeleteRules = "can_delete_rules";
    public const string CanManageUsers = "can_manage_users";
    public const string CanViewRules = "can_view_rules";
    public const string CanEvaluate = "can_evaluate";
    public const string CanViewAudit = "can_view_audit";
    public const string CanSeedData = "can_seed_data";
    
    public static Dictionary<string, Dictionary<string, bool>> RolePermissions = new()
    {
        [UserRoles.Admin] = new Dictionary<string, bool>
        {
            [CanCreateRules] = true,
            [CanEditRules] = true,
            [CanDeleteRules] = true,
            [CanManageUsers] = true,
            [CanViewRules] = true,
            [CanEvaluate] = true,
            [CanViewAudit] = true,
            [CanSeedData] = true
        },
        [UserRoles.Manager] = new Dictionary<string, bool>
        {
            [CanCreateRules] = true,
            [CanEditRules] = true,
            [CanDeleteRules] = true,
            [CanManageUsers] = false,
            [CanViewRules] = true,
            [CanEvaluate] = true,
            [CanViewAudit] = true,
            [CanSeedData] = false
        },
        [UserRoles.Viewer] = new Dictionary<string, bool>
        {
            [CanCreateRules] = false,
            [CanEditRules] = false,
            [CanDeleteRules] = false,
            [CanManageUsers] = false,
            [CanViewRules] = true,
            [CanEvaluate] = true,
            [CanViewAudit] = false,
            [CanSeedData] = false
        }
    };
    
    public static bool HasPermission(string role, string permission)
    {
        if (RolePermissions.TryGetValue(role, out var perms))
        {
            return perms.TryGetValue(permission, out var hasPermission) && hasPermission;
        }
        return false;
    }
}

// User Entity Model
public class User
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    
    [Required]
    [MaxLength(100)]
    public string Username { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(255)]
    public string PasswordHash { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(255)]
    public string FullName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(50)]
    public string Role { get; set; } = UserRoles.Viewer;
    
    public bool IsActive { get; set; } = true;
    
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
    
    public string UpdatedAt { get; set; } = DateTime.UtcNow.ToString("o");
    
    public string? LastLogin { get; set; }
}

// Rule Template Entity Model
public class RuleTemplate
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    
    [Required]
    [MaxLength(50)]
    public string TemplateId { get; set; } = string.Empty; // e.g., STP001
    
    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;
    
    public string? Description { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string Category { get; set; } = "stp_decision";
    
    [Column(TypeName = "TEXT")]
    public string ConditionGroupJson { get; set; } = "{}";
    
    [Column(TypeName = "TEXT")]
    public string ActionJson { get; set; } = "{}";
    
    [MaxLength(10)]
    public string? LetterFlag { get; set; }
    
    [MaxLength(50)]
    public string? FollowUpCode { get; set; }
    
    public int Priority { get; set; } = 100;
    
    [Column(TypeName = "TEXT")]
    public string ProductsJson { get; set; } = "[]";
    
    public bool IsActive { get; set; } = true;
    
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
    
    // Navigation helpers
    [NotMapped]
    public ConditionGroup ConditionGroup
    {
        get => System.Text.Json.JsonSerializer.Deserialize<ConditionGroup>(ConditionGroupJson, JsonOptions.SnakeCase) ?? new ConditionGroup();
        set => ConditionGroupJson = System.Text.Json.JsonSerializer.Serialize(value, JsonOptions.SnakeCase);
    }
    
    [NotMapped]
    public RuleAction Action
    {
        get => System.Text.Json.JsonSerializer.Deserialize<RuleAction>(ActionJson, JsonOptions.SnakeCase) ?? new RuleAction();
        set => ActionJson = System.Text.Json.JsonSerializer.Serialize(value, JsonOptions.SnakeCase);
    }
    
    [NotMapped]
    public List<string> Products
    {
        get => System.Text.Json.JsonSerializer.Deserialize<List<string>>(ProductsJson, JsonOptions.SnakeCase) ?? new List<string>();
        set => ProductsJson = System.Text.Json.JsonSerializer.Serialize(value, JsonOptions.SnakeCase);
    }
}

// Auth DTOs
public class LoginRequest
{
    [Required]
    public string Username { get; set; } = string.Empty;
    
    [Required]
    public string Password { get; set; } = string.Empty;
}

public class LoginResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string TokenType { get; set; } = "bearer";
    public UserResponse User { get; set; } = new();
}

public class UserResponse
{
    public string Id { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
    public string? LastLogin { get; set; }
}

public class UserCreateRequest
{
    [Required]
    [MaxLength(100)]
    public string Username { get; set; } = string.Empty;
    
    [Required]
    [EmailAddress]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(255)]
    public string FullName { get; set; } = string.Empty;
    
    public string Role { get; set; } = UserRoles.Viewer;
}

public class UserUpdateRequest
{
    [EmailAddress]
    public string? Email { get; set; }
    
    public string? FullName { get; set; }
    
    public string? Role { get; set; }
    
    public bool? IsActive { get; set; }
}

public class ChangePasswordRequest
{
    [Required]
    public string CurrentPassword { get; set; } = string.Empty;
    
    [Required]
    [MinLength(6)]
    public string NewPassword { get; set; } = string.Empty;
}

// Template DTOs
public class RuleTemplateResponse
{
    public string Id { get; set; } = string.Empty;
    public string TemplateId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;
    public ConditionGroup ConditionGroup { get; set; } = new();
    public RuleAction Action { get; set; } = new();
    public string? LetterFlag { get; set; }
    public string? FollowUpCode { get; set; }
    public int Priority { get; set; }
    public List<string> Products { get; set; } = new();
    public bool IsActive { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
}

public class CreateRuleFromTemplateRequest
{
    public string? StageId { get; set; }
}
