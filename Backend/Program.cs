using Backend.Data;
using Backend.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("Default")
    );
});

builder.Services.AddScoped<JwtService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)
            ),
            ValidateIssuer = false,
            ValidateAudience = false
        };
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod());
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowReact");
app.UseAuthentication();
app.UseAuthorization();
app.UseStaticFiles();
app.MapControllers();

if (app.Environment.IsDevelopment())
{
    var frontendPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "Frontend");

    // start frontend after a short delay to allow previous process to close
    _ = Task.Run(async () =>
    {
        // wait for any previous frontend process to fully close
        await Task.Delay(1000);

        var npmProcess = new System.Diagnostics.Process
        {
            StartInfo = new System.Diagnostics.ProcessStartInfo
            {
                FileName = "cmd.exe",
                Arguments = "/c npm run dev",
                WorkingDirectory = frontendPath,
                UseShellExecute = false,
                CreateNoWindow = true
            }
        };
        npmProcess.Start();

        // stop the frontend when the backend stops
        var lifetime = app.Services.GetRequiredService<IHostApplicationLifetime>();
        lifetime.ApplicationStopping.Register(() =>
        {
            try
            {
                if (!npmProcess.HasExited)
                {
                    npmProcess.Kill(true);
                    npmProcess.WaitForExit();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to stop frontend: {ex.Message}");
            }
        });

        // open browser after frontend has had time to start
        await Task.Delay(3000);
        System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
        {
            FileName = "http://localhost:5173",
            UseShellExecute = true
        });
    });
}

app.Run();