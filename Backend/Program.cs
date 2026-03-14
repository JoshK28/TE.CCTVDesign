using Backend.Data;
using Backend.Services;
using Microsoft.EntityFrameworkCore;

// create the web application builder
// this sets up the app with all the default settings
var builder = WebApplication.CreateBuilder(args);

// allows the app to use controllers
// controllers are the classes that handle incoming requests e.g. AuthController, CameraController
builder.Services.AddControllers();

// connects the app to the SQL Server database
// the connection string is read from appsettings.json
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("Default")
    );
});

// registers the JwtService so it can be used in controllers
// this service is responsible for creating login tokens
builder.Services.AddScoped<JwtService>();

// sets up CORS (Cross Origin Resource Sharing)
// this allows the React frontend to make requests to this backend
// without CORS the browser would block all requests from the frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
        policy.AllowAnyOrigin()  // allows requests from any URL
              .AllowAnyHeader()  // allows any request headers
              .AllowAnyMethod()); // allows GET, POST, PUT, DELETE etc
});

// sets up Swagger which is a tool for testing the API in the browser
// accessible at http://localhost:5113/swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// build the app with all the services registered above
var app = builder.Build();

// enable Swagger in the browser
app.UseSwagger();
app.UseSwaggerUI();

// apply the CORS policy so the React frontend can talk to the backend
app.UseCors("AllowReact");

// enables authorization so protected routes can be secured in the future
app.UseAuthorization();

// maps all controller routes so the app knows which controller handles which request
app.MapControllers();

// start the app and keep it running
app.Run();