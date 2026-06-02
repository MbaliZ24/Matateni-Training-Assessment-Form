using training_backend.Models.Enums;

namespace training_backend.Models.Entities;

public class TrainingSession
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public int TrainerId { get; set; }

    public string? Department { get; set; }

    public DateTime? TrainingDate { get; set; }

    public int? DurationDays { get; set; }

    public int? DurationHours { get; set; }

    public int? NumberOfTrainees { get; set; }

    public string? TrainingFormat { get; set; }

    public string? TargetAudience { get; set; }

    public AssessmentStatus Status { get; set; } = AssessmentStatus.DRAFT;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<TrainingObjective> Objectives { get; set; } = new List<TrainingObjective>();

    public ICollection<FeedbackSubmission> FeedbackSubmissions { get; set; } = new List<FeedbackSubmission>();

    public TrainerReport? TrainerReport { get; set; }
}
