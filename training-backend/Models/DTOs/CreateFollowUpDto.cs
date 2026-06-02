namespace training_backend.Models.DTOs;

public class CreateFollowUpDto
{
    public string AssessmentId { get; set; } = string.Empty;

    public string SupervisorId { get; set; } = string.Empty;

    public string ApplicationExtent { get; set; } = string.Empty;

    public bool ImprovementObserved { get; set; }

    public string SupportNeeded { get; set; } = string.Empty;

    public string? Barriers { get; set; }

    public string? Comments { get; set; }
}
