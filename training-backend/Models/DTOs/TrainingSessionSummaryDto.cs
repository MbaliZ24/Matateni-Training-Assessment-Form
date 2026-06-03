namespace training_backend.Models.DTOs;

public class TrainingSessionSummaryDto
{
    public int Id { get; set; }

    public string TrainerId { get; set; } = string.Empty;

    public string? AssignedSupervisorId { get; set; }

    public string? SubmittedPayload { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Department { get; set; }

    public DateTime? TrainingDate { get; set; }

    public int? NumberOfTrainees { get; set; }

    public int FeedbackResponses { get; set; }

    public double AverageScore { get; set; }

    public string Status { get; set; } = string.Empty;

    public string Recommendation { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime? FeedbackClosesAt { get; set; }

    public DateTime? SubmittedAt { get; set; }
}
