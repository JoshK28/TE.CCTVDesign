using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using System.Security.Claims;
using Backend.DTOs;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/customcameras")]
    [Authorize]
    public class CustomCameraController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CustomCameraController(AppDbContext context)
        {
            _context = context;
        }

        private int GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out int userId) ? userId : 0;
        }

        // GET /api/customcameras
        // returns all custom cameras globally (any user can see all custom cameras)
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var cameras = await _context.CustomCameras
                .Select(c => new
                {
                    c.CustomCameraId,
                    c.ModelNumber,
                    c.Description,
                    c.Brand,
                    c.Type,
                    c.Resolution,
                    c.Range,
                    c.LensSize,
                    c.LensType,
                    c.FovHorizontal,
                    c.FovVertical,
                    c.FovDiagonal,
                    c.IrRange,
                    c.Aperture,
                    c.OperatingTemp,
                    c.Price,
                    c.PowerConsumption,
                    c.Bitrate,
                    c.CreatedAt,
                    c.CreatedByUserId
                })
                .ToListAsync();

            return Ok(cameras);
        }

        // GET /api/customcameras/{id}
        // returns a single custom camera by id
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var camera = await _context.CustomCameras
                .Where(c => c.CustomCameraId == id)
                .Select(c => new
                {
                    c.CustomCameraId,
                    c.ModelNumber,
                    c.Description,
                    c.Brand,
                    c.Type,
                    c.Resolution,
                    c.Range,
                    c.LensSize,
                    c.LensType,
                    c.FovHorizontal,
                    c.FovVertical,
                    c.FovDiagonal,
                    c.IrRange,
                    c.Aperture,
                    c.OperatingTemp,
                    c.Price,
                    c.PowerConsumption,
                    c.Bitrate,
                    c.CreatedAt,
                    c.CreatedByUserId
                })
                .FirstOrDefaultAsync();

            if (camera == null)
                return NotFound("Custom camera not found");

            return Ok(camera);
        }

        // POST /api/customcameras
        // creates a new custom camera, linked to the logged in user
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CustomCameraDto dto)
        {
            var userId = GetUserId();
            if (userId == 0)
                return Unauthorized("User not found");

            var camera = new CustomCamera
            {
                CreatedByUserId = userId,
                ModelNumber = dto.ModelNumber,
                Description = dto.Description,
                Brand = dto.Brand,
                Type = dto.Type,
                Resolution = dto.Resolution,
                Range = dto.Range,
                LensSize = dto.LensSize,
                LensType = dto.LensType,
                FovHorizontal = dto.FovHorizontal,
                FovVertical = dto.FovVertical,
                FovDiagonal = dto.FovDiagonal,
                IrRange = dto.IrRange,
                Aperture = dto.Aperture,
                OperatingTemp = dto.OperatingTemp,
                Price = dto.Price,
                PowerConsumption = dto.PowerConsumption,
                Bitrate = dto.Bitrate,
                CreatedAt = DateTime.UtcNow
            };

            _context.CustomCameras.Add(camera);
            await _context.SaveChangesAsync();

            return Ok(new { camera.CustomCameraId, camera.ModelNumber, camera.Brand });
        }

        // PUT /api/customcameras/{id}
        // updates an existing custom camera - any user can edit since they are global
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CustomCameraDto dto)
        {
            var camera = await _context.CustomCameras.FindAsync(id);
            if (camera == null)
                return NotFound("Custom camera not found");

            camera.ModelNumber = dto.ModelNumber;
            camera.Description = dto.Description;
            camera.Brand = dto.Brand;
            camera.Type = dto.Type;
            camera.Resolution = dto.Resolution;
            camera.Range = dto.Range;
            camera.LensSize = dto.LensSize;
            camera.LensType = dto.LensType;
            camera.FovHorizontal = dto.FovHorizontal;
            camera.FovVertical = dto.FovVertical;
            camera.FovDiagonal = dto.FovDiagonal;
            camera.IrRange = dto.IrRange;
            camera.Aperture = dto.Aperture;
            camera.OperatingTemp = dto.OperatingTemp;
            camera.Price = dto.Price;
            camera.PowerConsumption = dto.PowerConsumption;
            camera.Bitrate = dto.Bitrate;

            await _context.SaveChangesAsync();

            return Ok(new { camera.CustomCameraId, camera.ModelNumber, camera.Brand });
        }

        // DELETE /api/customcameras/{id}
        // deletes a custom camera - only the creator can delete it
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = GetUserId();

            var camera = await _context.CustomCameras.FindAsync(id);
            if (camera == null)
                return NotFound("Custom camera not found");

            if (camera.CreatedByUserId != userId)
                return Forbid();

            _context.CustomCameras.Remove(camera);
            await _context.SaveChangesAsync();

            return Ok("Custom camera deleted");
        }
    }
}