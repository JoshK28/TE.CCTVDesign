using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Backend.DTOs;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/camerplacements")]
    public class CameraPlacementController(AppDbContext context) : ControllerBase
    {
        // GET api/camerplacements/{floorId}
        [HttpGet("{floorId}")]
        public async Task<IActionResult> GetPlacements(int floorId) =>
            Ok(await context.CameraPlacemens.Where(c => c.FloorID == floorId).ToListAsync());

        // GET api/camerplacements/project/{projectId} — returns BOM grouped by device
        [HttpGet("project/{projectId}")]
        public async Task<IActionResult> GetPlacementsByProject(int projectId)
        {
            var floorIds = await context.FloorLayouts
                .Where(f => f.ProjectID == projectId)
                .Select(f => f.FloorID)
                .ToListAsync();

            var placements = await context.CameraPlacemens
                .Where(p => floorIds.Contains(p.FloorID))
                .Include(p => p.Camera)
                .Include(p => p.NetworkingDevice)
                .Include(p => p.AccessControlDevice)
                .ToListAsync();

            var bomItems = placements
                .GroupBy(p => new { p.Type, p.CameraId, p.NetworkingId, p.AccessControlId })
                .Select(g =>
                {
                    var first = g.First();
                    string name = "Unknown Device", manufacturer = "", type = first.Type, price = "0";

                    if (first.Camera != null)
                        (name, manufacturer, type, price) = (first.Camera.ModelNumber, first.Camera.Brand, first.Camera.Type, first.Camera.Price);
                    else if (first.NetworkingDevice != null)
                        (name, manufacturer, type, price) = (first.NetworkingDevice.Name, first.NetworkingDevice.Manufacturer, first.NetworkingDevice.Type, first.NetworkingDevice.Price);
                    else if (first.AccessControlDevice != null)
                        (name, manufacturer, type, price) = (first.AccessControlDevice.Name, first.AccessControlDevice.Manufacturer, first.AccessControlDevice.Type, first.AccessControlDevice.Price);

                    // parse average price from range string e.g. "$480–$650"
                    double avgPrice = 0;
                    try
                    {
                        var clean = price.Replace("$", "").Replace(",", "");
                        var sep = clean.Contains("–") ? "–" : "-";
                        if (clean.Contains("–") || clean.Contains("-"))
                        {
                            var parts = clean.Split(sep);
                            if (parts.Length == 2 &&
                                double.TryParse(parts[0].Trim(), out double lo) &&
                                double.TryParse(parts[1].Trim(), out double hi))
                                avgPrice = (lo + hi) / 2;
                        }
                        else if (double.TryParse(clean.Trim(), out double single))
                            avgPrice = single;
                    }
                    catch { avgPrice = 0; }

                    return new
                    {
                        name, manufacturer, type,
                        quantity = g.Count(),
                        unitPrice = avgPrice,
                        category = first.Camera != null ? "Camera"
                            : first.NetworkingDevice != null ? "Networking"
                            : first.AccessControlDevice != null ? "Access Control" : "Other"
                    };
                })
                .ToList();

            return Ok(bomItems);
        }

        // GET api/camerplacements/project/{projectId}/devices — used by UPS and storage calculators
        [HttpGet("project/{projectId}/devices")]
        public async Task<IActionResult> GetProjectDevices(int projectId)
        {
            var floorIds = await context.FloorLayouts
                .Where(f => f.ProjectID == projectId)
                .Select(f => f.FloorID)
                .ToListAsync();

            var placements = await context.CameraPlacemens
                .Where(p => floorIds.Contains(p.FloorID))
                .Include(p => p.Camera)
                .Include(p => p.NetworkingDevice)
                .Include(p => p.AccessControlDevice)
                .ToListAsync();

            // maps resolution string to default bitrate (kbps)
            static int GetDefaultBitrate(string r) => r switch
            {
                var s when s.Contains("12MP")  => 20480,
                var s when s.Contains("8MP")   => 16384,
                var s when s.Contains("6MP")   => 12288,
                var s when s.Contains("5MP")   => 8192,
                var s when s.Contains("4MP")   => 6144,
                var s when s.Contains("2MP")   => 4096,
                var s when s.Contains("1080")  => 4096,
                var s when s.Contains("720")   => 2048,
                _ => 4096
            };

            // maps resolution string to display label
            static string GetResolutionDisplay(string r) => r switch
            {
                var s when s.Contains("12MP")  => "12MP (4000x3000)",
                var s when s.Contains("8MP")   => "8MP (3840x2160)",
                var s when s.Contains("6MP")   => "6MP (3072x2048)",
                var s when s.Contains("5MP")   => "5MP (2560x1920)",
                var s when s.Contains("4MP")   => "4MP (2560x1440)",
                var s when s.Contains("2MP")   => "1080p (1920x1080)",
                var s when s.Contains("1080")  => "1080p (1920x1080)",
                var s when s.Contains("720")   => "720p (1280x720)",
                _ => "1080p (1920x1080)"
            };

            // power draw per device for UPS calculator
            var upsDevices = placements
                .Where(p => p.Camera != null || p.NetworkingDevice != null || p.AccessControlDevice != null)
                .Select(p => p.Camera != null
                    ? new { name = p.Camera.ModelNumber,       power = p.Camera.PowerConsumption ?? 0,              category = "Camera" }
                    : p.NetworkingDevice != null
                    ? new { name = p.NetworkingDevice.Name,    power = p.NetworkingDevice.PowerConsumption ?? 0,    category = "Networking" }
                    : new { name = p.AccessControlDevice!.Name, power = p.AccessControlDevice.PowerConsumption ?? 0, category = "Access Control" })
                .ToList();

            // camera channels for storage calculator
            var storageChannels = placements
                .Where(p => p.Camera != null)
                .Select((p, i) => new
                {
                    id = p.PlacementID,
                    name = $"Channel {i + 1} - {p.Camera!.ModelNumber}",
                    standard = "PAL",
                    encoding = "H.265",
                    resolution = GetResolutionDisplay(p.Camera.Resolution),
                    fps = 25,
                    bitrate = p.Camera.Bitrate ?? GetDefaultBitrate(p.Camera.Resolution)
                })
                .ToList();

            return Ok(new { upsDevices, storageChannels });
        }

        // POST api/camerplacements/save/{floorId} — replaces all placements for a floor
        [HttpPost("save/{floorId}")]
        public async Task<IActionResult> SavePlacements(int floorId, List<CameraPlacementDto> placements)
        {
            if (await context.FloorLayouts.FindAsync(floorId) == null)
                return NotFound("Floor layout not found");

            context.CameraPlacemens.RemoveRange(
                context.CameraPlacemens.Where(c => c.FloorID == floorId)
            );

            context.CameraPlacemens.AddRange(placements.Select(p => new CameraPlacement
            {
                FloorID = floorId,
                CameraId = p.CameraId == 0 ? null : p.CameraId,
                NetworkingId = p.NetworkingId == 0 ? null : p.NetworkingId,
                AccessControlId = p.AccessControlId == 0 ? null : p.AccessControlId,
                X = p.X, Y = p.Y,
                Rotation = p.Rotation,
                Type = p.Type,
                CameraModel = p.CameraModel,
                Brand = p.Brand,
                Resolution = p.Resolution
            }));

            await context.SaveChangesAsync();
            return Ok("Placements saved successfully");
        }
    }
}