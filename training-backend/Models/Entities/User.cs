using training_backend.Models.Enums;

namespace training_backend.Models.Entities;

public class User
{
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public Role Role { get; set; }

    public string? DepartmentId { get; set; }

    public Department? Department { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Supervisor assigned to trainers for assessment sign-off.</summary>
    public string? SupervisorId { get; set; }

    public User? Supervisor { get; set; }

    public ICollection<User> SupervisedTrainers { get; set; } = new List<User>();

    public ICollection<TrainingAssessment> Assessments { get; set; } = new List<TrainingAssessment>();

    public ICollection<FollowUp> FollowUps { get; set; } = new List<FollowUp>();
}
