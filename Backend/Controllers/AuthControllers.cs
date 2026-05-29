using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Backend.DTOs;
using Backend.Services;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController(AppDbContext context, JwtService jwt) : ControllerBase
    {
        private readonly PasswordHasher<User> _hasher = new();

        // POST api/auth/register
        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            if (await context.Users.AnyAsync(u => u.Email == dto.Email))
                return BadRequest("Email already exists");

            var user = new User { Username = dto.Username, Email = dto.Email };
            user.PasswordHash = _hasher.HashPassword(user, dto.Password);

            context.Users.Add(user);
            await context.SaveChangesAsync();
            return Ok("User registered successfully");
        }

        // POST api/auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var user = await context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (user == null) return Unauthorized("Invalid credentials");

            if (_hasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password) == PasswordVerificationResult.Failed)
                return Unauthorized("Invalid credentials");

            return Ok(new { token = jwt.GenerateToken(user), user.Username, user.Email });
        }
    }
}