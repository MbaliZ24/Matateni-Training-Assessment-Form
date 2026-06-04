using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using training_backend.Models.DTOs;
using training_backend.Services.Interfaces;

namespace training_backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FeedbackController : ControllerBase
{
    private readonly IFeedbackService _service;

    public FeedbackController(IFeedbackService service)
    {
        _service = service;
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
}
