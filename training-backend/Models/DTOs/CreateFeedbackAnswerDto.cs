namespace training_backend.Models.DTOs;

public class CreateFeedbackAnswerDto
{
    public string Question { get; set; } = string.Empty;

    public string Answer { get; set; } = string.Empty;

    public int? Rating { get; set; }
}
