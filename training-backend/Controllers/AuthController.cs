using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using training_backend.Data;
using training_backend.Models.DTOs;
using training_backend.Models.Entities;
using training_backend.Models.Enums;
using training_backend.Services;

namespace training_backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly JwtTokenService _jwtTokenService;

    public AuthController(AppDbContext dbContext, JwtTokenService jwtTokenService)
    {
        _dbContext = dbContext;
        _jwtTokenService = jwtTokenService;
    }

    [Authorize]
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
                Department = user.Department != null ? user.Department.Name : user.DepartmentId ?? string.Empty,
                SupervisorId = user.SupervisorId
            })
            .ToListAsync();

        return Ok(users);
    }

    [Authorize(Roles = nameof(Role.ADMIN))]
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

        if (dto.Role == Role.TRAINER && string.IsNullOrWhiteSpace(dto.SupervisorId))
        {
            return BadRequest("Trainers must have an assigned supervisor.");
        }

        var emailExists = await _dbContext.Users
            .AnyAsync(user => user.Email.ToLower() == email);

        if (emailExists)
        {
            return Conflict("A user with this email already exists.");
        }

        if (!string.IsNullOrWhiteSpace(dto.SupervisorId))
        {
            var supervisorExists = await _dbContext.Users
                .AnyAsync(user => user.Id == dto.SupervisorId && user.Role == Role.SUPERVISOR);

            if (!supervisorExists)
            {
                return BadRequest("Supervisor not found.");
            }
        }

        var user = new User
        {
            FullName = dto.FullName.Trim(),
            Email = email,
            Role = dto.Role,
            DepartmentId = dto.DepartmentId,
            SupervisorId = dto.Role == Role.TRAINER ? dto.SupervisorId : null,
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

    [Authorize(Roles = nameof(Role.ADMIN))]
    [HttpPatch("users/{userId}")]
    public async Task<ActionResult<UserDto>> UpdateUser(string userId, UpdateUserDto dto)
    {
        var user = await _dbContext.Users
            .Include(u => u.Department)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user is null)
        {
            return NotFound("User not found.");
        }

        if (dto.Role.HasValue)
        {
            user.Role = dto.Role.Value;
        }

        if (dto.DepartmentId != null)
        {
            user.DepartmentId = string.IsNullOrWhiteSpace(dto.DepartmentId) ? null : dto.DepartmentId;
        }

        if (dto.SupervisorId != null)
        {
            if (string.IsNullOrWhiteSpace(dto.SupervisorId))
            {
                user.SupervisorId = null;
            }
            else
            {
                var supervisorExists = await _dbContext.Users
                    .AnyAsync(u => u.Id == dto.SupervisorId && u.Role == Role.SUPERVISOR);

                if (!supervisorExists)
                {
                    return BadRequest("Supervisor not found.");
                }

                user.SupervisorId = dto.SupervisorId;
            }
        }

        if (user.Role != Role.TRAINER)
        {
            user.SupervisorId = null;
        }
        else if (string.IsNullOrWhiteSpace(user.SupervisorId))
        {
            return BadRequest("Trainers must have an assigned supervisor.");
        }

        await _dbContext.SaveChangesAsync();

        return Ok(new UserDto
        {
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role,
            DepartmentId = user.DepartmentId,
            Department = user.Department?.Name ?? user.DepartmentId ?? string.Empty,
            SupervisorId = user.SupervisorId
        });
    }

    private AuthResponseDto CreateAuthResponse(User user)
    {
        return new AuthResponseDto
        {
            Token = _jwtTokenService.CreateToken(user),
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role,
            SupervisorId = user.SupervisorId
        };
    }
}
