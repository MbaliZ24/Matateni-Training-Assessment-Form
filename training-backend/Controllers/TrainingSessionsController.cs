using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using training_backend.Models.DTOs;
using training_backend.Services.Interfaces;
using QRCoder;

namespace training_backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TrainingSessionsController : ControllerBase
{
    private readonly ITrainingService _service;

    public TrainingSessionsController(ITrainingService service)
    {
        _service = service;
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateTrainingSessionDto dto)
    {
        try
        {
            var id = await _service.CreateTrainingSessionAsync(dto);

            return Ok(new
            {
                sessionId = id,
                message = "Training session created successfully"
            });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("trainer/{trainerId}")]
    public async Task<IActionResult> GetTrainerSessions(string trainerId)
    {
        var sessions = await _service.GetTrainerSessionsAsync(trainerId);
        return Ok(sessions);
    }

    [HttpGet("supervisor/{supervisorId}")]
    public async Task<IActionResult> GetSupervisorSessions(string supervisorId)
    {
        var sessions = await _service.GetSupervisorSessionsAsync(supervisorId);
        return Ok(sessions);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetSession(int id)
    {
        try
        {
            var session = await _service.GetSessionAsync(id);
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
        var url = $"http://localhost:5173/trainee-feedback?formId={formId}";

        using var qrGenerator = new QRCodeGenerator();

        var qrData = qrGenerator.CreateQrCode(
            url,
            QRCodeGenerator.ECCLevel.Q
        );

        var qrCode = new PngByteQRCode(qrData);

        byte[] qrBytes = qrCode.GetGraphic(20);

        return File(qrBytes, "image/png");
    }
}
