using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class Obstacle
    {
        [Key]
        public int ObstacleId { get; set; }
        public int FloorID { get; set; }
        public string Label { get; set; } = string.Empty;
        public double X { get; set; }
        public double Y { get; set; }
        public double Width { get; set; }
        public double Height { get; set; }
        public double Rotation { get; set; } = 0;
        public string Color { get; set; } = "#FF0000";

        public FloorLayout? FloorLayout { get; set; }
    }
}