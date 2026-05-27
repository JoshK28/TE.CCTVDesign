using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/floorlayouts")]
    public class FloorLayoutController(AppDbContext context) : ControllerBase
    {
        // GET api/floorlayouts/{projectId} — excludes image data to keep response small
        [HttpGet("{projectId}")]
        public async Task<IActionResult> GetFloorLayouts(int projectId) =>
            Ok(await context.FloorLayouts
                .Where(f => f.ProjectID == projectId)
                .OrderBy(f => f.Layer)
                .Select(f => new
                {
                    f.FloorID, f.ProjectID, f.FileName,
                    f.Width, f.Height, f.Scale, f.Layer
                })
                .ToListAsync());

        // GET api/floorlayouts/image/{floorId} — returns raw image bytes
        [HttpGet("image/{floorId}")]
        public async Task<IActionResult> GetFloorImage(int floorId)
        {
            var layout = await context.FloorLayouts.FindAsync(floorId);
            return layout == null ? NotFound("Floor layout image not found")
                : File(layout.ImageData, layout.ImageContentType);
        }

        // POST api/floorlayouts/upload/{projectId} — stores image as binary in database
        [HttpPost("upload/{projectId}")]
        public async Task<IActionResult> UploadFloorLayout(int projectId, IFormFile file, [FromForm] string scale, [FromForm] int layer)
        {
            if (file == null || file.Length == 0) return BadRequest("No file uploaded");

            var allowedTypes = new[] { "image/jpeg", "image/png" };
            if (!allowedTypes.Contains(file.ContentType)) return BadRequest("Only JPG and PNG files are allowed");

            if (await context.Projects.FindAsync(projectId) == null) return NotFound("Project not found");

            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);

            var floorLayout = new FloorLayout
            {
                ProjectID = projectId,
                ImageData = ms.ToArray(),
                ImageContentType = file.ContentType,
                FileName = file.FileName,
                Width = 0, Height = 0,
                Scale = scale,
                Layer = layer
            };

            context.FloorLayouts.Add(floorLayout);
            await context.SaveChangesAsync();

            return Ok(new
            {
                floorLayout.FloorID, floorLayout.FileName,
                floorLayout.Width, floorLayout.Height,
                floorLayout.Scale, floorLayout.Layer
            });
        }

        // DELETE api/floorlayouts/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFloorLayout(int id)
        {
            var layout = await context.FloorLayouts.FindAsync(id);
            if (layout == null) return NotFound("Floor layout not found");

            context.FloorLayouts.Remove(layout);
            await context.SaveChangesAsync();
            return Ok("Floor layout deleted successfully");
        }
    }
}