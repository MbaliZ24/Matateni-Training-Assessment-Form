using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using training_backend.Models.DTOs;
using training_backend.Models.Enums;
using training_backend.Services.Interfaces;
using QRCoder;

namespace training_backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TrainingSessionsController : ControllerBase
{
    private readonly ITrainingService _service;
    private readonly IConfiguration _configuration;

    public TrainingSessionsController(ITrainingService service, IConfiguration configuration)
    {
        _service = service;
        _configuration = configuration;
    }

    [Authorize(Roles = nameof(Role.ADMIN))]
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var sessions = await _service.GetAllSessionsAsync();
        return Ok(sessions);
    }

    [HttpGet("trainer/{trainerId}")]
    public async Task<IActionResult> GetTrainerSessions(string trainerId)
    {
        if (!CanAccessTrainer(trainerId))
            return Forbid();

        var sessions = await _service.GetTrainerSessionsAsync(trainerId);
        return Ok(sessions);
    }

    [HttpGet("supervisor/{supervisorId}")]
    public async Task<IActionResult> GetSupervisorSessions(string supervisorId)
    {
        if (!CanAccessSupervisor(supervisorId))
            return Forbid();

        var sessions = await _service.GetSupervisorSessionsAsync(supervisorId);
        return Ok(sessions);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetSession(int id)
    {
        try
        {
            var session = await _service.GetSessionAsync(id);
            if (!CanAccessSession(session.TrainerId, session.AssignedSupervisorId))
                return Forbid();

            return Ok(session);
        }
        catch (Exception ex)
        {
            return NotFound(ex.Message);
        }
    }

    [AllowAnonymous]
    [HttpGet("{id:int}/public")]
    public async Task<IActionResult> GetPublicSession(int id)
    {
        try
        {
            var session = await _service.GetPublicSessionAsync(id);
            return Ok(session);
        }
        catch (Exception ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpPost("draft")]
    public async Task<IActionResult> SaveDraft(SaveTrainingSessionDraftDto dto)
    {
        if (!CanAccessTrainer(dto.TrainerId))
            return Forbid();

        try
        {
            var id = await _service.SaveDraftAsync(dto);
            return Ok(new { sessionId = id, message = "Draft saved" });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{id:int}/draft")]
    public async Task<IActionResult> DeleteDraft(int id, [FromQuery] string trainerId)
    {
        if (!CanAccessTrainer(trainerId))
            return Forbid();

        try
        {
            await _service.DeleteDraftAsync(id, trainerId);
            return Ok(new { message = "Draft deleted" });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{id:int}/publish")]
    public async Task<IActionResult> Publish(int id, PublishTrainingSessionDto dto)
    {
        if (!CanAccessTrainer(dto.TrainerId))
            return Forbid();

        try
        {
            await _service.PublishSessionAsync(id, dto);
            return Ok(new { sessionId = id, message = "Assessment published and open for trainee feedback" });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [AllowAnonymous]
    [HttpGet("{id}/qr")]
    public IActionResult GenerateQrCode(int id)
    {
        var formId = $"F-{id}";
        var baseUrl = (_configuration["Frontend:BaseUrl"] ?? "http://localhost:5173").TrimEnd('/');
        var url = $"{baseUrl}/trainee-feedback?formId={formId}";

        using var qrGenerator = new QRCodeGenerator();

        var qrData = qrGenerator.CreateQrCode(
            url,
            QRCodeGenerator.ECCLevel.Q
        );

        var qrCode = new PngByteQRCode(qrData);

        byte[] qrBytes = qrCode.GetGraphic(20);

        return File(qrBytes, "image/png");
    }

    private string? GetCurrentUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
    }

    private bool IsAdmin() => User.IsInRole(nameof(Role.ADMIN));

    private bool CanAccessTrainer(string trainerId)
    {
        return IsAdmin() || GetCurrentUserId() == trainerId;
    }

    private bool CanAccessSupervisor(string supervisorId)
    {
        return IsAdmin() || GetCurrentUserId() == supervisorId;
    }

    private bool CanAccessSession(string trainerId, string? supervisorId)
    {
        var userId = GetCurrentUserId();
        return IsAdmin() || userId == trainerId || userId == supervisorId;
    }
}
