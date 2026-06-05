namespace training_backend.Models.DTOs;

public class SubmitSupervisorSignoffDto
{
    /// <summary>Approve or Needs Changes</summary>
    public string Decision { get; set; } = string.Empty;

    public string Comments { get; set; } = string.Empty;

    public string SupervisorName { get; set; } = string.Empty;

    public string SupervisorSignature { get; set; } = string.Empty;

    public string? FormSnapshot { get; set; }
}
