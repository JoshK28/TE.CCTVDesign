using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class AccessControlDevice
    {
        [Key]
        public int AccessControlID { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Manufacturer { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Price { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }
}