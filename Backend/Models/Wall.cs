using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class Wall
    {
        [Key]
        public int WallID { get; set; }

        // links to the floor layout
        public int FloorID { get; set; }

        // pixel coordinates for rendering on screen
        public double X1 { get; set; }
        public double Y1 { get; set; }
        public double X2 { get; set; }
        public double Y2 { get; set; }

        // pixel length calculated from coordinates
        public double Length { get; set; }

        // real world dimensions in metres
        public double RealWorldLength { get; set; }
        public double RealWorldHeight { get; set; }

        // navigation property
        public FloorLayout? FloorLayout { get; set; }
    }
}