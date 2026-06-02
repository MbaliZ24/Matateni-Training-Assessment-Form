namespace training_backend.Models.DTOs;

public class TraineeFeedbackDto
{
    public string Id { get; set; } = string.Empty;

    public string AssessmentId { get; set; } = string.Empty;

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string? Department { get; set; }

    public string? EmployeeNumber { get; set; }

    public int ObjectivesClear { get; set; }

    public int ContentRelevant { get; set; }

    public int TrainerKnowledge { get; set; }

    public int PaceAppropriate { get; set; }

    public int PracticalUseful { get; set; }

    public int Effectiveness { get; set; }

    public string? Comments { get; set; }

    public DateTime SubmittedAt { get; set; }
}
