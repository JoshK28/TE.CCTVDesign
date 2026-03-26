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
    // 1. Add these parameters so C# knows to look for them in the URL
    public async Task<IActionResult> GetCameras([FromQuery] string? search, [FromQuery] string? brand)
    {
        // 2. Instead of getting the list immediately, create a "Queryable"
        var query = _context.Cameras.AsQueryable();

        // 3. Only apply the filter if the user actually typed something
        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(c => c.ModelNumber.Contains(search));
        }

        if (!string.IsNullOrEmpty(brand))
        {
            query = query.Where(c => c.Brand == brand);
        }

        // 4. NOW it executes the filtered SQL command
        var cameras = await query.ToListAsync(); 
        
        return Ok(cameras);
    }

        // handles GET requests to /api/cameras/{id}
        // returns a single camera based on the id provided
        // example: /api/cameras/1 returns the camera with id 1
        [HttpGet("{id}")]
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