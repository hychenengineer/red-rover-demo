using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RedRover.Api.Data;
using RedRover.Api.Models;

namespace RedRover.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RecordsController : ControllerBase
{
    private readonly AppDbContext _context;

    public RecordsController(AppDbContext context)
    {
        _context = context;
    }

    // GET /api/records (Video #5 - Employee Personnel & Document Vault)
    [HttpGet]
    public async Task<ActionResult<List<EmployeeRecord>>> GetEmployeeRecords()
    {
        var records = await _context.EmployeeRecords
            .OrderBy(r => r.FullName)
            .ToListAsync();
        return Ok(records);
    }

    // GET /api/records/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<EmployeeRecord>> GetRecordById(Guid id)
    {
        var record = await _context.EmployeeRecords.FindAsync(id);
        if (record == null) return NotFound();
        return Ok(record);
    }

    // GET /api/records/schools (Helper for UI dropdowns)
    [HttpGet("schools")]
    public async Task<ActionResult<List<School>>> GetSchools()
    {
        return Ok(await _context.Schools.ToListAsync());
    }

    // GET /api/records/teachers (Helper for UI dropdowns)
    [HttpGet("teachers")]
    public async Task<ActionResult<List<Teacher>>> GetTeachers()
    {
        return Ok(await _context.Teachers.ToListAsync());
    }

    // GET /api/records/substitutes (Helper for UI sub selector)
    [HttpGet("substitutes")]
    public async Task<ActionResult<List<Substitute>>> GetSubstitutes()
    {
        return Ok(await _context.Substitutes.ToListAsync());
    }
}
