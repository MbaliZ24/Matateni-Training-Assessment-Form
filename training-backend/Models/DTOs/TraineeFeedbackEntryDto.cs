namespace training_backend.Models.DTOs;

public class TraineeFeedbackEntryDto
{
    public string TraineeName { get; set; } = string.Empty;

    public DateTime SubmittedAt { get; set; }

    public List<FeedbackAnswerDto> Answers { get; set; } = new();
}

public class FeedbackAnswerDto
{
    public string Question { get; set; } = string.Empty;

    public string Answer { get; set; } = string.Empty;

    public int? Rating { get; set; }
}
