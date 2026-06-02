using Microsoft.AspNetCore.Identity;
using training_backend.Models.Entities;

namespace training_backend.Services;

public static class PasswordService
{
    private static readonly PasswordHasher<User> Hasher = new();

    public static string HashPassword(User user, string password)
    {
        return Hasher.HashPassword(user, password);
    }

    public static bool VerifyPassword(User user, string password, out bool needsRehash)
    {
        needsRehash = false;

        try
        {
            var result = Hasher.VerifyHashedPassword(user, user.Password, password);
            needsRehash = result == PasswordVerificationResult.SuccessRehashNeeded;

            return result != PasswordVerificationResult.Failed;
        }
        catch (FormatException)
        {
            var matchesLegacyPassword = user.Password == password;
            needsRehash = matchesLegacyPassword;

            return matchesLegacyPassword;
        }
    }
}
