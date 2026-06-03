using Microsoft.EntityFrameworkCore;
using training_backend.Data;
using training_backend.Models.DTOs;
using training_backend.Models.Entities;
using training_backend.Models.Enums;
using training_backend.Services.Interfaces;


public class TrainerReportService : ITrainerReportService
{
    private readonly AppDbContext _context;

    public TrainerReportService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<int> SaveReportAsync(CreateTrainerReportDto dto)
    {
        var existing = await _context.TrainerReports
            .Include(x => x.TraineeAssessments)
            .FirstOrDefaultAsync(x => x.TrainingSessionId == dto.TrainingSessionId);

        if (existing != null)
        {
            if (existing.SubmittedToSupervisor)
                throw new Exception("Already submitted");

            // update
            existing.TraineeAssessments.Clear();

            foreach (var t in dto.TraineeAssessments)
            {
                existing.TraineeAssessments.Add(new TraineeAssessment
                {
                    TraineeName = t.TraineeName,
                    DemonstratedUnderstanding = t.DemonstratedUnderstanding,
                    CanPerformIndependently = t.CanPerformIndependently,
                    Status = t.Status
                });
            }

            existing.SkillApplicationLevel = dto.SkillApplicationLevel;
            existing.PerformanceImproved = dto.PerformanceImproved;
            existing.SupportNeeded = dto.SupportNeeded;
            existing.Comments = dto.Comments;

            existing.WhatWorkedWell = dto.WhatWorkedWell;
            existing.Improvements = dto.Improvements;
            existing.TrainerComment = dto.TrainerComment;
            existing.SupervisorComment = dto.SupervisorComment;
            existing.EffectivenessRating = dto.EffectivenessRating;
            existing.Recommendation = dto.Recommendation;

            existing.TrainerName = dto.TrainerName;
            existing.TrainerSignature = dto.TrainerSignature;
            existing.TrainerDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return existing.Id;
        }

        var report = new TrainerReport
        {
            TrainingSessionId = dto.TrainingSessionId,
            CreatedAt = DateTime.UtcNow,
            TrainerDate = DateTime.UtcNow
        };

        foreach (var t in dto.TraineeAssessments)
        {
            report.TraineeAssessments.Add(new TraineeAssessment
            {
                TraineeName = t.TraineeName,
                DemonstratedUnderstanding = t.DemonstratedUnderstanding,
                CanPerformIndependently = t.CanPerformIndependently,
                Status = t.Status
            });
        }

        report.SkillApplicationLevel = dto.SkillApplicationLevel;
        report.PerformanceImproved = dto.PerformanceImproved;
        report.SupportNeeded = dto.SupportNeeded;
        report.Comments = dto.Comments;

        report.WhatWorkedWell = dto.WhatWorkedWell;
        report.Improvements = dto.Improvements;
        report.TrainerComment = dto.TrainerComment;
        report.SupervisorComment = dto.SupervisorComment;
        report.EffectivenessRating = dto.EffectivenessRating;
        report.Recommendation = dto.Recommendation;

        report.TrainerName = dto.TrainerName;
        report.TrainerSignature = dto.TrainerSignature;

        _context.TrainerReports.Add(report);

        if (!string.IsNullOrWhiteSpace(dto.FormSnapshot))
        {
            var session = await _context.TrainingSessions.FindAsync(dto.TrainingSessionId);
            if (session != null)
            {
                session.SubmittedPayloadJson = dto.FormSnapshot;
            }
        }

        await _context.SaveChangesAsync();

        return report.Id;
    }

    public async Task<TrainerReport?> GetBySessionIdAsync(int sessionId)
    {
        return await _context.TrainerReports
            .Include(x => x.TraineeAssessments)
            .FirstOrDefaultAsync(x => x.TrainingSessionId == sessionId);
    }

    public async Task SubmitReportAsync(int reportId, string? formSnapshot = null)
    {
        var report = await _context.TrainerReports
            .Include(r => r.TrainingSession)
            .FirstOrDefaultAsync(r => r.Id == reportId);

        if (report == null)
            throw new Exception("Report not found");

        var session = report.TrainingSession;
        var trainer = await _context.Users.FindAsync(session.TrainerId);

        if (trainer is null)
            throw new Exception("Trainer not found.");

        if (string.IsNullOrWhiteSpace(trainer.SupervisorId))
            throw new Exception("Assign a supervisor before submitting to supervisor.");

        if (string.IsNullOrWhiteSpace(session.AssignedSupervisorId))
        {
            session.AssignedSupervisorId = trainer.SupervisorId;
        }

        if (!string.IsNullOrWhiteSpace(formSnapshot))
        {
            session.SubmittedPayloadJson = formSnapshot;
        }

        report.SubmittedToSupervisor = true;
        session.Status = AssessmentStatus.TRAINERASSESSMENTPENDING;

        await _context.SaveChangesAsync();
    }
}
