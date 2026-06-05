namespace training_backend.Models.DTOs;

public class CreateTrainerReportDto
{
    public int TrainingSessionId { get; set; }

    public List<TraineeAssessmentDto> TraineeAssessments { get; set; } = new();

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

    /// <summary>Full assessment form JSON for supervisor review.</summary>
    public string? FormSnapshot { get; set; }
}
