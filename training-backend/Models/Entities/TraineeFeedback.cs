namespace training_backend.Models.Entities;

public class TraineeFeedback
{
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public string AssessmentId { get; set; } = string.Empty;

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string? Department { get; set; }

    public string? EmployeeNumber { get; set; }

    // Rating fields (1–5 scale)
    public int ObjectivesClear { get; set; }

    public int ContentRelevant { get; set; }

    public int TrainerKnowledge { get; set; }

    public int PaceAppropriate { get; set; }

    public int PracticalUseful { get; set; }

    public int Effectiveness { get; set; }

    public string? Comments { get; set; }

    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    public TrainingAssessment Assessment { get; set; } = null!;

    public ICollection<KnowledgeAssessment> Evaluations { get; set; } = new List<KnowledgeAssessment>();
}
