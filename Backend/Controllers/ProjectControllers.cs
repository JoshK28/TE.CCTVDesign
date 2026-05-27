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
    [Authorize]
    public class ProjectController(AppDbContext context) : ControllerBase
    {
        // extract user id from JWT token
        private int GetUserId() =>
            int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out int id) ? id : 0;

        // POST api/projects/create
        [HttpPost("create")]
        public async Task<IActionResult> CreateProject([FromForm] CreateProjectDto dto)
        {
            var userId = GetUserId();
            if (userId == 0) return Unauthorized("User not found");

            var project = new Project
            {
                Title = dto.Title,
                Address = dto.Address,
                Description = dto.Description ?? string.Empty,
                UserID = userId
            };

            context.Projects.Add(project);
            await context.SaveChangesAsync();

            // process floor image uploads if provided
            if (dto.FloorImages?.Count > 0)
            {
                var allowedTypes = new[] { "image/jpeg", "image/png" };
                int layer = 1;

                foreach (var image in dto.FloorImages.Where(i => allowedTypes.Contains(i.ContentType)))
                {
                    using var ms = new MemoryStream();
                    await image.CopyToAsync(ms);

                    context.FloorLayouts.Add(new FloorLayout
                    {
                        ProjectID = project.ProjectID,
                        ImageData = ms.ToArray(),
                        ImageContentType = image.ContentType,
                        FileName = image.FileName,
                        Width = 0, Height = 0,
                        Scale = dto.Scale,
                        Layer = layer++
                    });
                }

                await context.SaveChangesAsync();
            }

            return Ok(new
            {
                project.ProjectID, project.Title,
                project.Address, project.Description,
                FloorLayoutsUploaded = dto.FloorImages?.Count ?? 0
            });
        }

        // GET api/projects — returns only projects belonging to the logged in user
        [HttpGet]
        public async Task<IActionResult> GetProjects()
        {
            var userId = GetUserId();
            if (userId == 0) return Unauthorized("User not found");

            var projects = await context.Projects
                .Where(p => p.UserID == userId)
                .Select(p => new { p.ProjectID, p.Title, p.Address, p.Description, p.UserID })
                .ToListAsync();

            return Ok(projects);
        }

        // GET api/projects/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetProject(int id)
        {
            var project = await context.Projects
                .Include(p => p.FloorLayouts)
                .FirstOrDefaultAsync(p => p.ProjectID == id && p.UserID == GetUserId());

            if (project == null) return NotFound("Project not found");

            // omit ImageData and navigation properties to avoid large payloads and circular references
            return Ok(new
            {
                project.ProjectID, project.Title,
                project.Address, project.Description, project.UserID,
                FloorLayouts = project.FloorLayouts.Select(f => new
                {
                    f.FloorID, f.FileName, f.Layer,
                    f.Scale, f.Width, f.Height, f.ImageContentType
                })
            });
        }

        // PUT api/projects/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProject(int id, [FromBody] CreateProjectDto dto)
        {
            var project = await context.Projects
                .FirstOrDefaultAsync(p => p.ProjectID == id && p.UserID == GetUserId());

            if (project == null) return NotFound("Project not found");

            (project.Title, project.Address, project.Description) =
                (dto.Title, dto.Address, dto.Description ?? string.Empty);

            await context.SaveChangesAsync();
            return Ok(new { project.ProjectID, project.Title, project.Address, project.Description });
        }

        // DELETE api/projects/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProject(int id)
        {
            var project = await context.Projects
                .FirstOrDefaultAsync(p => p.ProjectID == id && p.UserID == GetUserId());

            if (project == null) return NotFound("Project not found");

            context.Projects.Remove(project);
            await context.SaveChangesAsync();
            return Ok("Project deleted successfully");
        }
    }
}