using training_backend.Models.Enums;

namespace training_backend.Models.Entities;

public class TrainingSession
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string TrainerId { get; set; } = string.Empty;

    public string? AssignedSupervisorId { get; set; }

    public User? AssignedSupervisor { get; set; }

    public string? Department { get; set; }

    public DateTime? TrainingDate { get; set; }

    public int? DurationDays { get; set; }

    public int? DurationHours { get; set; }

    public int? NumberOfTrainees { get; set; }

    public string? TrainingFormat { get; set; }

    public string? TargetAudience { get; set; }

    public AssessmentStatus Status { get; set; } = AssessmentStatus.DRAFT;

    public DateTime? FeedbackClosesAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Serialized trainer form state while status is DRAFT.</summary>
    public string? DraftPayloadJson { get; set; }

    /// <summary>Full form snapshot after trainer submits to supervisor.</summary>
    public string? SubmittedPayloadJson { get; set; }

    public ICollection<TrainingObjective> Objectives { get; set; } = new List<TrainingObjective>();

    public ICollection<FeedbackSubmission> FeedbackSubmissions { get; set; } = new List<FeedbackSubmission>();

    public TrainerReport? TrainerReport { get; set; }
}
