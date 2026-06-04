using training_backend.Data;
using training_backend.Models.DTOs;
using training_backend.Models.Entities;
using training_backend.Models.Enums;
using training_backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace training_backend.Services;

public class TrainingService : ITrainingService
{
    private readonly AppDbContext _context;

    public TrainingService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<int> CreateTrainingSessionAsync(CreateTrainingSessionDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.TrainerId))
            throw new Exception("Trainer is required.");

        if (dto.Objectives == null || !dto.Objectives.Any())
            throw new Exception("At least one objective is required.");

        var formatString = dto.TrainingFormat != null
            ? string.Join(",", dto.TrainingFormat)
            : null;

        var session = new TrainingSession
        {
            Title = dto.Title,
            TrainerId = dto.TrainerId,
            Department = dto.Department,
            TrainingDate = dto.TrainingDate,
            DurationDays = dto.DurationDays,
            DurationHours = dto.DurationHours,
            NumberOfTrainees = dto.NumberOfTrainees,
            TrainingFormat = formatString,
            TargetAudience = dto.TargetAudience,
            Status = AssessmentStatus.OPENFORFEEDBACK,
            FeedbackClosesAt = DateTime.UtcNow.AddHours(dto.FeedbackOpenHours.GetValueOrDefault(24))
        };

        _context.TrainingSessions.Add(session);
        await _context.SaveChangesAsync();

        var objectives = dto.Objectives.Select(obj => new TrainingObjective
        {
            TrainingSessionId = session.Id,
            Description = obj
        });

        _context.TrainingObjectives.AddRange(objectives);
        await _context.SaveChangesAsync();

        return session.Id;
    }

    public async Task<int> SaveDraftAsync(SaveTrainingSessionDraftDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.TrainerId))
            throw new Exception("Trainer is required.");

        TrainingSession session;

        if (dto.SessionId is > 0)
        {
            session = await _context.TrainingSessions
                .Include(x => x.Objectives)
                .Include(x => x.TrainerReport)
                .FirstOrDefaultAsync(x => x.Id == dto.SessionId && x.TrainerId == dto.TrainerId)
                ?? throw new Exception("Training session not found.");

            if (session.TrainerReport?.SubmittedToSupervisor == true)
                throw new Exception("Cannot edit an assessment already submitted to supervisor.");

            if (session.Status == AssessmentStatus.DRAFT)
            {
                ApplySessionFields(session, dto);
                session.DraftPayloadJson = dto.DraftPayload;
                session.Status = AssessmentStatus.DRAFT;
                session.FeedbackClosesAt = null;
            }
            else
            {
                ApplySessionFields(session, dto);
                session.DraftPayloadJson = dto.DraftPayload;
            }
        }
        else
        {
            session = new TrainingSession
            {
                TrainerId = dto.TrainerId,
                Status = AssessmentStatus.DRAFT,
                CreatedAt = DateTime.UtcNow
            };
            _context.TrainingSessions.Add(session);
            ApplySessionFields(session, dto);
            session.DraftPayloadJson = dto.DraftPayload;
            session.FeedbackClosesAt = null;
        }

        await _context.SaveChangesAsync();
        await ReplaceObjectivesAsync(session, dto.Objectives);
        return session.Id;
    }

    public async Task DeleteDraftAsync(int sessionId, string trainerId)
    {
        var session = await _context.TrainingSessions
            .Include(x => x.Objectives)
            .FirstOrDefaultAsync(x => x.Id == sessionId && x.TrainerId == trainerId)
            ?? throw new Exception("Draft not found.");

        if (session.Status != AssessmentStatus.DRAFT)
            throw new Exception("Only draft assessments can be deleted.");

        _context.TrainingSessions.Remove(session);
        await _context.SaveChangesAsync();
    }

    public async Task<TrainingSessionDetailDto> GetSessionAsync(int sessionId)
    {
        var session = await _context.TrainingSessions
            .Include(x => x.Objectives)
            .FirstOrDefaultAsync(x => x.Id == sessionId)
            ?? throw new Exception("Training session not found.");

        await RefreshSessionStatusAsync(session);
        return MapSessionDetail(session);
    }

    public async Task PublishSessionAsync(int sessionId, PublishTrainingSessionDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.TrainerId))
            throw new Exception("Trainer is required.");

        var session = await _context.TrainingSessions
            .Include(x => x.Objectives)
            .FirstOrDefaultAsync(x => x.Id == sessionId && x.TrainerId == dto.TrainerId)
            ?? throw new Exception("Training session not found.");

        if (session.Status != AssessmentStatus.DRAFT)
            throw new Exception("Only draft assessments can be published.");

        if (string.IsNullOrWhiteSpace(session.Title))
            throw new Exception("Training title is required before publishing.");

        if (!session.Objectives.Any(o => !string.IsNullOrWhiteSpace(o.Description)))
            throw new Exception("At least one training objective is required before publishing.");

        var trainer = await _context.Users.FindAsync(dto.TrainerId);
        if (trainer is null)
            throw new Exception("Trainer not found.");

        if (string.IsNullOrWhiteSpace(trainer.SupervisorId))
            throw new Exception("Assign a supervisor to your account before publishing.");

        var openHours = dto.FeedbackOpenHours > 0 ? dto.FeedbackOpenHours : 24;
        session.Status = AssessmentStatus.OPENFORFEEDBACK;
        session.FeedbackClosesAt = DateTime.UtcNow.AddHours(openHours);
        session.AssignedSupervisorId = trainer.SupervisorId;
        session.DraftPayloadJson = null;

        await _context.SaveChangesAsync();
    }

    public async Task<PublicTrainingSessionDto> GetPublicSessionAsync(int sessionId)
    {
        var session = await _context.TrainingSessions.FindAsync(sessionId)
            ?? throw new Exception("Training session not found.");

        await RefreshSessionStatusAsync(session);

        var status = MapSessionStatus(session.Status);
        var feedbackOpen = session.Status == AssessmentStatus.OPENFORFEEDBACK;

        return new PublicTrainingSessionDto
        {
            Id = session.Id,
            Title = session.Title,
            Status = status,
            FeedbackClosesAt = session.FeedbackClosesAt,
            FeedbackOpen = feedbackOpen
        };
    }

    public async Task<List<TrainingSessionSummaryDto>> GetSupervisorSessionsAsync(string supervisorId)
    {
        var sessions = await _context.TrainingSessions
            .Include(x => x.FeedbackSubmissions)
                .ThenInclude(x => x.Answers)
            .Include(x => x.TrainerReport)
            .Where(x => x.AssignedSupervisorId == supervisorId && x.TrainerReport != null && x.TrainerReport.SubmittedToSupervisor)
            .OrderByDescending(x => x.TrainerReport!.TrainerDate)
            .ToListAsync();

        foreach (var session in sessions)
        {
            await RefreshSessionStatusAsync(session);
        }

        return sessions.Select(MapSessionSummary).ToList();
    }

    public async Task<List<TrainingSessionSummaryDto>> GetTrainerSessionsAsync(string trainerId)
    {
        var sessions = await _context.TrainingSessions
            .Include(x => x.FeedbackSubmissions)
                .ThenInclude(x => x.Answers)
            .Include(x => x.TrainerReport)
            .Where(x => x.TrainerId == trainerId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        foreach (var session in sessions)
        {
            await RefreshSessionStatusAsync(session);
        }

        return sessions.Select(MapSessionSummary).ToList();
    }

    private TrainingSessionSummaryDto MapSessionSummary(TrainingSession session)
    {
        var ratings = session.FeedbackSubmissions
            .SelectMany(submission => submission.Answers)
            .Where(answer => answer.Rating.HasValue)
            .Select(answer => answer.Rating!.Value)
            .ToList();
        var submittedReport = session.TrainerReport?.SubmittedToSupervisor == true;
        var isDraft = session.Status == AssessmentStatus.DRAFT;

        return new TrainingSessionSummaryDto
        {
            Id = session.Id,
            TrainerId = session.TrainerId,
            AssignedSupervisorId = session.AssignedSupervisorId,
            SubmittedPayload = session.SubmittedPayloadJson,
            Title = string.IsNullOrWhiteSpace(session.Title) ? "Untitled draft" : session.Title,
            Department = session.Department,
            TrainingDate = session.TrainingDate,
            NumberOfTrainees = session.NumberOfTrainees,
            FeedbackResponses = session.FeedbackSubmissions.Count,
            AverageScore = ratings.Count == 0 ? 0 : Math.Round(ratings.Average(), 1),
            Status = submittedReport ? "Submitted" : MapSessionStatus(session.Status),
            Recommendation = submittedReport
                ? "Pending supervisor review"
                : isDraft
                    ? "Draft — not yet published"
                    : "Open for trainee feedback",
            CreatedAt = session.CreatedAt,
            FeedbackClosesAt = session.FeedbackClosesAt,
            SubmittedAt = submittedReport ? session.TrainerReport?.TrainerDate : null
        };
    }

    private static void ApplySessionFields(TrainingSession session, SaveTrainingSessionDraftDto dto)
    {
        session.Title = string.IsNullOrWhiteSpace(dto.Title) ? "Untitled draft" : dto.Title.Trim();
        session.Department = dto.Department;
        session.TrainingDate = dto.TrainingDate;
        session.DurationDays = dto.DurationDays;
        session.DurationHours = dto.DurationHours;
        session.NumberOfTrainees = dto.NumberOfTrainees;
        session.TrainingFormat = dto.TrainingFormat != null && dto.TrainingFormat.Count > 0
            ? string.Join(",", dto.TrainingFormat)
            : null;
        session.TargetAudience = dto.TargetAudience;
    }

    private async Task ReplaceObjectivesAsync(TrainingSession session, List<string>? objectives)
    {
        var existing = await _context.TrainingObjectives
            .Where(o => o.TrainingSessionId == session.Id)
            .ToListAsync();

        if (existing.Count > 0)
            _context.TrainingObjectives.RemoveRange(existing);

        var descriptions = (objectives ?? new List<string>())
            .Select(o => o.Trim())
            .Where(o => o.Length > 0)
            .ToList();

        if (descriptions.Count == 0)
        {
            await _context.SaveChangesAsync();
            return;
        }

        _context.TrainingObjectives.AddRange(descriptions.Select(description => new TrainingObjective
        {
            TrainingSessionId = session.Id,
            Description = description
        }));

        await _context.SaveChangesAsync();
    }

    private static TrainingSessionDetailDto MapSessionDetail(TrainingSession session)
    {
        return new TrainingSessionDetailDto
        {
            Id = session.Id,
            TrainerId = session.TrainerId,
            Title = session.Title,
            Department = session.Department,
            TrainingDate = session.TrainingDate,
            DurationDays = session.DurationDays,
            DurationHours = session.DurationHours,
            NumberOfTrainees = session.NumberOfTrainees,
            TrainingFormat = string.IsNullOrWhiteSpace(session.TrainingFormat)
                ? new List<string>()
                : session.TrainingFormat.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList(),
            TargetAudience = session.TargetAudience,
            Objectives = session.Objectives.Select(o => o.Description).ToList(),
            Status = MapSessionStatus(session.Status),
            AssignedSupervisorId = session.AssignedSupervisorId,
            DraftPayload = session.DraftPayloadJson,
            SubmittedPayload = session.SubmittedPayloadJson,
            FeedbackClosesAt = session.FeedbackClosesAt,
            CreatedAt = session.CreatedAt
        };
    }

    private static string MapSessionStatus(AssessmentStatus status)
    {
        return status switch
        {
            AssessmentStatus.OPENFORFEEDBACK => "Waiting for Feedback",
            AssessmentStatus.FEEDBACKCLOSED => "Feedback Closed",
            AssessmentStatus.TRAINERASSESSMENTPENDING => "Trainer Assessment Pending",
            AssessmentStatus.FOLLOWUPPENDING => "Follow-up Pending",
            AssessmentStatus.COMPLETED => "Completed",
            _ => "Draft"
        };
    }

    private async Task RefreshSessionStatusAsync(TrainingSession session)
    {
        var previous = session.Status;
        CloseExpiredTraineeFeedback(session);
        if (session.Status != previous)
        {
            await _context.SaveChangesAsync();
        }
    }

    private static void CloseExpiredTraineeFeedback(TrainingSession session)
    {
        if (session.Status == AssessmentStatus.FEEDBACKCLOSED)
        {
            session.Status = AssessmentStatus.TRAINERASSESSMENTPENDING;
            return;
        }

        if (
            session.Status == AssessmentStatus.OPENFORFEEDBACK &&
            session.FeedbackClosesAt.HasValue &&
            session.FeedbackClosesAt.Value <= DateTime.UtcNow
        )
        {
            session.Status = AssessmentStatus.TRAINERASSESSMENTPENDING;
        }
    }
}
