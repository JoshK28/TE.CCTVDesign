using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class SeedCameraData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FieldOfView",
                table: "Cameras");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "Cameras",
                newName: "ModelNumber");

            migrationBuilder.AlterColumn<string>(
                name: "Range",
                table: "Cameras",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(double),
                oldType: "float");

            migrationBuilder.AddColumn<string>(
                name: "Brand",
                table: "Cameras",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "LensSize",
                table: "Cameras",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.InsertData(
                table: "Cameras",
                columns: new[] { "Id", "Brand", "Description", "LensSize", "ModelNumber", "Range", "Resolution", "Type" },
                values: new object[,]
                {
                    { 1, "HikVision", "Camera Bullet 8MP V-Focus HikVision", "Varifocal", "DS-2CD2685G1-IZS", "", "8MP", "Bullet" },
                    { 2, "HikVision", "Camera 4MP Mini Bullet 40m IR IP67 2.8mm HIKVision", "2.8mm", "DS-2CD2046G2-I", "40m", "4MP", "Bullet" },
                    { 3, "HikVision", "Camera Bullet Single 2MP 30m WiFi IR IP66 2.8mm", "2.8mm", "DS-2CD2021G1-IDW1", "30m", "2MP", "Bullet" },
                    { 4, "HikVision", "Camera Bullet 6MP 50m IR 2.8mm EXIR H.265 120dB WDR IP67", "2.8mm", "DS-2CD2T65G1-I8", "50m", "6MP", "Bullet" },
                    { 5, "HikVision", "Camera HIKVision 4K AcuSense Strobe Light Audible Warning Varifocal Bullet", "Varifocal", "DS-2CD2686G2-IZSU/SL", "", "8MP", "Bullet" },
                    { 6, "HikVision", "Camera Hikvision 4MP Deepin View ANPR Moto VF Bullet 8-32mm", "8-32mm", "IDS-2CD7A46G0/P-IZHS", "8-32m", "4MP", "Bullet" },
                    { 7, "HikVision", "Camera Bullet High Performance 4MP DarkFighter 2.8-12mm HikVision", "2.8-12mm", "DS-2CD7A47G0-XZHSY", "", "4MP", "Bullet" },
                    { 8, "HikVision", "Camera Outdoor Dome 2MP 120dB WDR IP67 Fixed Lens 30m IR 2.8mm HikVision", "2.8mm", "DS-2CD2123G2-I", "30m", "2MP", "Dome" },
                    { 9, "HikVision", "Camera Dome 2MP PTZ PoE IP66 4x Optical Zoom HikVision", "4x Optical Zoom", "DS-2DE3204W-DE", "", "2MP", "PTZ" },
                    { 10, "HikVision", "Camera Dome 6MP WDR Smart 2.8mm H.265 120dB", "2.8mm", "DS-2CD2166G2-I", "", "6MP", "Dome" },
                    { 11, "HikVision", "Camera PTZ 4MP 25x Dome Hikvision", "25x Optical Zoom", "DS-2DE4A425IWG-E", "", "4MP", "PTZ" },
                    { 12, "HikVision", "Camera HIKVision 4MP Dome DeepinView Moto Varifocal 2.8-12mm IK10", "2.8-12mm", "IDS-2CD7146G0-IZHSY", "", "4MP", "Dome" },
                    { 13, "HikVision", "Camera Hikvision 8MP Smart Hybrid Light with ColorVu Mini Dome 2.8mm", "2.8mm", "DS-2CD2187G2H-LISU", "", "8MP", "Dome" },
                    { 14, "HikVision", "Camera Hikvision 4MP 4X Outdoor IR Wi-Fi Mini Dome PTZ", "4x Optical Zoom", "DS-2DE2A404IW-DE3/W", "", "4MP", "PTZ" },
                    { 15, "HikVision", "Camera HikVision 2.8mm Panoramic Dome 32x PTZ TandemVu Camera", "2.8mm", "DS-2SE7C432MWG-EB/26", "", "4MP", "PTZ" },
                    { 16, "HikVision", "Dome Camera 5MP 2.8-12mm Varifocal H.265+ IP67 IK10 HikVision", "2.8-12mm", "DS-2CD2766G2-IZS", "", "5MP", "Dome" },
                    { 17, "HikVision", "Camera FishEye 5MP H.265 Indoor 20m IR EasyIP3.0 HikVision", "1.05mm", "DS-2CD2955FWD-I", "20m", "5MP", "Fisheye" },
                    { 18, "HikVision", "Camera Hikvision 6MP Deepin View Fisheye Network 1.16mm", "1.16mm", "DS-2CD6365G1-IVS", "", "6MP", "Fisheye" },
                    { 19, "HikVision", "Camera 5MP Fixed Fisheye Network", "1.05mm", "DS-2CD2955G0-ISU", "", "5MP", "Fisheye" },
                    { 20, "PTZOptics", "Camera PTZOptics Auto Tracking 20X Opt Zoom 1080p", "20x Optical Zoom", "HUD-PT20X-SE-GY-G3", "", "1080p", "PTZ" },
                    { 21, "HikVision", "Camera PTZ 5MP 30x Zoom 150m IR IP66 Pendant HikVision", "30x Optical Zoom", "DS-2DE7530IW-AE", "150m", "5MP", "PTZ" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 18);

            migrationBuilder.DeleteData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 19);

            migrationBuilder.DeleteData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 20);

            migrationBuilder.DeleteData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 21);

            migrationBuilder.DropColumn(
                name: "Brand",
                table: "Cameras");

            migrationBuilder.DropColumn(
                name: "LensSize",
                table: "Cameras");

            migrationBuilder.RenameColumn(
                name: "ModelNumber",
                table: "Cameras",
                newName: "Name");

            migrationBuilder.AlterColumn<double>(
                name: "Range",
                table: "Cameras",
                type: "float",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<double>(
                name: "FieldOfView",
                table: "Cameras",
                type: "float",
                nullable: false,
                defaultValue: 0.0);
        }
    }
}
