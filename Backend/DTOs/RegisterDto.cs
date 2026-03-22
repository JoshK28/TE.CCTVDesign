namespace Backend.DTOs
{
    // DTO stands for Data Transfer Object
    // this class defines what data is expected when a user tries to register
    // it only contains the fields needed for registration - username, email and password
    public class RegisterDto
    {
        // the username the user enters on the register form
        public string Username { get; set; } = string.Empty;

        // the email address the user enters on the register form
        public string Email { get; set; } = string.Empty;

        // the password the user enters on the register form
        // this gets hashed before being saved to the database
        public string Password { get; set; } = string.Empty;
    }
}