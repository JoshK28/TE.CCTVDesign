using Backend.Data;
using Backend.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

// create the web application builder
var builder = WebApplication.CreateBuilder(args);

// allows the app to use controllers
builder.Services.AddControllers();

// connects the app to the SQL Server database
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("Default")
    );
});

// registers the JwtService so it can be used in controllers
builder.Services.AddScoped<JwtService>();

// sets up JWT authentication so the backend can read and validate tokens
// the token is sent from the frontend with every request
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

// sets up CORS so the React frontend can talk to the backend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// sets up Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// build the app
var app = builder.Build();

// enable Swagger
app.UseSwagger();
app.UseSwaggerUI();

// apply CORS policy
app.UseCors("AllowReact");

// enable authentication and authorization
// authentication must come before authorization
app.UseAuthentication();
app.UseAuthorization();

// allows serving static files
app.UseStaticFiles();

// maps all controller routes
app.MapControllers();

// start the React frontend automatically when backend starts
if (app.Environment.IsDevelopment())
{
    var frontendPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "Frontend");
    // start the frontend
    // start the frontend
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
    
    // open browser after a short delay
    _ = Task.Run(async () =>
    {
        await Task.Delay(3000); // wait 3 seconds for frontend to start
        System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
        {
            FileName = "http://localhost:5173",
            UseShellExecute = true
        });
    });

    }

// start the app
app.Run();


