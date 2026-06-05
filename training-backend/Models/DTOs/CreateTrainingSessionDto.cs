namespace training_backend.Models.DTOs;

public class CreateTrainingSessionDto
{
    public string TrainerId { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string? Department { get; set; }

    public DateTime? TrainingDate { get; set; }

    public int? DurationDays { get; set; }

    public int? DurationHours { get; set; }

    public int? NumberOfTrainees { get; set; }

    public int? FeedbackOpenHours { get; set; }

    public List<string> TrainingFormat { get; set; } = new();

    public string? TargetAudience { get; set; }

    public List<string> Objectives { get; set; } = new();
}
