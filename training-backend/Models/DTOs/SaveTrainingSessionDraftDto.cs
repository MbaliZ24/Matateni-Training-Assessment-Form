namespace training_backend.Models.DTOs;

public class SaveTrainingSessionDraftDto
{
    public int? SessionId { get; set; }

    public string TrainerId { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string? Department { get; set; }

    public DateTime? TrainingDate { get; set; }

    public int? DurationDays { get; set; }

    public int? DurationHours { get; set; }

    public int? NumberOfTrainees { get; set; }

    public List<string> TrainingFormat { get; set; } = new();

    public string? TargetAudience { get; set; }

    public List<string> Objectives { get; set; } = new();

    /// <summary>Full client form snapshot (sections A–G) for restore on edit.</summary>
    public string? DraftPayload { get; set; }
}

public class PublishTrainingSessionDto
{
    public string TrainerId { get; set; } = string.Empty;

    public int FeedbackOpenHours { get; set; } = 24;
}

public class TrainingSessionDetailDto
{
    public int Id { get; set; }

    public string TrainerId { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string? Department { get; set; }

    public DateTime? TrainingDate { get; set; }

    public int? DurationDays { get; set; }

    public int? DurationHours { get; set; }

    public int? NumberOfTrainees { get; set; }

    public List<string> TrainingFormat { get; set; } = new();

    public string? TargetAudience { get; set; }

    public List<string> Objectives { get; set; } = new();

    public string Status { get; set; } = string.Empty;

    public string? AssignedSupervisorId { get; set; }

    public string? DraftPayload { get; set; }

    public string? SubmittedPayload { get; set; }

    public DateTime? FeedbackClosesAt { get; set; }

    public DateTime CreatedAt { get; set; }
}
