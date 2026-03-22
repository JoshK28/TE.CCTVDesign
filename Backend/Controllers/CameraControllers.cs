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

        // handles GET requests to /api/cameras
        // returns a list of all cameras in the database
        [HttpGet]
        public async Task<IActionResult> GetCameras()
        {
            // get all cameras from the database and return them
            var cameras = await _context.Cameras.ToListAsync();
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