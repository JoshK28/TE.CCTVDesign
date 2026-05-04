namespace Backend.Models
{
    public class UpsDevice
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int PowerWatts { get; set; }
        public int DefaultUnits { get; set; } = 1;
    }
}
