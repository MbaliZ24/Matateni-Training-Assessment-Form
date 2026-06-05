namespace training_backend.Models.Entities;

public class TrainingObjective
{
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public string? AssessmentId { get; set; }

    public int? TrainingSessionId { get; set; }

    public string Objective { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public TrainingAssessment? Assessment { get; set; }

    public TrainingSession? TrainingSession { get; set; }
}
