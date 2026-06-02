namespace training_backend.Models.Entities;

public class FeedbackSubmission
{
    public int Id { get; set; }

    public int TrainingSessionId { get; set; }

    public string TraineeName { get; set; } = string.Empty;

    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    public TrainingSession TrainingSession { get; set; } = null!;

    public ICollection<FeedbackAnswer> Answers { get; set; } = new List<FeedbackAnswer>();
}
