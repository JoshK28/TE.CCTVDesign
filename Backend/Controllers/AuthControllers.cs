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
    [Route("api/auth")] // all routes in this controller start with /api/auth
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context; // used to talk to the database
        private readonly JwtService _jwt; // used to create login tokens
        private readonly PasswordHasher<User> _hasher = new(); // used to hash and check passwords

        // sets up the controller with the database and jwt service
        public AuthController(AppDbContext context, JwtService jwt)
        {
            _context = context;
            _jwt = jwt;
        }

        // handles POST requests to /api/auth/register
        // creates a new user account
        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            // check if the email is already in the database
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                return BadRequest("Email already exists");

            // create a new user with the provided username and email
            var user = new User
            {
                Username = dto.Username,
                Email = dto.Email
            };

            // hash the password before saving it to the database
            // this means the actual password is never stored
            user.PasswordHash =
                _hasher.HashPassword(user, dto.Password);

            // save the new user to the database
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok("User registered successfully");
        }

        // handles POST requests to /api/auth/login
        // checks the user's credentials and returns a token if valid
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            // look for a user with the provided email in the database
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == dto.Email);

            // if no user found, return an error
            if (user == null)
                return Unauthorized("Invalid credentials");

            // check if the provided password matches the hashed password in the database
            var result = _hasher.VerifyHashedPassword(
                user, user.PasswordHash, dto.Password
            );

            // if the password is wrong, return an error
            if (result == PasswordVerificationResult.Failed)
                return Unauthorized("Invalid credentials");

            // generate a JWT token for the user
            // this token is used to keep the user logged in
            var token = _jwt.GenerateToken(user);

            // return the token, username and email back to the frontend
            return Ok(new
            {
                token,
                user.Username,
                user.Email
            });
        }
    }
}