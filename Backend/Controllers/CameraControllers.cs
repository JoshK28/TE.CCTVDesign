using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/cameras")] // all routes in this controller start with /api/cameras
    public class CameraController : ControllerBase
    {
        private readonly AppDbContext _context; // used to talk to the database

        // sets up the controller with the database
        public CameraController(AppDbContext context)
        {
            _context = context;
        }

    [HttpGet]
    public async Task<IActionResult> GetCameras(
        [FromQuery] string? search,
        [FromQuery] List<string>? brand,
        [FromQuery] List<string>? type,
        [FromQuery] List<string>? resolution,
        [FromQuery] int limit = 500)
    {
        var query = _context.Cameras.AsNoTracking().AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(c => c.ModelNumber.Contains(search));
        }

        if (brand is { Count: > 0 })
        {
            query = query.Where(c => brand.Contains(c.Brand));
        }

        if (type is { Count: > 0 })
        {
            query = query.Where(c => type.Contains(c.Type));
        }

        if (resolution is { Count: > 0 })
        {
            query = query.Where(c => resolution.Contains(c.Resolution));
        }

        var take = Math.Clamp(limit, 1, 1000);
        var cameras = await query
            .OrderBy(c => c.Brand)
            .ThenBy(c => c.ModelNumber)
            .Take(take)
            .ToListAsync();

        return Ok(cameras);
    }

    /// <summary>Distinct manufacturer names for filter dropdowns (small payload).</summary>
    [HttpGet("brands")]
    public async Task<IActionResult> GetBrands()
    {
        var brands = await _context.Cameras
            .AsNoTracking()
            .Where(c => c.Brand != null && c.Brand != string.Empty)
            .Select(c => c.Brand)
            .Distinct()
            .OrderBy(b => b)
            .ToListAsync();

        return Ok(brands);
    }

        // handles GET requests to /api/cameras/{id}
        // returns a single camera based on the id provided
        // example: /api/cameras/1 returns the camera with id 1
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetCamera(int id)
        {
            // look for a camera with the provided id in the database
            var camera = await _context.Cameras.FindAsync(id);

            // if no camera found with that id, return an error
            if (camera == null)
                return NotFound("Camera not found");

            // return the camera details
            return Ok(camera);
        }
    }
}