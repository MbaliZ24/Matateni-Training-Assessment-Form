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

[ApiController]
[Route("api/[controller]")]
public class FeedbackController : ControllerBase
{
    private readonly IFeedbackService _service;
    private readonly AppDbContext _dbContext;

    public FeedbackController(IFeedbackService service, AppDbContext dbContext)
    {
        _service = service;
        _dbContext = dbContext;
    }

    [AllowAnonymous]
    [HttpPost]
    public async Task<IActionResult> Submit(CreateFeedbackSubmissionDto dto)
    {
        try
        {
            var submissionId = await _service.SubmitFeedbackAsync(dto);

            return Ok(new
            {
                submissionId,
                message = "Feedback submitted successfully"
            });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [Authorize]
    [HttpGet("session/{sessionId}/summary")]
    public async Task<IActionResult> GetSummary(int sessionId)
    {
        if (!await CanAccessTrainingSessionAsync(sessionId))
            return Forbid();

        try
        {
            var result = await _service.GetSessionSummaryAsync(sessionId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [Authorize]
    [HttpGet("session/{sessionId}/entries")]
    public async Task<IActionResult> GetEntries(int sessionId)
    {
        if (!await CanAccessTrainingSessionAsync(sessionId))
            return Forbid();

        try
        {
            var result = await _service.GetSessionEntriesAsync(sessionId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
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
