using System.Text.Json.Serialization;

namespace training_backend.Models.Entities;

public class TraineeAssessment
{
    public int Id { get; set; }

    public int TrainerReportId { get; set; }

    [JsonIgnore]
    public TrainerReport TrainerReport { get; set; } = null!;

    public string TraineeName { get; set; } = string.Empty;

    public bool DemonstratedUnderstanding { get; set; }

    public bool CanPerformIndependently { get; set; }

    public string Status { get; set; } = string.Empty;
}
