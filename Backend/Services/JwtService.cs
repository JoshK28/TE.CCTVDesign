using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Backend.Models;

namespace Backend.Services
{
    // this service is responsible for creating JWT tokens
    // a JWT token is a secure string that proves a user is logged in
    // it is sent to the frontend after a successful login
    public class JwtService
    {
        // stores the secret key used to sign the token
        // this key is stored in appsettings.json
        private readonly string _key;

        // gets the secret key from appsettings.json when the service starts
        public JwtService(IConfiguration config)
        {
            _key = config["Jwt:Key"]!;
        }

        // creates and returns a JWT token for the logged in user
        // this token is sent to the frontend and stored in localStorage
        public string GenerateToken(User user)
        {
            // claims are pieces of information stored inside the token
            // here we store the user's id and email
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email)
            };

            // convert the secret key into a format that can be used for signing
            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_key)
            );

            // set up the signing credentials using the secret key
            // HmacSha256 is the algorithm used to sign the token
            var creds = new SigningCredentials(
                key, SecurityAlgorithms.HmacSha256
            );

            // create the token with the claims, expiry time and signing credentials
            // the token will expire after 2 hours, requiring the user to log in again
            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.Now.AddHours(2),
                signingCredentials: creds
            );

            // convert the token to a string and return it
            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}