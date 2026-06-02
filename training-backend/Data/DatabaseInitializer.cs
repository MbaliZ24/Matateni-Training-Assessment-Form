using Microsoft.EntityFrameworkCore;
using training_backend.Models.Entities;
using training_backend.Services;

namespace training_backend.Data;

public static class DatabaseInitializer
{
    private const string AdminEmail = "admin@matateni.com";
    private const string AdminPassword = "demo123";
    private const string AdminFullName = "Matateni Admin";

    public static async Task InitializeAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        await dbContext.Database.MigrateAsync();

        var admin = await dbContext.Users
            .FirstOrDefaultAsync(user => user.Email.ToLower() == AdminEmail.ToLower());

        if (admin is null)
        {
            admin = new User
            {
                FullName = AdminFullName,
                Email = AdminEmail,
                Role = Role.ADMIN,
                DepartmentId = null,
                CreatedAt = DateTime.UtcNow
            };

            admin.Password = PasswordService.HashPassword(admin, AdminPassword);
            dbContext.Users.Add(admin);
        }
        else
        {
            admin.FullName = AdminFullName;
            admin.Role = Role.ADMIN;
            admin.DepartmentId = null;

            if (!PasswordService.VerifyPassword(admin, AdminPassword, out var needsRehash) || needsRehash)
            {
                admin.Password = PasswordService.HashPassword(admin, AdminPassword);
            }
        }

        await dbContext.SaveChangesAsync();
    }
}
