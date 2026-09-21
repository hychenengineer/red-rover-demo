namespace RedRover.Api.Models;

public record CreateAbsenceDto(
    string? SchoolId,
    string? SchoolName,
    string? TeacherId,
    string? TeacherName,
    string? Subject,
    string? RoomNumber,
    string? Reason,
    string? StartTime,
    string? EndTime,
    string? Notes,
    string? Date = null
);

public record ClaimShiftDto(
    string SubstituteId,
    string SubstituteName,
    string? ExpectedVersion = null
);

public record OverrideAssignDto(
    string? SubstituteId,
    string? SubstituteName,
    string? Status = null
);

public record SubResponseDto(
    bool Accepted
);

public record KioskPunchDto(
    string Pin,
    string EmployeeName,
    string Role,
    string EntryType // ClockIn or ClockOut
);

public record ExtraDutyClaimDto(
    string EmployeeName,
    string Reason,
    double Hours,
    decimal RatePerHour
);

public record DistrictMetricsDto(
    int TotalAbsences,
    int FilledAbsences,
    int OpenAbsences,
    double FillRatePercentage,
    int AverageFillTimeMinutes
);
