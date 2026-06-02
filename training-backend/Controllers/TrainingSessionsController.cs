using Microsoft.AspNetCore.Mvc;
using training_backend.Models.DTOs;
using training_backend.Services.Interfaces;
using QRCoder;

namespace training_backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TrainingSessionsController : ControllerBase
{
    private readonly ITrainingService _service;

    public TrainingSessionsController(ITrainingService service)
    {
        _service = service;
    }

    // CREATE TRAINING SESSION
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

    // GENERATE QR CODE
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