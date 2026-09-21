using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RedRover.Api.Data;
using RedRover.Api.Models;

namespace RedRover.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TimeTrackingController : ControllerBase
{
    private readonly AppDbContext _context;

    public TimeTrackingController(AppDbContext context)
    {
        _context = context;
    }

    // GET /api/timetracking/entries
    [HttpGet("entries")]
    public async Task<ActionResult<List<TimeEntry>>> GetEntries()
    {
        var entries = await _context.TimeEntries
            .OrderByDescending(t => t.Timestamp)
            .ToListAsync();
        return Ok(entries);
    }

    // POST /api/timetracking/punch (Kiosk PIN Pad punch from Video #4)
    [HttpPost("punch")]
    public async Task<ActionResult<TimeEntry>> PunchClock([FromBody] KioskPunchDto dto)
    {
        var entry = new TimeEntry
        {
            EmployeeName = dto.EmployeeName,
            Role = dto.Role,
            EntryType = dto.EntryType,
            Timestamp = DateTime.UtcNow,
            Hours = dto.EntryType == "ClockOut" ? 7.5 : 0.0,
            IsApproved = true
        };

        _context.TimeEntries.Add(entry);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetEntries), new { id = entry.Id }, entry);
    }

    // POST /api/timetracking/extra-duty (Teacher prep coverage stipend from Video #4 & case study)
    [HttpPost("extra-duty")]
    public async Task<ActionResult<TimeEntry>> SubmitExtraDuty([FromBody] ExtraDutyClaimDto dto)
    {
        var entry = new TimeEntry
        {
            EmployeeName = dto.EmployeeName,
            Role = "Teacher",
            EntryType = "ExtraDuty",
            Timestamp = DateTime.UtcNow,
            Hours = dto.Hours,
            StipendReason = dto.Reason,
            Amount = (decimal)dto.Hours * dto.RatePerHour,
            IsApproved = true
        };

        _context.TimeEntries.Add(entry);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetEntries), new { id = entry.Id }, entry);
    }
}
