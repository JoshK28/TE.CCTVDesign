using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Backend.DTOs;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/projects")]
    public class ProjectController : ControllerBase
    {
        private readonly AppDbContext _context;

        // sets up the controller with the database
        // removed IWebHostEnvironment since we no longer need wwwroot
        public ProjectController(AppDbContext context)
        {
            _context = context;
        }

        // handles POST requests to /api/projects/create
        // creates a new project and saves floor images directly to the database
        [HttpPost("create")]
        public async Task<IActionResult> CreateProject([FromForm] CreateProjectDto dto)
        {
            // create a new project using the data from the form
            var project = new Project
            {
                Title = dto.Title,
                Address = dto.Address,
                Description = dto.Description,
                UserID = 1, // temporary - will be replaced with logged in user id
                ClientID = 1 // temporary - will be replaced with client id
            };

            // save the new project to the database first to get the ProjectID
            _context.Projects.Add(project);
            await _context.SaveChangesAsync();

            // handle floor image uploads if any were provided
            if (dto.FloorImages != null && dto.FloorImages.Count > 0)
            {
                // loop through each uploaded floor image
                int layerNumber = 1;
                foreach (var image in dto.FloorImages)
                {
                    // check if the file is a valid image type
                    var allowedTypes = new[] { "image/jpeg", "image/png" };
                    if (!allowedTypes.Contains(image.ContentType))
                        continue; // skip invalid files

                    // convert the image to bytes to store in the database
                    using var memoryStream = new MemoryStream();
                    await image.CopyToAsync(memoryStream);
                    var imageBytes = memoryStream.ToArray();

                    // save the floor layout details and image bytes to the database
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

                // save all floor layouts to the database
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
        // returns a list of all projects in the database
        [HttpGet]
        public async Task<IActionResult> GetProjects()
        {
            // get all projects from the database and return them
            // excludes image data to keep the response small and fast
            var projects = await _context.Projects
                .Select(p => new
                {
                    p.ProjectID,
                    p.Title,
                    p.Address,
                    p.Description,
                    p.UserID,
                    p.ClientID
                })
                .ToListAsync();
            return Ok(projects);
        }

        // handles GET requests to /api/projects/{id}
        // returns a single project based on the id provided
        [HttpGet("{id}")]
        public async Task<IActionResult> GetProject(int id)
        {
            // look for a project with the provided id
            // also load the floor layouts for the project
            var project = await _context.Projects
                .Include(p => p.FloorLayouts)
                .FirstOrDefaultAsync(p => p.ProjectID == id);

            // if no project found return an error
            if (project == null)
                return NotFound("Project not found");

            return Ok(project);
        }

        // handles DELETE requests to /api/projects/{id}
        // deletes a project from the database
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProject(int id)
        {
            // look for the project to delete
            var project = await _context.Projects.FindAsync(id);

            // if no project found return an error
            if (project == null)
                return NotFound("Project not found");

            // remove the project and save changes
            // floor layouts will be deleted automatically due to cascade delete
            _context.Projects.Remove(project);
            await _context.SaveChangesAsync();

            return Ok("Project deleted successfully");
        }
    }
}