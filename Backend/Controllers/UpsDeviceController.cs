using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/ups")]
    public class UpsDeviceController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UpsDeviceController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("devices")]
        public async Task<IActionResult> GetDevices()
        {
            var devices = await _context.UpsDevices
                .OrderBy(d => d.Name)
                .Select(d => new
                {
                    d.Id,
                    d.Name,
                    powerWatts = d.PowerWatts,
                    defaultUnits = d.DefaultUnits,
                })
                .ToListAsync();

            return Ok(devices);
        }
    }
}
