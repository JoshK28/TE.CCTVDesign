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

        // additional fields for user-defined ("custom") equipment that
        // does not reference a catalog Camera / NetworkingDevice / AccessControlDevice row.
        public string ModelName { get; set; } = string.Empty;
        public string Subtype { get; set; } = string.Empty;
        public double? CostPerUnit { get; set; }

        // serialized JSON blob holding all non-catalog placement settings:
        // editable name, FOV color/opacity, focal length, height, tilt, IR range,
        // notes, custom icon, device specifications, etc. Anything the design UI
        // can mutate per-placement that does not have its own column lives here.
        public string? SettingsJson { get; set; }
        // --- NEW FOV FIELDS (2D only) ---
        public double FocalLength { get; set; } = 2.8;     // mm
        public string SensorType { get; set; } = "1/2.8";  // e.g. "1/2.8"
        public bool CorridorMode { get; set; } = false;
        public double IrRange { get; set; } = 30;          // metres

        public FloorLayout? FloorLayout { get; set; }
        public Camera? Camera { get; set; }
        public NetworkingDevice? NetworkingDevice { get; set; }
        public AccessControlDevice? AccessControlDevice { get; set; }
        public int? CustomCameraId { get; set; }
        public CustomCamera? CustomCamera { get; set; }
    }
}
        