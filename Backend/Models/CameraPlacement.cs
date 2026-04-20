using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class CameraPlacement
    {
        [Key]
        public int PlacementID { get; set; }

        // links to the floor layout
        public int FloorID { get; set; }

        // links to the camera type from the cameras table
        public int CameraId { get; set; }

        // exact position on the floor layout
        public double X { get; set; }
        public double Y { get; set; }

        // rotation in degrees - defaults to 0 until implemented
        public double Rotation { get; set; } = 0;

        // the type of equipment e.g. camera, router, alarm
        public string Type { get; set; } = string.Empty;

        // navigation properties
        public FloorLayout? FloorLayout { get; set; }
    }
}