using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Backend.DTOs;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/accesscontrol")]
    public class AccessControlDeviceController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AccessControlDeviceController(AppDbContext context)
        {
            _context = context;
        }

        // get all access control devices
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var devices = await _context.AccessControlDevices.ToListAsync();
            return Ok(devices);
        }

        // get single access control device
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var device = await _context.AccessControlDevices.FindAsync(id);
            if (device == null) return NotFound("Device not found");
            return Ok(device);
        }

        // add new access control device
        [HttpPost]
        public async Task<IActionResult> Create(AccessControlDeviceDto dto)
        {
            var device = new AccessControlDevice
            {
                Name = dto.Name,
                Manufacturer = dto.Manufacturer,
                Type = dto.Type,
                Price = dto.Price,
                Description = dto.Description
            };
            _context.AccessControlDevices.Add(device);
            await _context.SaveChangesAsync();
            return Ok(device);
        }

        // update access control device
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, AccessControlDeviceDto dto)
        {
            var device = await _context.AccessControlDevices.FindAsync(id);
            if (device == null) return NotFound("Device not found");

            device.Name = dto.Name;
            device.Manufacturer = dto.Manufacturer;
            device.Type = dto.Type;
            device.Price = dto.Price;
            device.Description = dto.Description;

            await _context.SaveChangesAsync();
            return Ok(device);
        }

        // delete access control device
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var device = await _context.AccessControlDevices.FindAsync(id);
            if (device == null) return NotFound("Device not found");

            _context.AccessControlDevices.Remove(device);
            await _context.SaveChangesAsync();
            return Ok("Device deleted successfully");
        }
    }
}