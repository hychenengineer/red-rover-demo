using RedRover.Api.Models;

namespace RedRover.Api.Data;

public static class DbInitializer
{
    public static void Initialize(AppDbContext context)
    {
        context.Database.EnsureCreated();

        if (context.Schools.Any())
        {
            return; // DB already seeded
        }

        // 1. Seed Schools
        var lincolnHigh = new School { Name = "Lincoln High School", Level = "High School", Address = "100 Education Way, Columbus, OH" };
        var rooseveltMid = new School { Name = "Roosevelt Middle School", Level = "Middle School", Address = "240 Valley Rd, Columbus, OH" };
        var washingtonElem = new School { Name = "Washington Elementary", Level = "Elementary", Address = "50 Maple St, Columbus, OH" };
        context.Schools.AddRange(lincolnHigh, rooseveltMid, washingtonElem);
        context.SaveChanges();

        // 2. Seed Teachers
        var sarah = new Teacher { SchoolId = lincolnHigh.Id, FullName = "Sarah Johnson", Department = "Science", Email = "s.johnson@district.org", RoomNumber = "Room 204" };
        var robert = new Teacher { SchoolId = lincolnHigh.Id, FullName = "Robert Davis", Department = "Social Studies", Email = "r.davis@district.org", RoomNumber = "Room 112" };
        var emily = new Teacher { SchoolId = rooseveltMid.Id, FullName = "Emily White", Department = "English / Language Arts", Email = "e.white@district.org", RoomNumber = "Room 305" };
        var michael = new Teacher { SchoolId = washingtonElem.Id, FullName = "Michael Chen", Department = "Grade 4", Email = "m.chen@district.org", RoomNumber = "Room 12" };
        context.Teachers.AddRange(sarah, robert, emily, michael);
        context.SaveChanges();

        // 3. Seed Substitutes
        var alex = new Substitute { FullName = "Alex Martinez", Email = "alex.sub@gmail.com", PhoneNumber = "(614) 555-0192", Certifications = "Science, Chemistry, General K-12", IsAvailableToday = true, HoursWorkedThisWeek = 14 };
        var jordan = new Substitute { FullName = "Jordan Lee", Email = "jordan.lee@outlook.com", PhoneNumber = "(614) 555-0144", Certifications = "Math, Physics, General 7-12", IsAvailableToday = true, HoursWorkedThisWeek = 21 };
        var morgan = new Substitute { FullName = "Morgan Taylor", Email = "m.taylor@gmail.com", PhoneNumber = "(614) 555-0188", Certifications = "Elementary K-6, Special Ed", IsAvailableToday = true, HoursWorkedThisWeek = 7 };
        var sam = new Substitute { FullName = "Sam Rivera", Email = "sam.rivera@gmail.com", PhoneNumber = "(614) 555-0177", Certifications = "Social Studies, History", IsAvailableToday = true, HoursWorkedThisWeek = 28 };
        context.Substitutes.AddRange(alex, jordan, morgan, sam);
        context.SaveChanges();

        // 4. Seed Absences (Simulating 80%+ Morning Fill Rate)
        var now = DateTime.UtcNow;
        var absences = new List<Absence>
        {
            // Filled Absences
            new() {
                SchoolId = lincolnHigh.Id, SchoolName = lincolnHigh.Name,
                TeacherId = robert.Id, TeacherName = robert.FullName,
                Subject = "AP US History", RoomNumber = robert.RoomNumber,
                Date = now.Date, StartTime = "07:30 AM", EndTime = "02:45 PM",
                Reason = "Personal Day", Notes = "Students have reading assignment Ch 14.",
                Status = "Filled", AssignedSubId = sam.Id, AssignedSubName = sam.FullName,
                CreatedAt = now.AddHours(-3), FilledAt = now.AddHours(-2).AddMinutes(5)
            },
            new() {
                SchoolId = rooseveltMid.Id, SchoolName = rooseveltMid.Name,
                TeacherId = emily.Id, TeacherName = emily.FullName,
                Subject = "8th Grade English", RoomNumber = emily.RoomNumber,
                Date = now.Date, StartTime = "08:00 AM", EndTime = "03:15 PM",
                Reason = "Professional Development", Notes = "Attending district literacy conference.",
                Status = "Filled", AssignedSubId = jordan.Id, AssignedSubName = jordan.FullName,
                CreatedAt = now.AddHours(-4), FilledAt = now.AddHours(-3).AddMinutes(12)
            },
            new() {
                SchoolId = washingtonElem.Id, SchoolName = washingtonElem.Name,
                TeacherId = michael.Id, TeacherName = michael.FullName,
                Subject = "Grade 4 Classroom", RoomNumber = michael.RoomNumber,
                Date = now.Date, StartTime = "08:15 AM", EndTime = "03:00 PM",
                Reason = "Illness", Notes = "Math worksheets on my desk. Recess duty at 11:30.",
                Status = "Filled", AssignedSubId = morgan.Id, AssignedSubName = morgan.FullName,
                CreatedAt = now.AddHours(-2), FilledAt = now.AddHours(-1).AddMinutes(45)
            },
            // Open Absence (Sarah Johnson - 10th Grade Chemistry) -> Target for Demo claim!
            new() {
                SchoolId = lincolnHigh.Id, SchoolName = lincolnHigh.Name,
                TeacherId = sarah.Id, TeacherName = sarah.FullName,
                Subject = "10th Grade Chemistry", RoomNumber = sarah.RoomNumber,
                Date = now.Date, StartTime = "07:30 AM", EndTime = "02:45 PM",
                Reason = "Illness (Flu)", Notes = "Goggles in Cabinet B. Students working on Lab 4 chemical bonding.",
                Status = "Open", AssignedSubId = null, AssignedSubName = null,
                CreatedAt = now.AddMinutes(-25), FilledAt = null
            }
        };
        context.Absences.AddRange(absences);
        context.SaveChanges();

        // 5. Seed Time & Attendance Entries (Video #4)
        var timeEntries = new List<TimeEntry>
        {
            new() { EmployeeName = "David Miller", Role = "Bus Driver", EntryType = "ClockIn", Timestamp = now.Date.AddHours(6).AddMinutes(12), Hours = 4.5, IsApproved = true },
            new() { EmployeeName = "Maria Gonzales", Role = "Cafeteria Staff", EntryType = "ClockIn", Timestamp = now.Date.AddHours(6).AddMinutes(45), Hours = 5.0, IsApproved = true },
            new() { EmployeeName = "Sarah Johnson", Role = "Teacher", EntryType = "ExtraDuty", Timestamp = now.AddDays(-1), Hours = 1.5, StipendReason = "Period 3 Prep Coverage for Room 104", Amount = 67.50m, IsApproved = true },
            new() { EmployeeName = "Robert Davis", Role = "Teacher", EntryType = "ExtraDuty", Timestamp = now.AddDays(-2), Hours = 2.0, StipendReason = "Varsity Basketball Chaperone", Amount = 90.00m, IsApproved = true }
        };
        context.TimeEntries.AddRange(timeEntries);

        // 6. Seed Personnel Records (Video #5)
        var records = new List<EmployeeRecord>
        {
            new() { FullName = "Sarah Johnson", Role = "Chemistry Teacher", Department = "Science", StateCertificateNumber = "OH-ED-984124", CertificateStatus = "Active", ClearanceValidUntil = DateTime.UtcNow.AddYears(2), HireDate = DateTime.UtcNow.AddYears(-4), DocumentCount = 9 },
            new() { FullName = "Robert Davis", Role = "History Teacher", Department = "Social Studies", StateCertificateNumber = "OH-ED-772159", CertificateStatus = "Active", ClearanceValidUntil = DateTime.UtcNow.AddYears(1), HireDate = DateTime.UtcNow.AddYears(-6), DocumentCount = 12 },
            new() { FullName = "Alex Martinez", Role = "Certified Substitute", Department = "Guest Educator Pool", StateCertificateNumber = "OH-SUB-331902", CertificateStatus = "Active", ClearanceValidUntil = DateTime.UtcNow.AddMonths(9), HireDate = DateTime.UtcNow.AddMonths(-8), DocumentCount = 6 },
            new() { FullName = "David Miller", Role = "Transportation Specialist", Department = "Operations", StateCertificateNumber = "CDL-CLASS-B", CertificateStatus = "Active", ClearanceValidUntil = DateTime.UtcNow.AddMonths(4), HireDate = DateTime.UtcNow.AddYears(-3), DocumentCount = 7 }
        };
        context.EmployeeRecords.AddRange(records);
        context.SaveChanges();
    }
}
