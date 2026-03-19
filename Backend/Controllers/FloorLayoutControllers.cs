using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/floorlayouts")] // all routes start with /api/floorlayouts
    public class FloorLayoutController : ControllerBase
    {
        private readonly AppDbContext _context;

        // sets up the controller with the database
        // removed IWebHostEnvironment since we no longer need wwwroot
        public FloorLayoutController(AppDbContext context)
        {
            _context = context;
        }

        // handles POST requests to /api/floorlayouts/upload/{projectId}
        // uploads a floor layout image and saves it directly to the database
        [HttpPost("upload/{projectId}")]
        public async Task<IActionResult> UploadFloorLayout(int projectId, IFormFile file, [FromForm] string scale, [FromForm] int layer)
        {
            // check if a file was actually provided
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            // check if the file is a valid image type
            var allowedTypes = new[] { "image/jpeg", "image/png" };
            if (!allowedTypes.Contains(file.ContentType))
                return BadRequest("Only JPG and PNG files are allowed");

            // check if the project exists
            var project = await _context.Projects.FindAsync(projectId);
            if (project == null)
                return NotFound("Project not found");

            // convert the image to bytes to store in the database
            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);
            var imageBytes = memoryStream.ToArray();

            // save the floor layout details and image bytes to the database
            var floorLayout = new FloorLayout
            {
                ProjectID = projectId,
                ImageData = imageBytes,
                ImageContentType = file.ContentType,
                FileName = file.FileName,
                Width = 0, // will be set by frontend
                Height = 0, // will be set by frontend
                Scale = scale,
                Layer = layer
            };

            _context.FloorLayouts.Add(floorLayout);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                floorLayout.FloorID,
                floorLayout.FileName,
                floorLayout.Width,
                floorLayout.Height,
                floorLayout.Scale,
                floorLayout.Layer
            });
        }

        // handles GET requests to /api/floorlayouts/image/{floorId}
        // returns the actual image for a specific floor layout
        [HttpGet("image/{floorId}")]
        public async Task<IActionResult> GetFloorImage(int floorId)
        {
            // look for the floor layout in the database
            var layout = await _context.FloorLayouts.FindAsync(floorId);
            if (layout == null)
                return NotFound("Floor layout image not found");

            // return the image bytes with the correct content type
            // this allows the frontend to display it as an image
            return File(layout.ImageData, layout.ImageContentType);
        }

        // handles GET requests to /api/floorlayouts/{projectId}
        // returns all floor layouts for a specific project (without image data)
        [HttpGet("{projectId}")]
        public async Task<IActionResult> GetFloorLayouts(int projectId)
        {
            // get all floor layouts for the project ordered by layer number
            // excludes image data to keep the response small and fast
            var layouts = await _context.FloorLayouts
                .Where(f => f.ProjectID == projectId)
                .OrderBy(f => f.Layer)
                .Select(f => new
                {
                    f.FloorID,
                    f.ProjectID,
                    f.FileName,
                    f.Width,
                    f.Height,
                    f.Scale,
                    f.Layer
                })
                .ToListAsync();

            return Ok(layouts);
        }

        // handles DELETE requests to /api/floorlayouts/{id}
        // deletes a floor layout from the database
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFloorLayout(int id)
        {
            // look for the floor layout to delete
            var layout = await _context.FloorLayouts.FindAsync(id);
            if (layout == null)
                return NotFound("Floor layout not found");

            // remove the record from the database
            // no need to delete any files since images are stored in the database
            _context.FloorLayouts.Remove(layout);
            await _context.SaveChangesAsync();

            return Ok("Floor layout deleted successfully");
        }
    }
}
