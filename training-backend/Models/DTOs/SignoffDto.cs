namespace training_backend.Models.DTOs;

/// <summary>Section G — sign-off payload. Used for both trainer and supervisor sign-off.</summary>
public class SignoffDto
{
    public string AssessmentId { get; set; } = string.Empty;

    /// <summary>Which party is signing: "trainer" or "supervisor".</summary>
    public string SignoffParty { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string Signature { get; set; } = string.Empty;

    /// <summary>'text' | 'draw' | 'image'</summary>
    public string SignatureType { get; set; } = string.Empty;

    /// <summary>Base64 data for drawn or uploaded signatures.</summary>
    public string? SignatureData { get; set; }

    public DateTime Date { get; set; }
}
