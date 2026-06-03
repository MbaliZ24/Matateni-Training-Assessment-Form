using Microsoft.EntityFrameworkCore;
using training_backend.Models.Entities;

namespace training_backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }

    public DbSet<TrainingSession> TrainingSessions { get; set; }
    public DbSet<TrainingObjective> TrainingObjectives { get; set; }

    public DbSet<FeedbackSubmission> FeedbackSubmissions { get; set; }

    public DbSet<FeedbackAnswer> FeedbackAnswers { get; set; }

    public DbSet<TrainerReport> TrainerReports { get; set; }
    public DbSet<TraineeAssessment> TraineeAssessments { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>().ToTable("User");

        modelBuilder.Entity<User>()
            .HasOne(u => u.Supervisor)
            .WithMany(u => u.SupervisedTrainers)
            .HasForeignKey(u => u.SupervisorId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<TrainingSession>()
            .HasOne(t => t.AssignedSupervisor)
            .WithMany()
            .HasForeignKey(t => t.AssignedSupervisorId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<TrainingSession>()
            .HasMany(t => t.Objectives)
            .WithOne(o => o.TrainingSession)
            .HasForeignKey(o => o.TrainingSessionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<FollowUp>()
            .HasOne(f => f.Supervisor)
            .WithMany(u => u.FollowUps)
            .HasForeignKey(f => f.SupervisorId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<KnowledgeAssessment>()
            .HasOne(k => k.Assessment)
            .WithMany(a => a.Evaluations)
            .HasForeignKey(k => k.AssessmentId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
