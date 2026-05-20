using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/obstacles")]
    [Authorize]
    public class ObstacleController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ObstacleController(AppDbContext context)
        {
            _context = context;
        }

        // GET /api/obstacles/floor/{floorId}
        // returns all obstacles for a given floor layout
        [HttpGet("floor/{floorId}")]
        public async Task<IActionResult> GetByFloor(int floorId)
        {
            var obstacles = await _context.Obstacles
                .Where(o => o.FloorID == floorId)
                .Select(o => new
                {
                    o.ObstacleId,
                    o.FloorID,
                    o.Label,
                    o.X,
                    o.Y,
                    o.Width,
                    o.Height,
                    o.Rotation,
                    o.Color
                })
                .ToListAsync();

            return Ok(obstacles);
        }

        // POST /api/obstacles
        // saves a new obstacle to a floor layout
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Obstacle dto)
        {
            var obstacle = new Obstacle
            {
                FloorID = dto.FloorID,
                Label = dto.Label,
                X = dto.X,
                Y = dto.Y,
                Width = dto.Width,
                Height = dto.Height,
                Rotation = dto.Rotation,
                Color = dto.Color
            };

            _context.Obstacles.Add(obstacle);
            await _context.SaveChangesAsync();

            return Ok(new { obstacle.ObstacleId, obstacle.Label, obstacle.FloorID });
        }

        // PUT /api/obstacles/{id}
        // updates an existing obstacle (e.g. after moving or resizing on canvas)
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Obstacle dto)
        {
            var obstacle = await _context.Obstacles.FindAsync(id);
            if (obstacle == null)
                return NotFound("Obstacle not found");

            obstacle.Label = dto.Label;
            obstacle.X = dto.X;
            obstacle.Y = dto.Y;
            obstacle.Width = dto.Width;
            obstacle.Height = dto.Height;
            obstacle.Rotation = dto.Rotation;
            obstacle.Color = dto.Color;

            await _context.SaveChangesAsync();

            return Ok(new { obstacle.ObstacleId, obstacle.Label, obstacle.FloorID });
        }

        // DELETE /api/obstacles/{id}
        // removes an obstacle from a floor layout
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var obstacle = await _context.Obstacles.FindAsync(id);
            if (obstacle == null)
                return NotFound("Obstacle not found");

            _context.Obstacles.Remove(obstacle);
            await _context.SaveChangesAsync();

            return Ok("Obstacle deleted");
        }

        // DELETE /api/obstacles/floor/{floorId}
        // removes all obstacles for a floor - useful when deleting a floor layout
        [HttpDelete("floor/{floorId}")]
        public async Task<IActionResult> DeleteAllForFloor(int floorId)
        {
            var obstacles = await _context.Obstacles
                .Where(o => o.FloorID == floorId)
                .ToListAsync();

            _context.Obstacles.RemoveRange(obstacles);
            await _context.SaveChangesAsync();

            return Ok($"{obstacles.Count} obstacles deleted");
        }

        // POST /api/obstacles/save/{floorId}
        // replaces all obstacles for a floor - matches the same pattern as walls
        [HttpPost("save/{floorId}")]
        public async Task<IActionResult> SaveAll(int floorId, [FromBody] List<Obstacle> obstacles)
        {
            // delete existing obstacles for this floor
            var existing = await _context.Obstacles
                .Where(o => o.FloorID == floorId)
                .ToListAsync();
            _context.Obstacles.RemoveRange(existing);

            // save the new ones
            var newObstacles = obstacles.Select(o => new Obstacle
            {
                FloorID = floorId,
                Label = o.Label,
                X = o.X,
                Y = o.Y,
                Width = o.Width,
                Height = o.Height,
                Rotation = o.Rotation,
                Color = o.Color,
            }).ToList();

            _context.Obstacles.AddRange(newObstacles);
            await _context.SaveChangesAsync();

            return Ok(new { saved = newObstacles.Count });
        }
    }
}