using training_backend.Models.DTOs;

namespace training_backend.Services.Interfaces;

public interface ITrainingService
{
    Task<int> CreateTrainingSessionAsync(CreateTrainingSessionDto dto);
}