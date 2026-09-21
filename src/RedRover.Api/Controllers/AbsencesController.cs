using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using RedRover.Api.Data;
using RedRover.Api.Hubs;
using RedRover.Api.Models;
using RedRover.Api.Services;

namespace RedRover.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AbsencesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IHubContext<AbsenceHub> _hubContext;
    private readonly MatchingEngine _matchingEngine;
    private readonly NotificationService _notificationService;
    private readonly ILogger<AbsencesController> _logger;

    public AbsencesController(
        AppDbContext context,
        IHubContext<AbsenceHub> hubContext,
        MatchingEngine matchingEngine,
        NotificationService notificationService,
        ILogger<AbsencesController> logger)
    {
        _context = context;
        _hubContext = hubContext;
        _matchingEngine = matchingEngine;
        _notificationService = notificationService;
        _logger = logger;
    }

    // GET /api/absences
    [HttpGet]
    public async Task<ActionResult<List<Absence>>> GetAbsences([FromQuery] string? status)
    {
        var query = _context.Absences.AsQueryable();
        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(a => a.Status.ToLower() == status.ToLower());
        }

        var results = await query.OrderByDescending(a => a.CreatedAt).ToListAsync();
        return Ok(results);
    }

    // GET /api/absences/metrics
    [HttpGet("metrics")]
    public async Task<ActionResult<DistrictMetricsDto>> GetMetrics()
    {
        var today = DateTime.UtcNow.Date;
        var total = await _context.Absences.CountAsync(a => a.Date == today);
        var filled = await _context.Absences.CountAsync(a => a.Date == today && a.Status == "Filled");
        var open = total - filled;
        var rate = total > 0 ? Math.Round((double)filled / total * 100, 1) : 100.0;

        return Ok(new DistrictMetricsDto(total, filled, open, rate, 6));
    }

    // POST /api/absences
    [HttpPost]
    public async Task<ActionResult<Absence>> CreateAbsence([FromBody] CreateAbsenceDto dto)
    {
        Guid schoolGuid = Guid.TryParse(dto.SchoolId, out var sGuid) 
            ? sGuid 
            : (_context.Schools.FirstOrDefault()?.Id ?? Guid.NewGuid());
            
        Guid teacherGuid = Guid.TryParse(dto.TeacherId, out var tGuid) 
            ? tGuid 
            : (_context.Teachers.FirstOrDefault()?.Id ?? Guid.NewGuid());

        DateTime absenceDate = DateTime.TryParse(dto.Date, out var pDate) 
            ? pDate.Date 
            : DateTime.UtcNow.Date;

        var absence = new Absence
        {
            SchoolId = schoolGuid,
            SchoolName = string.IsNullOrWhiteSpace(dto.SchoolName) ? "Lincoln High School" : dto.SchoolName,
            TeacherId = teacherGuid,
            TeacherName = string.IsNullOrWhiteSpace(dto.TeacherName) ? "Sarah Johnson" : dto.TeacherName,
            Subject = string.IsNullOrWhiteSpace(dto.Subject) ? "10th Grade Chemistry" : dto.Subject,
            RoomNumber = string.IsNullOrWhiteSpace(dto.RoomNumber) ? "Room 204" : dto.RoomNumber,
            Reason = string.IsNullOrWhiteSpace(dto.Reason) ? "Illness / Medical" : dto.Reason,
            StartTime = string.IsNullOrWhiteSpace(dto.StartTime) ? "08:00 AM" : dto.StartTime,
            EndTime = string.IsNullOrWhiteSpace(dto.EndTime) ? "03:30 PM" : dto.EndTime,
            Notes = dto.Notes ?? "",
            Date = absenceDate,
            Status = "Open",
            CreatedAt = DateTime.UtcNow,
            Version = Guid.NewGuid()
        };

        _context.Absences.Add(absence);
        await _context.SaveChangesAsync();

        // 1. Run Matching Engine
        var eligibleSubs = await _matchingEngine.FindEligibleSubstitutesAsync(absence);

        // 2. Offload 6:00 AM SMS blast to Service Bus Queue (triggers SubNotificationDispatcher)
        await _notificationService.EnqueueSubNotificationsAsync(absence, eligibleSubs);

        // 3. Real-Time SignalR Fan-Out to all active Admin Boards!
        await _hubContext.Clients.All.SendAsync("AbsenceCreated", absence);

        _logger.LogInformation("Created absence {Id} for {Teacher} at {School}. Matched {SubCount} subs.",
            absence.Id, absence.TeacherName, absence.SchoolName, eligibleSubs.Count);

        return CreatedAtAction(nameof(GetAbsences), new { id = absence.Id }, absence);
    }

    // POST /api/absences/{id}/claim (Concurrency Protected)
    [HttpPost("{id}/claim")]
    public async Task<IActionResult> ClaimShift(Guid id, [FromBody] ClaimShiftDto dto)
    {
        var absence = await _context.Absences.FindAsync(id);
        if (absence == null)
        {
            return NotFound(new { message = "Absence record not found." });
        }

        if (absence.Status == "Filled")
        {
            return StatusCode(StatusCodes.Status409Conflict, new
            {
                message = "Sorry! This assignment was already claimed by another substitute.",
                currentStatus = absence.Status,
                assignedTo = absence.AssignedSubName
            });
        }

        // Optimistic Concurrency Check
        Guid expectedVer = Guid.TryParse(dto.ExpectedVersion, out var ev) ? ev : Guid.Empty;
        if (expectedVer != Guid.Empty && absence.Version != expectedVer)
        {
            return StatusCode(StatusCodes.Status409Conflict, new
            {
                message = "Concurrency collision detected. Another educator claimed this assignment moments earlier.",
                currentStatus = absence.Status
            });
        }

        Guid subGuid = Guid.TryParse(dto.SubstituteId, out var sId) ? sId : Guid.NewGuid();

        // Update record
        absence.Status = "Filled";
        absence.AssignedSubId = subGuid;
        absence.AssignedSubName = dto.SubstituteName;
        absence.FilledAt = DateTime.UtcNow;
        absence.Version = Guid.NewGuid(); // Rotate version token

        try
        {
            await _context.SaveChangesAsync();

            // 🚀 Broadcast to all connected Admin screens and Sub apps!
            await _hubContext.Clients.All.SendAsync("AbsenceUpdated", absence);

            _logger.LogInformation("Shift {Id} successfully claimed by {SubName}", absence.Id, dto.SubstituteName);
            return Ok(absence);
        }
        catch (DbUpdateConcurrencyException)
        {
            return StatusCode(StatusCodes.Status409Conflict, new
            {
                message = "Sorry! This shift was claimed simultaneously by another substitute teacher.",
                conflictType = "DbUpdateConcurrencyException"
            });
        }
    }

    // POST /api/absences/{id}/override (Admin assignment / dispatch to sub)
    [HttpPost("{id}/override")]
    public async Task<IActionResult> OverrideAssignment(Guid id, [FromBody] OverrideAssignDto dto)
    {
        var absence = await _context.Absences.FindAsync(id);
        if (absence == null) return NotFound();

        if (string.IsNullOrWhiteSpace(dto.SubstituteName))
        {
            // Remove assignment, return to Open
            absence.Status = "Open";
            absence.AssignedSubId = null;
            absence.AssignedSubName = null;
            absence.FilledAt = null;
        }
        else
        {
            // Set status to Offered (or custom status provided)
            absence.Status = string.IsNullOrWhiteSpace(dto.Status) ? "Offered" : dto.Status;
            absence.AssignedSubId = Guid.TryParse(dto.SubstituteId, out var sId) ? sId : null;
            absence.AssignedSubName = dto.SubstituteName;
            if (absence.Status == "Filled")
            {
                absence.FilledAt = DateTime.UtcNow;
            }
            else
            {
                absence.FilledAt = null;
            }
        }
        absence.Version = Guid.NewGuid();

        await _context.SaveChangesAsync();

        // Broadcast to all screens
        await _hubContext.Clients.All.SendAsync("AbsenceUpdated", absence);

        _logger.LogInformation("Absence {Id} updated: Status={Status}, Sub={SubName}", absence.Id, absence.Status, absence.AssignedSubName);
        return Ok(absence);
    }

    // POST /api/absences/{id}/respond (Substitute Accept or Reject assigned job)
    [HttpPost("{id}/respond")]
    public async Task<IActionResult> RespondToOffer(Guid id, [FromBody] SubResponseDto dto)
    {
        var absence = await _context.Absences.FindAsync(id);
        if (absence == null) return NotFound();

        if (dto.Accepted)
        {
            absence.Status = "Filled";
            absence.FilledAt = DateTime.UtcNow;
        }
        else
        {
            // Sub declined/rejected: return shift to Open so Admin can reassign
            absence.Status = "Open";
            absence.AssignedSubId = null;
            absence.AssignedSubName = null;
            absence.FilledAt = null;
        }
        absence.Version = Guid.NewGuid();

        await _context.SaveChangesAsync();

        // Broadcast to all screens
        await _hubContext.Clients.All.SendAsync("AbsenceUpdated", absence);

        _logger.LogInformation("Sub response for {Id}: Accepted={Accepted}. New Status={Status}", absence.Id, dto.Accepted, absence.Status);
        return Ok(absence);
    }
}
