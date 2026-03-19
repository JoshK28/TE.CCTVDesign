namespace Backend.DTOs
{
    // this class defines what data is needed to create a new project
    // includes both project details and floor layout images in one request
    public class CreateProjectDto
    {
        // the name/title of the project entered in the form
        public string Title { get; set; } = string.Empty;

        // the client name entered in the form
        public string ClientName { get; set; } = string.Empty;

        // the address entered in the form
        public string Address { get; set; } = string.Empty;

        // a description of the project
        public string Description { get; set; } = string.Empty;

        // the floor layout images uploaded with the project
        // a project can have multiple floor layouts (layers)
        public List<IFormFile> FloorImages { get; set; } = new();

        // the scale for the floor layouts e.g. 1:100
        public string Scale { get; set; } = string.Empty;
    }
}