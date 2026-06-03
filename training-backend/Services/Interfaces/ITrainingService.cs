using training_backend.Models.DTOs;

namespace training_backend.Services.Interfaces;

public interface ITrainingService
{
    Task<int> CreateTrainingSessionAsync(CreateTrainingSessionDto dto);
    Task<int> SaveDraftAsync(SaveTrainingSessionDraftDto dto);
    Task<TrainingSessionDetailDto> GetSessionAsync(int sessionId);
    Task PublishSessionAsync(int sessionId, PublishTrainingSessionDto dto);
    Task<List<TrainingSessionSummaryDto>> GetTrainerSessionsAsync(string trainerId);
    Task<List<TrainingSessionSummaryDto>> GetSupervisorSessionsAsync(string supervisorId);
    Task<PublicTrainingSessionDto> GetPublicSessionAsync(int sessionId);
}
