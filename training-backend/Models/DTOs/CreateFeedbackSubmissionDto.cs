namespace training_backend.Models.DTOs;

public class CreateFeedbackSubmissionDto
{
    public int TrainingSessionId { get; set; }

    public string TraineeName { get; set; } = string.Empty;

    public List<CreateFeedbackAnswerDto> Answers { get; set; } = new();
}
