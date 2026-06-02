using training_backend.Models.Enums;

namespace training_backend.Models.Entities;

public class TrainingAssessment
{
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public string AssessmentCode { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public DateTime TrainingDate { get; set; }

    public string Duration { get; set; } = string.Empty;

    public string Format { get; set; } = string.Empty;

    public string TargetGroup { get; set; } = string.Empty;

    public AssessmentStatus Status { get; set; } = AssessmentStatus.DRAFT;

    public string TrainerId { get; set; } = string.Empty;

    public User Trainer { get; set; } = null!;

    public string? NumberOfTrainees { get; set; }

    public string? TrainerRole { get; set; }

    public string? QrCodeUrl { get; set; }

    public string? FeedbackLink { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Section F: Trainer Reflection
    public string? WorkedWell { get; set; }

    public string? ChangeFuture { get; set; }

    public string? EffectivenessRating { get; set; }

    public string? Recommendation { get; set; }

    // Section G: Trainer Sign-off
    public string? TrainerSignoffName { get; set; }

    public string? TrainerSignoffSignature { get; set; }

    public string? TrainerSignoffSignatureType { get; set; }   // 'text' | 'draw' | 'image'

    public string? TrainerSignoffSignatureData { get; set; }   // Base64

    public DateTime? TrainerSignoffDate { get; set; }

    // Section G: Supervisor Sign-off
    public string? SupervisorSignoffName { get; set; }

    public string? SupervisorSignoffSignature { get; set; }

    public string? SupervisorSignoffSignatureType { get; set; } // 'text' | 'draw' | 'image'

    public string? SupervisorSignoffSignatureData { get; set; } // Base64

    public DateTime? SupervisorSignoffDate { get; set; }

    // Navigation properties
    public ICollection<TrainingObjective> Objectives { get; set; } = new List<TrainingObjective>();

    public ICollection<TraineeFeedback> Feedbacks { get; set; } = new List<TraineeFeedback>();

    public ICollection<KnowledgeAssessment> Evaluations { get; set; } = new List<KnowledgeAssessment>();

    public ICollection<FollowUp> FollowUps { get; set; } = new List<FollowUp>();

    public ICollection<Report> Reports { get; set; } = new List<Report>();
}
