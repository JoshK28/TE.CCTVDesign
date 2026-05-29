using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Backend.DTOs;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/walls")]
    public class WallController(AppDbContext context) : ControllerBase
    {
        // GET api/walls/{floorId}
        [HttpGet("{floorId}")]
        public async Task<IActionResult> GetWalls(int floorId) =>
            Ok(await context.Walls.Where(w => w.FloorID == floorId).ToListAsync());

        // POST api/walls/save/{floorId} — replaces all walls for a floor
        [HttpPost("save/{floorId}")]
        public async Task<IActionResult> SaveWalls(int floorId, List<WallDto> walls)
        {
            if (await context.FloorLayouts.FindAsync(floorId) == null)
                return NotFound("Floor layout not found");

            // remove existing walls then add the new set
            context.Walls.RemoveRange(context.Walls.Where(w => w.FloorID == floorId));

            context.Walls.AddRange(walls.Select(w => new Wall
            {
                FloorID = floorId,
                X1 = w.X1, Y1 = w.Y1,
                X2 = w.X2, Y2 = w.Y2,
                Length = w.Length,
                RealWorldLength = w.RealWorldLength,
                RealWorldHeight = w.RealWorldHeight
            }));

            await context.SaveChangesAsync();
            return Ok("Walls saved successfully");
        }
    }
}