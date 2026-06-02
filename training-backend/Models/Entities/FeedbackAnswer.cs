namespace training_backend.Models.Entities;

public class FeedbackAnswer
{
    public int Id { get; set; }

    public int FeedbackSubmissionId { get; set; }

    public string Question { get; set; } = string.Empty;

    public string Answer { get; set; } = string.Empty;

    public int? Rating { get; set; }

    public FeedbackSubmission FeedbackSubmission { get; set; } = null!;
}
