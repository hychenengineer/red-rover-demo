using Microsoft.EntityFrameworkCore;
using RedRover.Api.Models;

namespace RedRover.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<School> Schools => Set<School>();
    public DbSet<Teacher> Teachers => Set<Teacher>();
    public DbSet<Substitute> Substitutes => Set<Substitute>();
    public DbSet<Absence> Absences => Set<Absence>();
    public DbSet<TimeEntry> TimeEntries => Set<TimeEntry>();
    public DbSet<EmployeeRecord> EmployeeRecords => Set<EmployeeRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure concurrency token for Absence
        modelBuilder.Entity<Absence>()
            .Property(a => a.Version)
            .IsConcurrencyToken();
    }
}
