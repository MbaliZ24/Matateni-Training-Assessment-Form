using Microsoft.EntityFrameworkCore;
using training_backend.Data;
using training_backend.Models.DTOs;
using training_backend.Models.Entities;
using training_backend.Services.Interfaces;

namespace training_backend.Services;

public class FeedbackService : IFeedbackService
{
    private readonly AppDbContext _context;

    public FeedbackService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<int> SubmitFeedbackAsync(CreateFeedbackSubmissionDto dto)
    {
        // validate session exists
        var sessionExists = await _context.TrainingSessions
            .AnyAsync(x => x.Id == dto.TrainingSessionId);

        if (!sessionExists)
            throw new Exception("Training session not found");

        // create submission
        var submission = new FeedbackSubmission
        {
            TrainingSessionId = dto.TrainingSessionId,
            TraineeName = dto.TraineeName,
            SubmittedAt = DateTime.UtcNow
        };

        // add answers
        foreach (var answer in dto.Answers)
        {
            submission.Answers.Add(new FeedbackAnswer
            {
                Question = answer.Question,
                Answer = answer.Answer,
                Rating = answer.Rating
            });
        }

        _context.FeedbackSubmissions.Add(submission);

        await _context.SaveChangesAsync();

        return submission.Id;
    }

    public async Task<FeedbackSummaryDto> GetSessionSummaryAsync(int sessionId)
{
    var submissions = await _context.FeedbackSubmissions
        .Where(s => s.TrainingSessionId == sessionId)
        .Include(s => s.Answers)
        .ToListAsync();

    if (!submissions.Any())
        throw new Exception("No feedback found for this session");

    var allAnswers = submissions.SelectMany(s => s.Answers);

    var questionGroups = allAnswers
        .GroupBy(a => a.Question)
        .Select(g => new QuestionSummaryDto
        {
            Question = g.Key,
            AverageRating = g.Average(x => x.Rating) ?? 0
        })
        .ToList();

    var overallAverage = allAnswers.Average(a => a.Rating) ?? 0;

    return new FeedbackSummaryDto
    {
        TotalSubmissions = submissions.Count,
        OverallAverageRating = overallAverage,
        Questions = questionGroups
    };
}

}
