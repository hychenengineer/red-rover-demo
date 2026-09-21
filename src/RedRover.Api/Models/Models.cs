using System.ComponentModel.DataAnnotations;

namespace RedRover.Api.Models;

public class School
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Level { get; set; } = "High School"; // High School, Middle School, Elementary
    public string Address { get; set; } = string.Empty;
}

public class Teacher
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SchoolId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string RoomNumber { get; set; } = string.Empty;
}

public class Substitute
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Certifications { get; set; } = "General, Science"; // comma-delimited
    public bool IsAvailableToday { get; set; } = true;
    public int HoursWorkedThisWeek { get; set; } = 16;
}

public class Absence
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SchoolId { get; set; }
    public string SchoolName { get; set; } = string.Empty;
    public Guid TeacherId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public DateTime Date { get; set; } = DateTime.UtcNow.Date;
    public string StartTime { get; set; } = "07:30 AM";
    public string EndTime { get; set; } = "02:45 PM";
    public string RoomNumber { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
    public string Reason { get; set; } = "Illness"; // Illness, Personal, FMLA, Professional Development
    public string Status { get; set; } = "Open"; // Open, Filled, Cancelled
    public Guid? AssignedSubId { get; set; }
    public string? AssignedSubName { get; set; }

    // Concurrency Token to prevent double-booking during peak morning bursts!
    [ConcurrencyCheck]
    public Guid Version { get; set; } = Guid.NewGuid();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? FilledAt { get; set; }
}

public class TimeEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string EmployeeName { get; set; } = string.Empty;
    public string Role { get; set; } = "Bus Driver"; // Bus Driver, Cafeteria Worker, Custodian, Teacher
    public string EntryType { get; set; } = "ClockIn"; // ClockIn, ClockOut, ExtraDuty
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public double Hours { get; set; } = 0.0;
    public string? StipendReason { get; set; } // e.g. "Period 3 Prep Coverage", "Athletic Chaperone"
    public decimal Amount { get; set; } = 0.0m;
    public bool IsApproved { get; set; } = false;
}

public class EmployeeRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = "Teacher";
    public string Department { get; set; } = "Science";
    public string StateCertificateNumber { get; set; } = string.Empty;
    public string CertificateStatus { get; set; } = "Active"; // Active, PendingRenewal, Expired
    public DateTime ClearanceValidUntil { get; set; }
    public DateTime HireDate { get; set; }
    public int DocumentCount { get; set; } = 8;
}
