namespace training_backend.Models.DTOs;

public class CreateKnowledgeAssessmentDto
{
    public string AssessmentId { get; set; } = string.Empty;

    public string TraineeFeedbackId { get; set; } = string.Empty;

    public bool DemonstratedUnderstanding { get; set; }

    public bool IndependentPerformance { get; set; }

    public string AssessedBy { get; set; } = string.Empty;
}
