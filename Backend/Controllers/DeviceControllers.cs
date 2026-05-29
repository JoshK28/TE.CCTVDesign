// FOR JOSH- was going to be used for when a user adds devices just for access control, networking or customer camera but if you're going to do your own can delete not neccessary


using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/devices")]
    public class DeviceController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DeviceController(AppDbContext context)
        {
            _context = context;
        }

        // GET /api/devices
        // unified search across NetworkingDevices + AccessControlDevices.
        // currently returns only DeviceType, Model Name (Name) and Manufacturer
        // along with the id/source needed to link the placement record.
        [HttpGet]
        public async Task<IActionResult> GetDevices(
            [FromQuery] string? search,
            [FromQuery] List<string>? manufacturer,
            [FromQuery] List<string>? type,
            [FromQuery] List<string>? source,
            [FromQuery] int limit = 500)
        {
            var includeNetworking = source is not { Count: > 0 }
                || source.Any(s => string.Equals(s, "networking", StringComparison.OrdinalIgnoreCase));
            var includeAccess = source is not { Count: > 0 }
                || source.Any(s => string.Equals(s, "accesscontrol", StringComparison.OrdinalIgnoreCase));

            var results = new List<DeviceListItem>();

            if (includeNetworking)
            {
                var networking = _context.NetworkingDevices.AsNoTracking().AsQueryable();

                if (!string.IsNullOrWhiteSpace(search))
                    networking = networking.Where(d => d.Name.Contains(search));
                if (manufacturer is { Count: > 0 })
                    networking = networking.Where(d => manufacturer.Contains(d.Manufacturer));
                if (type is { Count: > 0 })
                    networking = networking.Where(d => type.Contains(d.Type));

                var networkingItems = await networking
                    .Select(d => new DeviceListItem
                    {
                        Id = d.NetworkingID,
                        Source = "networking",
                        ModelName = d.Name,
                        Manufacturer = d.Manufacturer,
                        DeviceType = d.Type,
                    })
                    .ToListAsync();

                results.AddRange(networkingItems);
            }

            if (includeAccess)
            {
                var access = _context.AccessControlDevices.AsNoTracking().AsQueryable();

                if (!string.IsNullOrWhiteSpace(search))
                    access = access.Where(d => d.Name.Contains(search));
                if (manufacturer is { Count: > 0 })
                    access = access.Where(d => manufacturer.Contains(d.Manufacturer));
                if (type is { Count: > 0 })
                    access = access.Where(d => type.Contains(d.Type));

                var accessItems = await access
                    .Select(d => new DeviceListItem
                    {
                        Id = d.AccessControlID,
                        Source = "accesscontrol",
                        ModelName = d.Name,
                        Manufacturer = d.Manufacturer,
                        DeviceType = d.Type,
                    })
                    .ToListAsync();

                results.AddRange(accessItems);
            }

            var take = Math.Clamp(limit, 1, 1000);
            var devices = results
                .OrderBy(d => d.Manufacturer)
                .ThenBy(d => d.ModelName)
                .Take(take)
                .ToList();

            return Ok(devices);
        }

        // GET /api/devices/manufacturers
        // distinct manufacturer names (for filter dropdown), small payload.
        [HttpGet("manufacturers")]
        public async Task<IActionResult> GetManufacturers()
        {
            var networking = await _context.NetworkingDevices
                .AsNoTracking()
                .Where(d => d.Manufacturer != null && d.Manufacturer != string.Empty)
                .Select(d => d.Manufacturer)
                .Distinct()
                .ToListAsync();

            var access = await _context.AccessControlDevices
                .AsNoTracking()
                .Where(d => d.Manufacturer != null && d.Manufacturer != string.Empty)
                .Select(d => d.Manufacturer)
                .Distinct()
                .ToListAsync();

            var manufacturers = networking
                .Concat(access)
                .Distinct()
                .OrderBy(m => m)
                .ToList();

            return Ok(manufacturers);
        }

        // GET /api/devices/types
        // distinct device-type values (for filter dropdown).
        [HttpGet("types")]
        public async Task<IActionResult> GetDeviceTypes()
        {
            var networking = await _context.NetworkingDevices
                .AsNoTracking()
                .Where(d => d.Type != null && d.Type != string.Empty)
                .Select(d => d.Type)
                .Distinct()
                .ToListAsync();

            var access = await _context.AccessControlDevices
                .AsNoTracking()
                .Where(d => d.Type != null && d.Type != string.Empty)
                .Select(d => d.Type)
                .Distinct()
                .ToListAsync();

            var types = networking
                .Concat(access)
                .Distinct()
                .OrderBy(t => t)
                .ToList();

            return Ok(types);
        }

        public class DeviceListItem
        {
            public int Id { get; set; }
            public string Source { get; set; } = string.Empty;
            public string ModelName { get; set; } = string.Empty;
            public string Manufacturer { get; set; } = string.Empty;
            public string DeviceType { get; set; } = string.Empty;
        }
    }
}
