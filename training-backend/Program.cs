using Microsoft.EntityFrameworkCore;
using training_backend.Data;
using training_backend.Services;
using training_backend.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("MatateniFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
              {
                  if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                  {
                      return false;
                  }

                  return uri.Scheme is "http" or "https"
                         && (uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
                             || uri.Host.Equals("127.0.0.1"));
              })
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<ITrainingService, TrainingService>();
builder.Services.AddScoped<IFeedbackService, FeedbackService>();
builder.Services.AddScoped<ITrainerReportService, TrainerReportService>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

await DatabaseInitializer.InitializeAsync(app.Services);

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("MatateniFrontend");
app.UseAuthorization();

app.MapControllers();

app.Run();
