using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using InsuranceSTP.Data;
using InsuranceSTP.Models;
using InsuranceSTP.Services;

namespace InsuranceSTP.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IAuthService _authService;
    
    public UsersController(AppDbContext context, IAuthService authService)
    {
        _context = context;
        _authService = authService;
    }
    
    private bool HasPermission(string permission)
    {
        var role = User.FindFirst("role")?.Value ?? "";
        return Permissions.HasPermission(role, permission);
    }
    
    private string GetCurrentUserId() => User.FindFirst("userId")?.Value ?? "";
    
    [HttpGet]
    public IActionResult GetUsers()
    {
        if (!HasPermission(Permissions.CanManageUsers))
        {
            return Forbid();
        }
        
        var users = _context.Users.ToList();
        return Ok(users.Select(MapUserToResponse));
    }
    
    [HttpGet("{id}")]
    public IActionResult GetUser(string id)
    {
        if (!HasPermission(Permissions.CanManageUsers))
        {
            return Forbid();
        }
        
        var user = _context.Users.Find(id);
        if (user == null)
        {
            return NotFound(new { detail = "User not found" });
        }
        
        return Ok(MapUserToResponse(user));
    }
    
    [HttpPost]
    public IActionResult CreateUser([FromBody] UserCreateRequest request)
    {
        if (!HasPermission(Permissions.CanManageUsers))
        {
            return Forbid();
        }
        
        // Check if username or email exists
        if (_context.Users.Any(u => u.Username == request.Username || u.Email == request.Email))
        {
            return BadRequest(new { detail = "Username or email already exists" });
        }
        
        // Validate role
        if (request.Role != UserRoles.Admin && request.Role != UserRoles.Manager && request.Role != UserRoles.Viewer)
        {
            return BadRequest(new { detail = "Invalid role. Must be admin, manager, or viewer" });
        }
        
        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = _authService.HashPassword(request.Password),
            FullName = request.FullName,
            Role = request.Role,
            IsActive = true
        };
        
        _context.Users.Add(user);
        _context.SaveChanges();
        
        LogAudit("CREATE", "user", user.Id, user.Username);
        
        return Ok(MapUserToResponse(user));
    }
    
    [HttpPut("{id}")]
    public IActionResult UpdateUser(string id, [FromBody] UserUpdateRequest request)
    {
        if (!HasPermission(Permissions.CanManageUsers))
        {
            return Forbid();
        }
        
        var user = _context.Users.Find(id);
        if (user == null)
        {
            return NotFound(new { detail = "User not found" });
        }
        
        // Prevent self-deactivation
        if (id == GetCurrentUserId() && request.IsActive == false)
        {
            return BadRequest(new { detail = "Cannot deactivate your own account" });
        }
        
        if (!string.IsNullOrEmpty(request.Email))
        {
            if (_context.Users.Any(u => u.Email == request.Email && u.Id != id))
            {
                return BadRequest(new { detail = "Email already in use" });
            }
            user.Email = request.Email;
        }
        
        if (!string.IsNullOrEmpty(request.FullName))
        {
            user.FullName = request.FullName;
        }
        
        if (!string.IsNullOrEmpty(request.Role))
        {
            if (request.Role != UserRoles.Admin && request.Role != UserRoles.Manager && request.Role != UserRoles.Viewer)
            {
                return BadRequest(new { detail = "Invalid role" });
            }
            user.Role = request.Role;
        }
        
        if (request.IsActive.HasValue)
        {
            user.IsActive = request.IsActive.Value;
        }
        
        user.UpdatedAt = DateTime.UtcNow.ToString("o");
        _context.SaveChanges();
        
        LogAudit("UPDATE", "user", id, user.Username);
        
        return Ok(MapUserToResponse(user));
    }
    
    [HttpDelete("{id}")]
    public IActionResult DeleteUser(string id)
    {
        if (!HasPermission(Permissions.CanManageUsers))
        {
            return Forbid();
        }
        
        var user = _context.Users.Find(id);
        if (user == null)
        {
            return NotFound(new { detail = "User not found" });
        }
        
        // Prevent self-deletion
        if (id == GetCurrentUserId())
        {
            return BadRequest(new { detail = "Cannot delete your own account" });
        }
        
        var username = user.Username;
        _context.Users.Remove(user);
        _context.SaveChanges();
        
        LogAudit("DELETE", "user", id, username);
        
        return Ok(new { message = "User deleted successfully" });
    }
    
    [HttpPost("{id}/reset-password")]
    public IActionResult ResetPassword(string id, [FromQuery] string newPassword)
    {
        if (!HasPermission(Permissions.CanManageUsers))
        {
            return Forbid();
        }
        
        if (string.IsNullOrEmpty(newPassword) || newPassword.Length < 6)
        {
            return BadRequest(new { detail = "Password must be at least 6 characters" });
        }
        
        var user = _context.Users.Find(id);
        if (user == null)
        {
            return NotFound(new { detail = "User not found" });
        }
        
        user.PasswordHash = _authService.HashPassword(newPassword);
        user.UpdatedAt = DateTime.UtcNow.ToString("o");
        _context.SaveChanges();
        
        LogAudit("PASSWORD_RESET", "user", id, user.Username);
        
        return Ok(new { message = "Password reset successfully" });
    }
    
    private void LogAudit(string action, string entityType, string entityId, string entityName)
    {
        var log = new AuditLog
        {
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            EntityName = entityName,
            PerformedBy = User.FindFirst("sub")?.Value ?? "system"
        };
        _context.AuditLogs.Add(log);
        _context.SaveChanges();
    }
    
    private static UserResponse MapUserToResponse(User user)
    {
        return new UserResponse
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            LastLogin = user.LastLogin
        };
    }
}
