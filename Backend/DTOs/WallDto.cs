namespace Backend.DTOs
{
    public class WallDto
    {
        public int FloorID { get; set; }
        public double X1 { get; set; }
        public double Y1 { get; set; }
        public double X2 { get; set; }
        public double Y2 { get; set; }
        public double Length { get; set; }

        // real world dimensions in metres
        public double RealWorldLength { get; set; }
        public double RealWorldHeight { get; set; }
    }
}