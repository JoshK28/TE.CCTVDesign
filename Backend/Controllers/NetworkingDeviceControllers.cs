using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Backend.DTOs;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/networking")]
    public class NetworkingDeviceController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NetworkingDeviceController(AppDbContext context)
        {
            _context = context;
        }

        // get all networking devices
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var devices = await _context.NetworkingDevices.ToListAsync();
            return Ok(devices);
        }

        // get single networking device
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var device = await _context.NetworkingDevices.FindAsync(id);
            if (device == null) return NotFound("Device not found");
            return Ok(device);
        }

        // add new networking device
        [HttpPost]
        public async Task<IActionResult> Create(NetworkingDeviceDto dto)
        {
            var device = new NetworkingDevice
            {
                Name = dto.Name,
                Manufacturer = dto.Manufacturer,
                Type = dto.Type,
                Price = dto.Price,
                Description = dto.Description
            };
            _context.NetworkingDevices.Add(device);
            await _context.SaveChangesAsync();
            return Ok(device);
        }

        // update networking device
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, NetworkingDeviceDto dto)
        {
            var device = await _context.NetworkingDevices.FindAsync(id);
            if (device == null) return NotFound("Device not found");

            device.Name = dto.Name;
            device.Manufacturer = dto.Manufacturer;
            device.Type = dto.Type;
            device.Price = dto.Price;
            device.Description = dto.Description;

            await _context.SaveChangesAsync();
            return Ok(device);
        }

        // delete networking device
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var device = await _context.NetworkingDevices.FindAsync(id);
            if (device == null) return NotFound("Device not found");

            _context.NetworkingDevices.Remove(device);
            await _context.SaveChangesAsync();
            return Ok("Device deleted successfully");
        }
    }
}