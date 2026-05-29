// FOR JOSH- was going to be used for when a user adds devices just for networking device but if you're going to do your own can delete not neccessary


namespace Backend.DTOs
{
    public class NetworkingDeviceDto
    {
        public string Name { get; set; } = string.Empty;
        public string Manufacturer { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Price { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }
}