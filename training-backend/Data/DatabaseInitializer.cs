using Microsoft.EntityFrameworkCore;
using training_backend.Models.Entities;
using training_backend.Models.Enums;
using training_backend.Services;

namespace training_backend.Data;

public static class DatabaseInitializer
{
    private const string DefaultDepartmentId = "Operations";
    private const string AdminEmail = "admin@matateni.com";
    private const string AdminPassword = "demo123";
    private const string AdminFullName = "Matateni Admin";
    private const string SupervisorEmail = "supervisor@matateni.com";
    private const string SupervisorPassword = "demo123";
    private const string SupervisorFullName = "Demo Supervisor";
    private const string TrainerEmail = "trainer@matateni.com";
    private const string TrainerPassword = "demo123";
    private const string TrainerFullName = "Demo Trainer";

    public static async Task InitializeAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        await dbContext.Database.MigrateAsync();

        await EnsureDepartmentAsync(dbContext);

        await EnsureUserAsync(
            dbContext,
            AdminEmail,
            AdminFullName,
            Role.ADMIN,
            AdminPassword,
            null);
        await dbContext.SaveChangesAsync();

        var supervisor = await EnsureUserAsync(
            dbContext,
            SupervisorEmail,
            SupervisorFullName,
            Role.SUPERVISOR,
            SupervisorPassword,
            null);
        await dbContext.SaveChangesAsync();

        await EnsureUserAsync(
            dbContext,
            TrainerEmail,
            TrainerFullName,
            Role.TRAINER,
            TrainerPassword,
            supervisor.Id);
        await dbContext.SaveChangesAsync();
    }

    private static async Task EnsureDepartmentAsync(AppDbContext dbContext)
    {
        var exists = await dbContext.Set<Department>()
            .AnyAsync(d => d.Id == DefaultDepartmentId);

        if (exists)
        {
            return;
        }

        dbContext.Set<Department>().Add(new Department
        {
            Id = DefaultDepartmentId,
            Name = "Operations",
            CreatedAt = DateTime.UtcNow
        });

        await dbContext.SaveChangesAsync();
    }

    private static async Task<User> EnsureUserAsync(
        AppDbContext dbContext,
        string email,
        string fullName,
        Role role,
        string password,
        string? supervisorId)
    {
        var normalizedEmail = email.ToLower();
        var user = await dbContext.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

        if (user is null)
        {
            user = new User
            {
                FullName = fullName,
                Email = normalizedEmail,
                Role = role,
                DepartmentId = DefaultDepartmentId,
                SupervisorId = role == Role.TRAINER ? supervisorId : null,
                CreatedAt = DateTime.UtcNow
            };
            user.Password = PasswordService.HashPassword(user, password);
            dbContext.Users.Add(user);
        }
        else
        {
            user.FullName = fullName;
            user.Role = role;
            user.DepartmentId = user.DepartmentId ?? DefaultDepartmentId;
            user.SupervisorId = role == Role.TRAINER ? supervisorId : null;

            if (!PasswordService.VerifyPassword(user, password, out var needsRehash) || needsRehash)
            {
                user.Password = PasswordService.HashPassword(user, password);
            }
        }

        return user;
    }
}
