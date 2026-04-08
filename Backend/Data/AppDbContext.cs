using Microsoft.EntityFrameworkCore;
using Backend.Models;

namespace Backend.Data
{
    // AppDbContext is the main class that connects the app to the database
    // it acts as a middle man between the code and the database
    public class AppDbContext : DbContext
    {
        // sets up the database connection using the settings from appsettings.json
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        // represents the Users table in the database
        // allows the app to read and write user data
        public DbSet<User> Users => Set<User>();

             // represents the Projects table in the database
        // allows the app to read and write project data
        public DbSet<Project> Projects => Set<Project>();

        // represents the FloorLayouts table in the database
        // allows the app to read and write floor layout images per project
        public DbSet<FloorLayout> FloorLayouts => Set<FloorLayout>();

        // represents the Cameras table in the database
        // allows the app to read and write camera data
        public DbSet<Camera> Cameras => Set<Camera>();

        // this method runs when the database is first being set up
        // it pre-fills the Cameras table with 21 HikVision cameras
        // so the data is automatically available without manual entry
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // seed data - automatically adds these cameras to the database
            // when dotnet ef database update is run
            modelBuilder.Entity<Camera>().HasData(
                new Camera { Id = 1, ModelNumber = "DS-2CD2685G1-IZS", Description = "Camera Bullet 8MP V-Focus HikVision", Brand = "HikVision", Type = "Bullet", Resolution = "8MP", Range = "50m", LensSize = "Varifocal", LensType = "Motorised Varifocal", FovHorizontal = "112°–46°", FovVertical = "60°–26°", FovDiagonal = "133°–53°", IrRange = "50m", Aperture = "F1.4", OperatingTemp = "–30°C to 60°C", Price = "$480–$650" },
                new Camera { Id = 2, ModelNumber = "DS-2CD2046G2-I", Description = "Camera 4MP Mini Bullet 40m IR IP67 2.8mm HIKVision", Brand = "HikVision", Type = "Bullet", Resolution = "4MP", Range = "40m", LensSize = "2.8mm", LensType = "Fixed Focal Lens", FovHorizontal = "103°–83°–53°", FovVertical = "55°–45°–28°", FovDiagonal = "123°–98°–62°", IrRange = "40m", Aperture = "F1.4", OperatingTemp = "–30°C to 60°C", Price = "$180–$260" },
                new Camera { Id = 3, ModelNumber = "DS-2CD2021G1-IDW1", Description = "Camera Bullet Single 2MP 30m WiFi IR IP66 2.8mm", Brand = "HikVision", Type = "Bullet", Resolution = "2MP", Range = "30m", LensSize = "2.8mm", LensType = "Fixed Focal Lens", FovHorizontal = "114°–86°", FovVertical = "62°–46°", FovDiagonal = "135°–102°", IrRange = "30m", Aperture = "F2.0", OperatingTemp = "–30°C to 60°C", Price = "$120–$180" },
                new Camera { Id = 4, ModelNumber = "DS-2CD2T65G1-I8", Description = "Camera Bullet 6MP 50m IR 2.8mm EXIR H.265 120dB WDR IP67", Brand = "HikVision", Type = "Bullet", Resolution = "6MP", Range = "50m", LensSize = "2.8mm", LensType = "Fixed Focal Lens", FovHorizontal = "99°–80°–60°", FovVertical = "61°–51°–38°", FovDiagonal = "128°–101°", IrRange = "80m", Aperture = "F1.6", OperatingTemp = "–30°C to 60°C", Price = "$260–$340" },
                new Camera { Id = 5, ModelNumber = "DS-2CD2686G2-IZSU/SL", Description = "Camera HIKVision 4K AcuSense Strobe Light Audible Warning Varifocal Bullet", Brand = "HikVision", Type = "Bullet", Resolution = "8MP", Range = "60", LensSize = "Varifocal", LensType = "Motorised Varifocal", FovHorizontal = "108°–46°", FovVertical = "58°–26°", FovDiagonal = "127.4°–52°", IrRange = "60m", Aperture = "F1.4", OperatingTemp = "–30°C to 60°C", Price = "$590–$750" },
                new Camera { Id = 6, ModelNumber = "IDS-2CD7A46G0/P-IZHS", Description = "Camera Hikvision 4MP Deepin View ANPR Moto VF Bullet 8-32mm", Brand = "HikVision", Type = "Bullet", Resolution = "4MP", Range = "8-32m", LensSize = "8-32mm", LensType = "Motorised Varifocal", FovHorizontal = "108°–46°", FovVertical = "58°–26°", FovDiagonal = "127°–52°", IrRange = "80m", Aperture = "F1.4", OperatingTemp = "–30°C to 60°C", Price = "$650–$850" },
                new Camera { Id = 7, ModelNumber = "DS-2CD7A47G0-XZHSY", Description = "Camera Bullet High Performance 4MP DarkFighter 2.8-12mm HikVision", Brand = "HikVision", Type = "Bullet", Resolution = "4MP", Range = "100m", LensSize = "2.8-12mm", LensType = "Motorised Varifocal", FovHorizontal = "57°–2.6°", FovVertical = "33°–1.5°", FovDiagonal = "67°–3°", IrRange = "100m", Aperture = "F1.5", OperatingTemp = "–30°C to 60°C", Price = "$900–$1200" },
                new Camera { Id = 8, ModelNumber = "DS-2CD2123G2-I", Description = "Camera Outdoor Dome 2MP 120dB WDR IP67 Fixed Lens 30m IR 2.8mm HikVision", Brand = "HikVision", Type = "Dome", Resolution = "2MP", Range = "30m", LensSize = "2.8mm", LensType = "Fixed Focal Lens", FovHorizontal = "114°–86°", FovVertical = "62°–46°", FovDiagonal = "135°–102°", IrRange = "30m", Aperture = "F2.0", OperatingTemp = "–30°C to 60°C", Price = "$120–$180" },
                new Camera { Id = 9, ModelNumber = "DS-2DE3204W-DE", Description = "Camera Dome 2MP PTZ PoE IP66 4x Optical Zoom HikVision", Brand = "HikVision", Type = "PTZ", Resolution = "2MP", Range = "30m", LensSize = "4x Optical Zoom", LensType = "PTZ", FovHorizontal = "103.4°–33°", FovVertical = "53.8°-18.9°", FovDiagonal = "122.6°-37.8", IrRange = "30m", Aperture = "F1.6", OperatingTemp = "–30°C to 60°C", Price = "$350–$500" },
                new Camera { Id = 10, ModelNumber = "DS-2CD2166G2-I", Description = "Camera Dome 6MP WDR Smart 2.8mm H.265 120dB", Brand = "HikVision", Type = "Dome", Resolution = "6MP", Range = "30m", LensSize = "2.8mm", LensType = "Fixed Focal Lens", FovHorizontal = "99°–80°", FovVertical = "61°–51°", FovDiagonal = "128°–101°", IrRange = "30m", Aperture = "F1.6", OperatingTemp = "–30°C to 60°C", Price = "$260–$340" },
                new Camera { Id = 11, ModelNumber = "DS-2DE4A425IWG-E", Description = "Camera PTZ 4MP 25x Dome Hikvision", Brand = "HikVision", Type = "PTZ", Resolution = "4MP", Range = "50m", LensSize = "25x Optical Zoom", LensType = "PTZ", FovHorizontal = "57°–2.6°", FovVertical = "30.6°-1.5°", FovDiagonal = "60.5°-3°", IrRange = "50m", Aperture = "F1.5", OperatingTemp = "–30°C to 60°C", Price = "$900–$1200" },
                new Camera { Id = 12, ModelNumber = "IDS-2CD7146G0-IZHSY", Description = "Camera HIKVision 4MP Dome DeepinView Moto Varifocal 2.8-12mm IK10", Brand = "HikVision", Type = "Dome", Resolution = "4MP", Range = "80m", LensSize = "2.8-12mm", LensType = "Motorised Varifocal", FovHorizontal = "108°–46°", FovVertical = "58°–26°", FovDiagonal = "127°–52°", IrRange = "80m", Aperture = "F1.4", OperatingTemp = "–30°C to 60°C", Price = "$650–$850" },
                new Camera { Id = 13, ModelNumber = "DS-2CD2187G2H-LISU", Description = "Camera Hikvision 8MP Smart Hybrid Light with ColorVu Mini Dome 2.8mm", Brand = "HikVision", Type = "Dome", Resolution = "8MP", Range = "30m", LensSize = "2.8mm", LensType = "Fixed Focal Lens", FovHorizontal = "102°", FovVertical = "55°", FovDiagonal = "120°", IrRange = "30m", Aperture = "F1.6", OperatingTemp = "–30°C to 60°C", Price = "$260–$340" },
                new Camera { Id = 14, ModelNumber = "DS-2DE2A404IW-DE3/W", Description = "Camera Hikvision 4MP 4X Outdoor IR Wi-Fi Mini Dome PTZ", Brand = "HikVision", Type = "PTZ", Resolution = "4MP", Range = "50m", LensSize = "4x Optical Zoom", LensType = "PTZ", FovHorizontal = "98°–30°", FovVertical = "", FovDiagonal = "", IrRange = "50m", Aperture = "F1.6", OperatingTemp = "–30°C to 60°C", Price = "$450–$650" },
                new Camera { Id = 15, ModelNumber = "DS-2SE7C432MWG-EB/26", Description = "Camera HikVision 2.8mm Panoramic Dome 32x PTZ TandemVu Camera", Brand = "HikVision", Type = "PTZ", Resolution = "4MP", Range = "150m", LensSize = "2.8mm", LensType = "PTZ", FovHorizontal = "57°–2.6°", FovVertical = "", FovDiagonal = "", IrRange = "150m", Aperture = "F1.5", OperatingTemp = "–30°C to 60°C", Price = "$1800–$2400" },
                new Camera { Id = 16, ModelNumber = "DS-2CD2766G2-IZS", Description = "Dome Camera 5MP 2.8-12mm Varifocal H.265+ IP67 IK10 HikVision", Brand = "HikVision", Type = "Dome", Resolution = "5MP", Range = "40m", LensSize = "2.8-12mm", LensType = "Motorised Varifocal", FovHorizontal = "99°–30°", FovVertical = "61°–17°", FovDiagonal = "128°–35°", IrRange = "40m", Aperture = "F1.6", OperatingTemp = "–30°C to 60°C", Price = "$350–$500" },
                new Camera { Id = 17, ModelNumber = "DS-2CD2955FWD-I", Description = "Camera FishEye 5MP H.265 Indoor 20m IR EasyIP3.0 HikVision", Brand = "HikVision", Type = "Fisheye", Resolution = "5MP", Range = "20m", LensSize = "1.05mm", LensType = "Fisheye", FovHorizontal = "360°", FovVertical = "", FovDiagonal = "", IrRange = "10m", Aperture = "F2.0", OperatingTemp = "–30°C to 60°C", Price = "$250–$350" },
                new Camera { Id = 18, ModelNumber = "DS-2CD6365G1-IVS", Description = "Camera Hikvision 6MP Deepin View Fisheye Network 1.16mm", Brand = "HikVision", Type = "Fisheye", Resolution = "6MP", Range = "15m", LensSize = "1.16mm", LensType = "Fisheye", FovHorizontal = "360°", FovVertical = "", FovDiagonal = "", IrRange = "15m", Aperture = "F2.0", OperatingTemp = "–30°C to 60°C", Price = "$450–$650" },
                new Camera { Id = 19, ModelNumber = "DS-2CD2955G0-ISU", Description = "Camera 5MP Fixed Fisheye Network", Brand = "HikVision", Type = "Fisheye", Resolution = "5MP", Range = "10m", LensSize = "1.05mm", LensType = "Fisheye", FovHorizontal = "360°", FovVertical = "", FovDiagonal = "", IrRange = "10m", Aperture = "F2.0", OperatingTemp = "–30°C to 60°C", Price = "$250–$350" },
                new Camera { Id = 20, ModelNumber = "HUD-PT20X-SE-GY-G3", Description = "Camera PTZOptics Auto Tracking 20X Opt Zoom 1080p", Brand = "PTZOptics", Type = "PTZ", Resolution = "1080p", Range = "100m", LensSize = "20x Optical Zoom", LensType = "PTZ", FovHorizontal = "59°–2.3°", FovVertical = "", FovDiagonal = "", IrRange = "100m", Aperture = "F1.6", OperatingTemp = "–30°C to 60°C", Price = "$1200–$1600" },
                new Camera { Id = 21, ModelNumber = "DS-2DE7530IW-AE", Description = "Camera PTZ 5MP 30x Zoom 150m IR IP66 Pendant HikVision", Brand = "HikVision", Type = "PTZ", Resolution = "5MP", Range = "150m", LensSize = "30x Optical Zoom", LensType = "PTZ", FovHorizontal = "60°–2.3°", FovVertical = "", FovDiagonal = "", IrRange = "200m", Aperture = "F1.5", OperatingTemp = "–30°C to 60°C", Price = "$2500–$3200" }
            );
        }
    }
}