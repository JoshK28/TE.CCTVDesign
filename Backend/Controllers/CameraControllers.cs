using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/cameras")]
    public class CameraController(AppDbContext context) : ControllerBase
    {
        // GET api/cameras — supports filtering by search, brand, type, resolution
        [HttpGet]
        public async Task<IActionResult> GetCameras(
            [FromQuery] string? search,
            [FromQuery] List<string>? brand,
            [FromQuery] List<string>? type,
            [FromQuery] List<string>? resolution,
            [FromQuery] int limit = 500)
        {
            var query = context.Cameras.AsNoTracking().AsQueryable();

            if (!string.IsNullOrEmpty(search))    query = query.Where(c => c.ModelNumber.Contains(search));
            if (brand is { Count: > 0 })          query = query.Where(c => brand.Contains(c.Brand));
            if (type is { Count: > 0 })           query = query.Where(c => type.Contains(c.Type));
            if (resolution is { Count: > 0 })     query = query.Where(c => resolution.Contains(c.Resolution));

            var cameras = await query
                .OrderBy(c => c.Brand).ThenBy(c => c.ModelNumber)
                .Take(Math.Clamp(limit, 1, 1000))
                .ToListAsync();

            return Ok(cameras);
        }

        // GET api/cameras/brands — distinct brand names for filter dropdown
        [HttpGet("brands")]
        public async Task<IActionResult> GetBrands() =>
            Ok(await context.Cameras
                .AsNoTracking()
                .Where(c => c.Brand != null && c.Brand != string.Empty)
                .Select(c => c.Brand)
                .Distinct()
                .OrderBy(b => b)
                .ToListAsync());

        // GET api/cameras/{id}
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetCamera(int id)
        {
            var camera = await context.Cameras.FindAsync(id);
            return camera == null ? NotFound("Camera not found") : Ok(camera);
        }
    }
}