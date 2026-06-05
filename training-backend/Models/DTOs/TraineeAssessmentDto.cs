namespace training_backend.Models.DTOs;

public class TraineeAssessmentDto
{
    public string TraineeName { get; set; } = string.Empty;

    public bool DemonstratedUnderstanding { get; set; }

    public bool CanPerformIndependently { get; set; }

    public string Status { get; set; } = string.Empty;
}
