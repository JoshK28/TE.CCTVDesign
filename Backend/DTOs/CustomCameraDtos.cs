namespace Backend.DTOs
{
    public class CustomCameraDto
    {
        public string ModelNumber { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Resolution { get; set; } = string.Empty;
        public string Range { get; set; } = string.Empty;
        public string LensSize { get; set; } = string.Empty;
        public string LensType { get; set; } = string.Empty;
        public string FovHorizontal { get; set; } = string.Empty;
        public string FovVertical { get; set; } = string.Empty;
        public string FovDiagonal { get; set; } = string.Empty;
        public string IrRange { get; set; } = string.Empty;
        public string Aperture { get; set; } = string.Empty;
        public string OperatingTemp { get; set; } = string.Empty;
        public string Price { get; set; } = string.Empty;
        public double? PowerConsumption { get; set; }
        public int? Bitrate { get; set; }
    }
}