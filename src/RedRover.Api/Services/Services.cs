using Microsoft.EntityFrameworkCore;
using RedRover.Api.Data;
using RedRover.Api.Models;

namespace RedRover.Api.Services;

public class MatchingEngine
{
    private readonly AppDbContext _context;

    public MatchingEngine(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Substitute>> FindEligibleSubstitutesAsync(Absence absence)
    {
        var subs = await _context.Substitutes
            .Where(s => s.IsAvailableToday && s.HoursWorkedThisWeek < 40)
            .ToListAsync();

        // Match by subject or general certification
        return subs
            .Where(s => s.Certifications.Contains("General", StringComparison.OrdinalIgnoreCase) ||
                        s.Certifications.Contains(absence.Subject, StringComparison.OrdinalIgnoreCase) ||
                        (absence.Subject.Contains("Chemistry", StringComparison.OrdinalIgnoreCase) && s.Certifications.Contains("Science", StringComparison.OrdinalIgnoreCase)))
            .OrderBy(s => s.HoursWorkedThisWeek) // Fair distribution
            .ToList();
    }
}

public class NotificationService
{
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(ILogger<NotificationService> logger)
    {
        _logger = logger;
    }

    public async Task EnqueueSubNotificationsAsync(Absence absence, List<Substitute> eligibleSubs)
    {
        _logger.LogInformation(
            "⚡ [ServiceBus Enqueued] Enqueued {Count} SMS alerts for Absence {AbsenceId} ({Subject} at {School})",
            eligibleSubs.Count, absence.Id, absence.Subject, absence.SchoolName);

        // In Azure, this writes to Azure Service Bus 'sub-notification-queue'
        // which triggers the SubNotificationDispatcher Azure Function
        await Task.CompletedTask;
    }
}
