using training_backend.Models.DTOs; 

namespace training_backend.Services.Interfaces; 

public interface IFeedbackService 
{ 
    Task<int> SubmitFeedbackAsync(CreateFeedbackSubmissionDto dto); 
    Task<FeedbackSummaryDto> GetSessionSummaryAsync(int sessionId);

    Task<List<TraineeFeedbackEntryDto>> GetSessionEntriesAsync(int sessionId);
    
}