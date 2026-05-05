using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Backend.DTOs;
using System.Security.Claims;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/projects")]
    [Authorize] // requires login for all endpoints
    public class ProjectController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProjectController(AppDbContext context)
        {
            _context = context;
        }

        // gets the logged in user's id from the JWT token
        private int GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out int userId) ? userId : 0;
        }

        // handles POST requests to /api/projects/create
        // creates a new project linked to the logged in user
        [HttpPost("create")]
        public async Task<IActionResult> CreateProject([FromForm] CreateProjectDto dto)
        {
            // get the logged in user's id from the JWT token
            var userId = GetUserId();
            if (userId == 0)
                return Unauthorized("User not found");

            // create a new project using the data from the form
            var project = new Project
            {
                Title = dto.Title,
                Address = dto.Address,
                Description = dto.Description ?? string.Empty,
                UserID = userId // use actual logged in user id
            };

            // save the new project to the database first to get the ProjectID
            _context.Projects.Add(project);
            await _context.SaveChangesAsync();

            // handle floor image uploads if any were provided
            if (dto.FloorImages != null && dto.FloorImages.Count > 0)
            {
                int layerNumber = 1;
                foreach (var image in dto.FloorImages)
                {
                    var allowedTypes = new[] { "image/jpeg", "image/png" };
                    if (!allowedTypes.Contains(image.ContentType))
                        continue;

                    using var memoryStream = new MemoryStream();
                    await image.CopyToAsync(memoryStream);
                    var imageBytes = memoryStream.ToArray();

                    var floorLayout = new FloorLayout
                    {
                        ProjectID = project.ProjectID,
                        ImageData = imageBytes,
                        ImageContentType = image.ContentType,
                        FileName = image.FileName,
                        Width = 0,
                        Height = 0,
                        Scale = dto.Scale,
                        Layer = layerNumber
                    };

                    _context.FloorLayouts.Add(floorLayout);
                    layerNumber++;
                }

                await _context.SaveChangesAsync();
            }

            return Ok(new
            {
                project.ProjectID,
                project.Title,
                project.Address,
                project.Description,
                FloorLayoutsUploaded = dto.FloorImages?.Count ?? 0
            });
        }

        // handles GET requests to /api/projects
        // only returns projects belonging to the logged in user
        [HttpGet]
        public async Task<IActionResult> GetProjects()
        {
            var userId = GetUserId();
            if (userId == 0)
                return Unauthorized("User not found");

            // filter projects by logged in user
            var projects = await _context.Projects
                .Where(p => p.UserID == userId)
                .Select(p => new
                {
                    p.ProjectID,
                    p.Title,
                    p.Address,
                    p.Description,
                    p.UserID
                })
                .ToListAsync();

            return Ok(projects);
        }

        // handles GET requests to /api/projects/{id}
        // only returns the project if it belongs to the logged in user
        [HttpGet("{id}")]
        public async Task<IActionResult> GetProject(int id)
        {
            var userId = GetUserId();

            var project = await _context.Projects
                .Include(p => p.FloorLayouts)
                .FirstOrDefaultAsync(p => p.ProjectID == id && p.UserID == userId);

            if (project == null)
                return NotFound("Project not found");

            return Ok(project);
        }

        // handles DELETE requests to /api/projects/{id}
        // only deletes the project if it belongs to the logged in user
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProject(int id)
        {
            var userId = GetUserId();

            var project = await _context.Projects
                .FirstOrDefaultAsync(p => p.ProjectID == id && p.UserID == userId);

            if (project == null)
                return NotFound("Project not found");

            _context.Projects.Remove(project);
            await _context.SaveChangesAsync();

            return Ok("Project deleted successfully");
        }
        
        // handles PUT requests to /api/projects/{id}
        // updates a project belonging to the logged in user
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProject(int id, [FromBody] CreateProjectDto dto)
        {
            var userId = GetUserId();

            var project = await _context.Projects
                .FirstOrDefaultAsync(p => p.ProjectID == id && p.UserID == userId);

            if (project == null)
                return NotFound("Project not found");

            project.Title = dto.Title;
            project.Address = dto.Address;
            project.Description = dto.Description ?? string.Empty;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                project.ProjectID,
                project.Title,
                project.Address,
                project.Description
            });
        }
    }
}