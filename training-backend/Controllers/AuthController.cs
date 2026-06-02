using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using training_backend.Data;
using training_backend.Models.DTOs;
using training_backend.Models.Entities;
using training_backend.Services;

namespace training_backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public AuthController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("users")]
    public async Task<ActionResult<List<UserDto>>> GetUsers()
    {
        var users = await _dbContext.Users
            .Include(user => user.Department)
            .OrderBy(user => user.FullName)
            .ThenBy(user => user.Email)
            .Select(user => new UserDto
            {
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                DepartmentId = user.DepartmentId,
                Department = user.Department != null ? user.Department.Name : user.DepartmentId ?? string.Empty
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterUserDto dto)
    {
        var email = dto.Email.Trim().ToLower();

        if (string.IsNullOrWhiteSpace(dto.FullName) ||
            string.IsNullOrWhiteSpace(email) ||
            string.IsNullOrWhiteSpace(dto.Password))
        {
            return BadRequest("Full name, email and password are required.");
        }

        var emailExists = await _dbContext.Users
            .AnyAsync(user => user.Email.ToLower() == email);

        if (emailExists)
        {
            return Conflict("A user with this email already exists.");
        }

        var user = new User
        {
            FullName = dto.FullName.Trim(),
            Email = email,
            Role = dto.Role,
            DepartmentId = dto.DepartmentId,
            CreatedAt = DateTime.UtcNow
        };

        user.Password = PasswordService.HashPassword(user, dto.Password);

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

        return Ok(CreateAuthResponse(user));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginDto dto)
    {
        var email = dto.Email.Trim().ToLower();

        var user = await _dbContext.Users
            .FirstOrDefaultAsync(user => user.Email.ToLower() == email);

        if (user is null || !PasswordService.VerifyPassword(user, dto.Password, out var needsRehash))
        {
            return Unauthorized("Invalid email or password.");
        }

        if (needsRehash)
        {
            user.Password = PasswordService.HashPassword(user, dto.Password);
            await _dbContext.SaveChangesAsync();
        }

        return Ok(CreateAuthResponse(user));
    }

    private static AuthResponseDto CreateAuthResponse(User user)
    {
        return new AuthResponseDto
        {
            Token = Convert.ToBase64String(Guid.NewGuid().ToByteArray()),
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role
        };
    }
}
