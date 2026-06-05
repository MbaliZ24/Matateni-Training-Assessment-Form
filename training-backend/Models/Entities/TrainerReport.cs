using training_backend.Models.Enums;

namespace training_backend.Models.Entities;

public class TrainerReport
{
    public int Id { get; set; }

    public int TrainingSessionId { get; set; }

    public TrainingSession TrainingSession { get; set; } = null!;

    public List<TraineeAssessment> TraineeAssessments { get; set; } = new();

    public double OverallPassRate { get; set; }

    // Section E: Workplace Follow-up
    public string SkillApplicationLevel { get; set; } = string.Empty;

    public bool PerformanceImproved { get; set; }

    public string SupportNeeded { get; set; } = string.Empty;

    public string? Comments { get; set; }

    // Section F: Trainer Reflection
    public string WhatWorkedWell { get; set; } = string.Empty;

    public string Improvements { get; set; } = string.Empty;

    public string TrainerComment { get; set; } = string.Empty;

    public string? SupervisorComment { get; set; }

    public string EffectivenessRating { get; set; } = string.Empty;

    public string Recommendation { get; set; } = string.Empty;

    // Section G: Sign-off
    public string TrainerName { get; set; } = string.Empty;

    public string TrainerSignature { get; set; } = string.Empty;

    public SignatureStatus TrainerSignatureStatus { get; set; } = SignatureStatus.UNSIGNED;

    public DateTime TrainerDate { get; set; }

    public string? SupervisorName { get; set; }

    public string? SupervisorSignature { get; set; }

    public SignatureStatus SupervisorSignatureStatus { get; set; } = SignatureStatus.READYTOSIGN;

    public DateTime? SupervisorDate { get; set; }

    public bool SubmittedToSupervisor { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
