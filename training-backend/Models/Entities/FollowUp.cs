namespace training_backend.Models.Entities;

public class FollowUp
{
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public string AssessmentId { get; set; } = string.Empty;

    public string SupervisorId { get; set; } = string.Empty;

    public string ApplicationExtent { get; set; } = string.Empty;

    public bool ImprovementObserved { get; set; }

    public string SupportNeeded { get; set; } = string.Empty;

    public string? Barriers { get; set; }

    public string? Comments { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public TrainingAssessment Assessment { get; set; } = null!;

    public User Supervisor { get; set; } = null!;
}
