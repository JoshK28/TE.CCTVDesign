using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class CameraPlacement
    {
        [Key]
        public int PlacementID { get; set; }
        public int FloorID { get; set; }
        public int? CameraId { get; set; }
        public int? NetworkingId { get; set; }
        public int? AccessControlId { get; set; }

        public double X { get; set; }
        public double Y { get; set; }
        public double Rotation { get; set; } = 0;
        public string Type { get; set; } = string.Empty;

        // store device details so they persist
        public string CameraModel { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public string Resolution { get; set; } = string.Empty;

        // --- NEW FOV FIELDS (2D only) ---
        public double FocalLength { get; set; } = 2.8;     // mm
        public string SensorType { get; set; } = "1/2.8";  // e.g. "1/2.8"
        public bool CorridorMode { get; set; } = false;
        public double IrRange { get; set; } = 30;          // metres

        public FloorLayout? FloorLayout { get; set; }
        public Camera? Camera { get; set; }
        public NetworkingDevice? NetworkingDevice { get; set; }
        public AccessControlDevice? AccessControlDevice { get; set; }
    }
}
