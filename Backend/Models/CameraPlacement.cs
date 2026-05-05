using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class CameraPlacement
    {
        [Key]
        public int PlacementID { get; set; }

        // links to the floor layout
        public int FloorID { get; set; }

        // links to camera - nullable since not all placements are cameras
        public int? CameraId { get; set; }

        // links to networking device - nullable
        public int? NetworkingId { get; set; }

        // links to access control device - nullable
        public int? AccessControlId { get; set; }

        // exact position on the floor layout
        public double X { get; set; }
        public double Y { get; set; }

        // rotation in degrees
        public double Rotation { get; set; } = 0;

        // type of equipment e.g. camera, networking, accesscontrol
        public string Type { get; set; } = string.Empty;

        // navigation properties
        public FloorLayout? FloorLayout { get; set; }
        public Camera? Camera { get; set; }
        public NetworkingDevice? NetworkingDevice { get; set; }
        public AccessControlDevice? AccessControlDevice { get; set; }
    }
}