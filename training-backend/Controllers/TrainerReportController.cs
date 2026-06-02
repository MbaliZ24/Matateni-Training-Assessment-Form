using Microsoft.AspNetCore.Mvc;
using training_backend.Models.DTOs;
using training_backend.Services.Interfaces;




[ApiController]
[Route("api/[controller]")]
public class TrainerReportController : ControllerBase
{
    private readonly ITrainerReportService _service;

    public TrainerReportController(ITrainerReportService service)
    {
        _service = service;
    }

    [HttpPost]
    public async Task<IActionResult> Save(CreateTrainerReportDto dto)
    {
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
        var data = await _service.GetBySessionIdAsync(sessionId);
        return Ok(data);
    }

    [HttpPost("{id}/submit")]
    public async Task<IActionResult> Submit(int id)
    {
        try
        {
            await _service.SubmitReportAsync(id);
            return Ok("Submitted to supervisor");
        }
        catch (Exception ex)
{
    return BadRequest(ex.InnerException?.Message ?? ex.Message);
}

        
    }
}