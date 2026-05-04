using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Backend.DTOs;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/walls")]
    public class WallController : ControllerBase
    {
        private readonly AppDbContext _context;

        public WallController(AppDbContext context)
        {
            _context = context;
        }

        // saves all walls for a floor layout
        [HttpPost("save/{floorId}")]
        public async Task<IActionResult> SaveWalls(int floorId, List<WallDto> walls)
        {
            var floor = await _context.FloorLayouts.FindAsync(floorId);
            if (floor == null)
                return NotFound("Floor layout not found");

            // delete existing walls for this floor
            var existing = _context.Walls.Where(w => w.FloorID == floorId);
            _context.Walls.RemoveRange(existing);

            // add new walls
            foreach (var wall in walls)
            {
                _context.Walls.Add(new Wall
                {
                    FloorID = floorId,
                    X1 = wall.X1,
                    Y1 = wall.Y1,
                    X2 = wall.X2,
                    Y2 = wall.Y2,
                    Length = wall.Length,
                    RealWorldLength = wall.RealWorldLength,
                    RealWorldHeight = wall.RealWorldHeight
                });
            }

            await _context.SaveChangesAsync();
            return Ok("Walls saved successfully");
        }

        // gets all walls for a floor layout
        [HttpGet("{floorId}")]
        public async Task<IActionResult> GetWalls(int floorId)
        {
            var walls = await _context.Walls
                .Where(w => w.FloorID == floorId)
                .ToListAsync();

            return Ok(walls);
        }
    }
}