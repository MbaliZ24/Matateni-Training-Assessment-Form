namespace training_backend.Models.DTOs;

/// <summary>Section F — submitted by the trainer after training is complete.</summary>
public class TrainerReflectionDto
{
    public string AssessmentId { get; set; } = string.Empty;

    public string? WorkedWell { get; set; }

    public string? ChangeFuture { get; set; }

    public string? EffectivenessRating { get; set; }

    public string? Recommendation { get; set; }
}
