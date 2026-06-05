using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using training_backend.Data;
using training_backend.Models.DTOs;
using training_backend.Models.Enums;
using training_backend.Services.Interfaces;

namespace training_backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TrainerReportController : ControllerBase
{
    private readonly ITrainerReportService _service;
    private readonly AppDbContext _dbContext;

    public TrainerReportController(ITrainerReportService service, AppDbContext dbContext)
    {
        _service = service;
        _dbContext = dbContext;
    }

    [HttpPost]
    public async Task<IActionResult> Save(CreateTrainerReportDto dto)
    {
        if (!await CanAccessTrainingSessionAsync(dto.TrainingSessionId))
            return Forbid();

        try
        {
            var id = await _service.SaveReportAsync(dto);
            return Ok(new { id, message = "Saved successfully" });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("session/{sessionId}")]
    public async Task<IActionResult> Get(int sessionId)
    {
        if (!await CanAccessTrainingSessionAsync(sessionId))
            return Forbid();

        var data = await _service.GetBySessionIdAsync(sessionId);
        return Ok(data);
    }

    [Authorize(Roles = $"{nameof(Role.SUPERVISOR)},{nameof(Role.ADMIN)}")]
    [HttpPost("session/{sessionId:int}/supervisor-signoff")]
    public async Task<IActionResult> SupervisorSignoff(int sessionId, [FromBody] SubmitSupervisorSignoffDto dto)
    {
        if (!await CanAccessTrainingSessionAsync(sessionId))
            return Forbid();

        var session = await _dbContext.TrainingSessions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == sessionId);

        if (session is null)
            return NotFound("Training session not found.");

        var userId = GetCurrentUserId();
        if (!IsAdmin() && session.AssignedSupervisorId != userId)
            return Forbid();

        if (string.IsNullOrWhiteSpace(dto.SupervisorName))
            return BadRequest("Supervisor name is required.");

        if (dto.Decision.Equals("Approve", StringComparison.OrdinalIgnoreCase) &&
            string.IsNullOrWhiteSpace(dto.SupervisorSignature))
        {
            return BadRequest("Supervisor signature is required to approve.");
        }

        if (dto.Decision.Equals("Needs Changes", StringComparison.OrdinalIgnoreCase) &&
            string.IsNullOrWhiteSpace(dto.Comments))
        {
            return BadRequest("Comments are required when returning a form for changes.");
        }

        try
        {
            await _service.SubmitSupervisorSignoffAsync(sessionId, dto);
            return Ok(new { message = "Supervisor sign-off recorded" });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{id}/submit")]
    public async Task<IActionResult> Submit(int id, [FromBody] SubmitTrainerReportDto? dto)
    {
        var report = await _dbContext.TrainerReports
            .Include(r => r.TrainingSession)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (report is null)
            return NotFound("Report not found");

        if (!CanAccessSession(report.TrainingSession.TrainerId, report.TrainingSession.AssignedSupervisorId))
            return Forbid();

        try
        {
            await _service.SubmitReportAsync(id, dto?.FormSnapshot);
            return Ok("Submitted to supervisor");
        }
        catch (Exception ex)
        {
            return BadRequest(ex.InnerException?.Message ?? ex.Message);
        }
    }

    private string? GetCurrentUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
    }

    private bool IsAdmin() => User.IsInRole(nameof(Role.ADMIN));

    private bool CanAccessSession(string trainerId, string? supervisorId)
    {
        var userId = GetCurrentUserId();
        return IsAdmin() || userId == trainerId || userId == supervisorId;
    }

    private async Task<bool> CanAccessTrainingSessionAsync(int sessionId)
    {
        var session = await _dbContext.TrainingSessions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == sessionId);

        if (session is null)
            return false;

        return CanAccessSession(session.TrainerId, session.AssignedSupervisorId);
    }
}
