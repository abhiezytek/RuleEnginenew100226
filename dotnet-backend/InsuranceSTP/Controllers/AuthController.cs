using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using InsuranceSTP.Data;
using InsuranceSTP.Models;
using InsuranceSTP.Services;
using System.Security.Claims;

namespace InsuranceSTP.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IAuthService _authService;
    
    public AuthController(AppDbContext context, IAuthService authService)
    {
        _context = context;
        _authService = authService;
    }
    
    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        var user = _context.Users.FirstOrDefault(u => u.Username == request.Username);
        
        if (user == null || !_authService.VerifyPassword(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { detail = "Incorrect username or password" });
        }
        
        if (!user.IsActive)
        {
            return Unauthorized(new { detail = "User account is disabled" });
        }
        
        // Update last login
        user.LastLogin = DateTime.UtcNow.ToString("o");
        _context.SaveChanges();
        
        // Generate token
        var token = _authService.GenerateJwtToken(user);
        
        return Ok(new LoginResponse
        {
            AccessToken = token,
            TokenType = "bearer",
            User = MapUserToResponse(user)
        });
    }
    
    [HttpGet("me")]
    [Authorize]
    public IActionResult GetCurrentUser()
    {
        var userId = User.FindFirst("userId")?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { detail = "Invalid token" });
        }
        
        var user = _context.Users.Find(userId);
        if (user == null)
        {
            return NotFound(new { detail = "User not found" });
        }
        
        return Ok(MapUserToResponse(user));
    }
    
    [HttpPost("change-password")]
    [Authorize]
    public IActionResult ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = User.FindFirst("userId")?.Value;
        var user = _context.Users.Find(userId);
        
        if (user == null)
        {
            return NotFound(new { detail = "User not found" });
        }
        
        if (!_authService.VerifyPassword(request.CurrentPassword, user.PasswordHash))
        {
            return BadRequest(new { detail = "Current password is incorrect" });
        }
        
        user.PasswordHash = _authService.HashPassword(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow.ToString("o");
        _context.SaveChanges();
        
        return Ok(new { message = "Password changed successfully" });
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
