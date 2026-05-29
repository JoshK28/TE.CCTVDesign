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
    public class ObstacleController(AppDbContext context) : ControllerBase
    {
        // GET api/obstacles/floor/{floorId}
        [HttpGet("floor/{floorId}")]
        public async Task<IActionResult> GetByFloor(int floorId) =>
            Ok(await context.Obstacles
                .Where(o => o.FloorID == floorId)
                .Select(o => new
                {
                    o.ObstacleId, o.FloorID, o.Label,
                    o.X, o.Y, o.Width, o.Height, o.Rotation, o.Color
                })
                .ToListAsync());

        // POST api/obstacles
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Obstacle dto)
        {
            var obstacle = new Obstacle
            {
                FloorID = dto.FloorID, Label = dto.Label,
                X = dto.X, Y = dto.Y, Width = dto.Width,
                Height = dto.Height, Rotation = dto.Rotation, Color = dto.Color
            };

            context.Obstacles.Add(obstacle);
            await context.SaveChangesAsync();
            return Ok(new { obstacle.ObstacleId, obstacle.Label, obstacle.FloorID });
        }

        // PUT api/obstacles/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Obstacle dto)
        {
            var obstacle = await context.Obstacles.FindAsync(id);
            if (obstacle == null) return NotFound("Obstacle not found");

            (obstacle.Label, obstacle.X, obstacle.Y, obstacle.Width,
             obstacle.Height, obstacle.Rotation, obstacle.Color) =
                (dto.Label, dto.X, dto.Y, dto.Width,
                 dto.Height, dto.Rotation, dto.Color);

            await context.SaveChangesAsync();
            return Ok(new { obstacle.ObstacleId, obstacle.Label, obstacle.FloorID });
        }

        // DELETE api/obstacles/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var obstacle = await context.Obstacles.FindAsync(id);
            if (obstacle == null) return NotFound("Obstacle not found");

            context.Obstacles.Remove(obstacle);
            await context.SaveChangesAsync();
            return Ok("Obstacle deleted");
        }

        // DELETE api/obstacles/floor/{floorId} — removes all obstacles for a floor
        [HttpDelete("floor/{floorId}")]
        public async Task<IActionResult> DeleteAllForFloor(int floorId)
        {
            var obstacles = await context.Obstacles.Where(o => o.FloorID == floorId).ToListAsync();
            context.Obstacles.RemoveRange(obstacles);
            await context.SaveChangesAsync();
            return Ok($"{obstacles.Count} obstacles deleted");
        }

        // POST api/obstacles/save/{floorId} — replaces all obstacles for a floor
        [HttpPost("save/{floorId}")]
        public async Task<IActionResult> SaveAll(int floorId, [FromBody] List<Obstacle> obstacles)
        {
            context.Obstacles.RemoveRange(
                await context.Obstacles.Where(o => o.FloorID == floorId).ToListAsync()
            );

            var newObstacles = obstacles.Select(o => new Obstacle
            {
                FloorID = floorId, Label = o.Label,
                X = o.X, Y = o.Y, Width = o.Width,
                Height = o.Height, Rotation = o.Rotation, Color = o.Color
            }).ToList();

            context.Obstacles.AddRange(newObstacles);
            var projectId = await context.FloorLayouts
                .Where(f => f.FloorID == floorId)
                .Select(f => f.ProjectID)
                .FirstOrDefaultAsync();
            if (projectId != 0)
            {
                var project = await context.Projects.FindAsync(projectId);
                if (project != null)
                    project.LastEditedAt = DateTime.UtcNow;
            }

            await context.SaveChangesAsync();
            return Ok(new { saved = newObstacles.Count });
        }
    }
}