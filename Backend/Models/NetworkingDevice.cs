using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class NetworkingDevice
    {
        [Key]
        public int NetworkingID { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Manufacturer { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Price { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public double? PowerConsumption { get; set; }
    }
}