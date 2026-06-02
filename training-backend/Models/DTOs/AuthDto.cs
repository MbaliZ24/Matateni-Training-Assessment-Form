using training_backend.Models.Enums;

namespace training_backend.Models.DTOs;

public class RegisterUserDto
{
    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public Role Role { get; set; }

    public string? DepartmentId { get; set; }
}

public class LoginDto
{
    public string Email { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;
}

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;

    public string UserId { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public Role Role { get; set; }
}

public class UserDto
{
    public string UserId { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public Role Role { get; set; }

    public string? DepartmentId { get; set; }

    public string Department { get; set; } = string.Empty;
}
