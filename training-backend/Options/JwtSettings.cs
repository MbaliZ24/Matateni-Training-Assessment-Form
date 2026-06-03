namespace training_backend.Options;

public class JwtSettings
{
    public string Issuer { get; set; } = "MatateniTraining";

    public string Audience { get; set; } = "MatateniTrainingApp";

    public string Secret { get; set; } = string.Empty;

    public int ExpiryHours { get; set; } = 12;
}
