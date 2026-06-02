namespace training_backend.Models.Entities;

public class Report
{
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public string AssessmentId { get; set; } = string.Empty;

    public string PdfUrl { get; set; } = string.Empty;

    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

    public TrainingAssessment Assessment { get; set; } = null!;
}
