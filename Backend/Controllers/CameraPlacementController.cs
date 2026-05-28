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
                    Resolution = placement.Resolution,
                    ModelName = placement.ModelName ?? string.Empty,
                    Subtype = placement.Subtype ?? string.Empty,
                    CostPerUnit = placement.CostPerUnit,
                    SettingsJson = placement.SettingsJson,
                    FocalLength = placement.FocalLength,
                    SensorType = placement.SensorType,
                    CorridorMode = placement.CorridorMode,
                    IrRange = placement.IrRange
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
                        .Select(c => new CameraPlacementDto
                        {
                            FloorID = c.FloorID,
                            CameraId = c.CameraId,
                            NetworkingId = c.NetworkingId,
                            AccessControlId = c.AccessControlId,

                            X = c.X,
                            Y = c.Y,
                            Rotation = c.Rotation,
                            Type = c.Type,

                            CameraModel = c.CameraModel,
                            Brand = c.Brand,
                            Resolution = c.Resolution,

                            // --- NEW FOV FIELDS ---
                            FocalLength = c.FocalLength,
                            SensorType = c.SensorType,
                            CorridorMode = c.CorridorMode,
                            IrRange = c.IrRange
                        })
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

        // get all devices for a project for use in calculators
        [HttpGet("project/{projectId}/devices")]
        public async Task<IActionResult> GetProjectDevices(int projectId)
        {
            // get all floor ids for this project
            var floorIds = await _context.FloorLayouts
                .Where(f => f.ProjectID == projectId)
                .Select(f => f.FloorID)
                .ToListAsync();

            // get all placements with device details
            var placements = await _context.CameraPlacemens
                .Where(p => floorIds.Contains(p.FloorID))
                .Include(p => p.Camera)
                .Include(p => p.NetworkingDevice)
                .Include(p => p.AccessControlDevice)
                .ToListAsync();

            // map resolution to bitrate
            int GetDefaultBitrate(string resolution) => resolution switch
            {
                var r when r.Contains("12MP") => 20480,
                var r when r.Contains("8MP") => 16384,
                var r when r.Contains("6MP") => 12288,
                var r when r.Contains("5MP") => 8192,
                var r when r.Contains("4MP") => 6144,
                var r when r.Contains("2MP") => 4096,
                var r when r.Contains("1080") => 4096,
                var r when r.Contains("720") => 2048,
                _ => 4096
            };

            // map resolution to display format
            string GetResolutionDisplay(string resolution) => resolution switch
            {
                var r when r.Contains("12MP") => "12MP (4000x3000)",
                var r when r.Contains("8MP") => "8MP (3840x2160)",
                var r when r.Contains("6MP") => "6MP (3072x2048)",
                var r when r.Contains("5MP") => "5MP (2560x1920)",
                var r when r.Contains("4MP") => "4MP (2560x1440)",
                var r when r.Contains("2MP") => "1080p (1920x1080)",
                var r when r.Contains("1080") => "1080p (1920x1080)",
                var r when r.Contains("720") => "720p (1280x720)",
                _ => "1080p (1920x1080)"
            };

            // build device list for UPS calculator
            var upsDevices = placements
                .Where(p => p.Camera != null || p.NetworkingDevice != null || p.AccessControlDevice != null)
                .Select(p =>
                {
                    string name = "Unknown";
                    double power = 0;
                    string category = "Other";

                    if (p.Camera != null)
                    {
                        name = p.Camera.ModelNumber;
                        power = p.Camera.PowerConsumption ?? 0;
                        category = "Camera";
                    }
                    else if (p.NetworkingDevice != null)
                    {
                        name = p.NetworkingDevice.Name;
                        power = p.NetworkingDevice.PowerConsumption ?? 0;
                        category = "Networking";
                    }
                    else if (p.AccessControlDevice != null)
                    {
                        name = p.AccessControlDevice.Name;
                        power = p.AccessControlDevice.PowerConsumption ?? 0;
                        category = "Access Control";
                    }

                    return new { name, power, category };
                })
                .ToList();

            // build channel list for storage calculator - cameras only
            var storageChannels = placements
                .Where(p => p.Camera != null)
                .Select((p, index) => new
                {
                    id = p.PlacementID,
                    name = $"Channel {index + 1} - {p.Camera!.ModelNumber}",
                    standard = "PAL",
                    encoding = "H.265",
                    resolution = GetResolutionDisplay(p.Camera.Resolution),
                    fps = 25,
                    bitrate = p.Camera.Bitrate ?? GetDefaultBitrate(p.Camera.Resolution)
                })
                .ToList();

            return Ok(new { upsDevices, storageChannels });
        }
    }
}