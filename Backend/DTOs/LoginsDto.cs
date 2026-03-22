namespace Backend.DTOs
{
    // DTO stands for Data Transfer Object
    // this class defines what data is expected when a user tries to log in
    // it only contains the fields needed for login - email and password
    public class LoginDto
    {
        // the email address the user enters on the login form
        public string Email { get; set; } = string.Empty;

        // the password the user enters on the login form
        public string Password { get; set; } = string.Empty;
    }
}