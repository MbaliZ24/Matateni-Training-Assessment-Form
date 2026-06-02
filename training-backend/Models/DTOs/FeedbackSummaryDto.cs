namespace training_backend.Models.DTOs;

public class FeedbackSummaryDto
{
    public string AssessmentId { get; set; } = string.Empty;

    public int TotalSubmissions { get; set; }

    public double OverallAverageRating { get; set; }

    public List<QuestionSummaryDto> Questions { get; set; } = new();
}

public class QuestionSummaryDto
{
    public string Question { get; set; } = string.Empty;

    public double AverageRating { get; set; }
}
