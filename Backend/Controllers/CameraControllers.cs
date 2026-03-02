using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/cameras")]
    public class CameraController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CameraController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetCameras()
        {
            var cameras = await _context.Cameras.ToListAsync();
            return Ok(cameras);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCamera(int id)
        {
            var camera = await _context.Cameras.FindAsync(id);
            if (camera == null)
                return NotFound("Camera not found");
            return Ok(camera);
        }
    }
}