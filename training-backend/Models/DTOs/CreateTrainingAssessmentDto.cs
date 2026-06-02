namespace training_backend.Models.DTOs;

public class CreateTrainingAssessmentDto
{
    public string Title { get; set; } = string.Empty;

    public DateTime TrainingDate { get; set; }

    public string Duration { get; set; } = string.Empty;

    public string Format { get; set; } = string.Empty;

    public string TargetGroup { get; set; } = string.Empty;

    public string TrainerId { get; set; } = string.Empty;

    public string? NumberOfTrainees { get; set; }

    public string? TrainerRole { get; set; }

    public List<string> Objectives { get; set; } = new();
}
