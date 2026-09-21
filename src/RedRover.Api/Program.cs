using Microsoft.EntityFrameworkCore;
using RedRover.Api.Data;
using RedRover.Api.Hubs;
using RedRover.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Database Context (SQLite for local zero-config, switchable to Azure SQL via connection string)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=redrover.db";
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(connectionString));

// 2. Application Domain Services
builder.Services.AddScoped<MatchingEngine>();
builder.Services.AddScoped<NotificationService>();

// 3. Real-Time SignalR Service
builder.Services.AddSignalR();

// 4. CORS Policy for React Vite UI (supports SignalR credentials)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowClient", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// 5. API Controllers & Swagger UI
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Red Rover K-12 HR & Absence Management API", Version = "v1" });
});

var app = builder.Build();

// Seed Database automatically on startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        DbInitializer.Initialize(context);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while seeding the database.");
    }
}

// HTTP request pipeline
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Red Rover API v1");
    c.RoutePrefix = "swagger";
});

app.UseCors("AllowClient");

app.UseRouting();
app.UseAuthorization();

// Route mappings
app.MapControllers();
app.MapHub<AbsenceHub>("/hubs/absences");

app.Run();
