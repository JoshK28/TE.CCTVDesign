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
            var floor = await _context.FloorLayouts.FindAsync(floorId);
            if (floor == null)
                return NotFound("Floor layout not found");

            var existing = _context.CameraPlacemens.Where(c => c.FloorID == floorId);
            _context.CameraPlacemens.RemoveRange(existing);

            foreach (var placement in placements)
            {
                _context.CameraPlacemens.Add(new CameraPlacement
                {
                    FloorID = floorId,
                    CameraId = placement.CameraId == 0 ? null : placement.CameraId,
                    NetworkingId = placement.NetworkingId == 0 ? null : placement.NetworkingId,
                    AccessControlId = placement.AccessControlId == 0 ? null : placement.AccessControlId,
                    X = placement.X,
                    Y = placement.Y,
                    Rotation = placement.Rotation,
                    Type = placement.Type,
                    CameraModel = placement.CameraModel,
                    Brand = placement.Brand,
                    Resolution = placement.Resolution
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

        // get all placements for a project across all floors with device details
        [HttpGet("project/{projectId}")]
        public async Task<IActionResult> GetPlacementsByProject(int projectId)
        {
            // get all floor layouts for this project
            var floorIds = await _context.FloorLayouts
                .Where(f => f.ProjectID == projectId)
                .Select(f => f.FloorID)
                .ToListAsync();

            // get all placements across all floors with device details
            var placements = await _context.CameraPlacemens
                .Where(p => floorIds.Contains(p.FloorID))
                .Include(p => p.Camera)
                .Include(p => p.NetworkingDevice)
                .Include(p => p.AccessControlDevice)
                .ToListAsync();

            // group placements by device and count quantities
            var bomItems = placements
                .GroupBy(p => new { p.Type, p.CameraId, p.NetworkingId, p.AccessControlId })
                .Select(g =>
                {
                    var first = g.First();
                    string name = "Unknown Device";
                    string manufacturer = "";
                    string type = first.Type;
                    string price = "0";

                    if (first.Camera != null)
                    {
                        name = first.Camera.ModelNumber;
                        manufacturer = first.Camera.Brand;
                        type = first.Camera.Type;
                        price = first.Camera.Price;
                    }
                    else if (first.NetworkingDevice != null)
                    {
                        name = first.NetworkingDevice.Name;
                        manufacturer = first.NetworkingDevice.Manufacturer;
                        type = first.NetworkingDevice.Type;
                        price = first.NetworkingDevice.Price;
                    }
                    else if (first.AccessControlDevice != null)
                    {
                        name = first.AccessControlDevice.Name;
                        manufacturer = first.AccessControlDevice.Manufacturer;
                        type = first.AccessControlDevice.Type;
                        price = first.AccessControlDevice.Price;
                    }

                    // calculate average price from range e.g. "$480-$650"
                    double avgPrice = 0;
                    try
                    {
                        var cleanPrice = price.Replace("$", "").Replace(",", "");
                        if (cleanPrice.Contains("–") || cleanPrice.Contains("-"))
                        {
                            var separator = cleanPrice.Contains("–") ? "–" : "-";
                            var parts = cleanPrice.Split(separator);
                            if (parts.Length == 2 &&
                                double.TryParse(parts[0].Trim(), out double low) &&
                                double.TryParse(parts[1].Trim(), out double high))
                            {
                                avgPrice = (low + high) / 2;
                            }
                        }
                        else if (double.TryParse(cleanPrice.Trim(), out double single))
                        {
                            avgPrice = single;
                        }
                    }
                    catch { avgPrice = 0; }

                    return new
                    {
                        name,
                        manufacturer,
                        type,
                        quantity = g.Count(),
                        unitPrice = avgPrice,
                        category = first.Camera != null ? "Camera" :
                                first.NetworkingDevice != null ? "Networking" :
                                first.AccessControlDevice != null ? "Access Control" : "Other"
                    };
                })
                .ToList();

            return Ok(bomItems);
        }
    }
}