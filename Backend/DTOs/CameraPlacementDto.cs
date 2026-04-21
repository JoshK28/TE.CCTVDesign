namespace Backend.DTOs
{
    public class CameraPlacementDto
    {
        public int FloorID { get; set; }
        public int? CameraId { get; set; }
        public double X { get; set; }
        public double Y { get; set; }
        public double Rotation { get; set; } = 0;
        public string Type { get; set; } = string.Empty;
    }
}