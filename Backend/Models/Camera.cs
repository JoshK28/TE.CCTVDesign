namespace Backend.Models
{
    public class Camera
    {
        public int Id { get; set; }
        public string ModelNumber { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Resolution { get; set; } = string.Empty;
        public string Range { get; set; } = string.Empty;
        public string LensSize { get; set; } = string.Empty;
    }
}