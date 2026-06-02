using training_backend.Data;
using training_backend.Models.DTOs;
using training_backend.Models.Entities;
using training_backend.Models.Enums;
using training_backend.Services.Interfaces;

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
            Status = AssessmentStatus.DRAFT
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
}
