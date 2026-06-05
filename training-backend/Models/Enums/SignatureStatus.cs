namespace training_backend.Models.Enums;

public enum SignatureStatus
{
    READYTOSIGN,  // Waiting for signature
    UNSIGNED,     // Not yet signed
    SIGNED,       // Successfully signed
}
