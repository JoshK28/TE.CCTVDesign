namespace Backend.DTOs
{
    public class CameraPlacementDto
    {
        public int FloorID { get; set; }
        public int? CameraId { get; set; }
        public int? NetworkingId { get; set; }
        public int? AccessControlId { get; set; }
        public double X { get; set; }
        public double Y { get; set; }
        public double Rotation { get; set; } = 0;
        public string Type { get; set; } = string.Empty;
        public string CameraModel { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public string Resolution { get; set; } = string.Empty;
        public string ModelName { get; set; } = string.Empty;
        public string Subtype { get; set; } = string.Empty;
        public double? CostPerUnit { get; set; }
        public string? SettingsJson { get; set; }
    }
}