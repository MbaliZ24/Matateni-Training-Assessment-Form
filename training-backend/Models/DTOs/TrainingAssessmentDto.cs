using training_backend.Models.Enums;

namespace training_backend.Models.DTOs;

public class TrainingAssessmentDto
{
    public string Id { get; set; } = string.Empty;

    public string AssessmentCode { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public DateTime TrainingDate { get; set; }

    public string Duration { get; set; } = string.Empty;

    public string Format { get; set; } = string.Empty;

    public string TargetGroup { get; set; } = string.Empty;

    public AssessmentStatus Status { get; set; }

    public string TrainerId { get; set; } = string.Empty;

    public string? NumberOfTrainees { get; set; }

    public string? TrainerRole { get; set; }

    public string? QrCodeUrl { get; set; }

    public string? FeedbackLink { get; set; }

    public DateTime CreatedAt { get; set; }

    public List<string> Objectives { get; set; } = new();
}
