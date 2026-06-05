namespace training_backend.Models.DTOs;

public class PublicTrainingSessionDto
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public DateTime? FeedbackClosesAt { get; set; }

    public bool FeedbackOpen { get; set; }
}
