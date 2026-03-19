using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    // this class represents a floor layout in the database
    // each project can have multiple floor layouts (layers)
    // images are stored directly in the database instead of as files
    public class FloorLayout
    {
        // unique identifier for each floor layout
        [Key]
        public int FloorID { get; set; }

        // links this floor layout to a specific project
        public int ProjectID { get; set; }

        // the actual image stored as bytes directly in the database
        // this removes the need for a wwwroot folder
        public byte[] ImageData { get; set; } = Array.Empty<byte>();

        // the image type e.g. image/jpeg or image/png
        // needed so the frontend knows how to display it
        public string ImageContentType { get; set; } = string.Empty;

        // the original file name of the uploaded image
        public string FileName { get; set; } = string.Empty;

        // the width of the floor layout image in pixels
        public double Width { get; set; }

        // the height of the floor layout image in pixels
        public double Height { get; set; }

        // the scale of the floor layout e.g. 1:100
        public string Scale { get; set; } = string.Empty;

        // the layer number - allows multiple floors per project
        // e.g. 1 = ground floor, 2 = first floor
        public int Layer { get; set; }

        // navigation property - links back to the project
        public Project? Project { get; set; }
    }
}