namespace training_backend.Models.Entities;

public class KnowledgeAssessment
{
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public string AssessmentId { get; set; } = string.Empty;

    public string TraineeFeedbackId { get; set; } = string.Empty;

    public bool DemonstratedUnderstanding { get; set; }

    public bool IndependentPerformance { get; set; }

    public string AssessedBy { get; set; } = string.Empty;

    public TrainingAssessment Assessment { get; set; } = null!;

    public TraineeFeedback TraineeFeedback { get; set; } = null!;
}
