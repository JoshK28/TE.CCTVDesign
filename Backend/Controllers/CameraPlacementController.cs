using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Backend.DTOs;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/camerplacements")]
    public class CameraPlacementController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CameraPlacementController(AppDbContext context)
        {
            _context = context;
        }

        // saves all camera placements for a floor layout
        [HttpPost("save/{floorId}")]
        public async Task<IActionResult> SavePlacements(int floorId, List<CameraPlacementDto> placements)
        {
            // check if the floor layout exists
            var floor = await _context.FloorLayouts.FindAsync(floorId);
            if (floor == null)
                return NotFound("Floor layout not found");

            // delete existing placements for this floor
            var existing = _context.CameraPlacemens
                .Where(c => c.FloorID == floorId);
            _context.CameraPlacemens.RemoveRange(existing);

            // add new placements
            foreach (var placement in placements)
            {
                _context.CameraPlacemens.Add(new CameraPlacement
                {
                    FloorID = floorId,
                    X = placement.X,
                    Y = placement.Y,
                    Rotation = placement.Rotation,
                    Type = placement.Type
                });
            }

            await _context.SaveChangesAsync();
            return Ok("Placements saved successfully");
        }

        // gets all camera placements for a floor layout
        [HttpGet("{floorId}")]
        public async Task<IActionResult> GetPlacements(int floorId)
        {
            var placements = await _context.CameraPlacemens
                .Where(c => c.FloorID == floorId)
                .ToListAsync();

            return Ok(placements);
        }
    }
}