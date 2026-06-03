using training_backend.Models.DTOs;
using training_backend.Models.Entities;

public interface ITrainerReportService
{
    Task<int> SaveReportAsync(CreateTrainerReportDto dto);
    Task<TrainerReport?> GetBySessionIdAsync(int sessionId);
    Task SubmitReportAsync(int reportId, string? formSnapshot = null);
}
