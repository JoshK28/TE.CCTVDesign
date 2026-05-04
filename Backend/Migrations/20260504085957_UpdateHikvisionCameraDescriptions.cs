using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class UpdateHikvisionCameraDescriptions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 2,
                column: "Description",
                value: "Camera - 4MP Mini Bullet 4MP Bullet 40m IR IP67 2.8mm HIKVision");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 3,
                column: "Description",
                value: "Camera Bullet Single 2MP 30m WiFi IR IP66 2.8mm t/s CCTV c/w Power Adaptor I01213");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 4,
                column: "Description",
                value: "Camera Bullet 6MP 50m IR 2.8mm EXIR H.26 120dB WDR IP67");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 5,
                column: "Description",
                value: "Camera - HIKVision 4K AcuSense Strobe Light Audible Warning Varifocal Bullet Netwok");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 6,
                column: "Description",
                value: "Camera - Hikvision 4MP Deepin View ANPR Moto VF Bullet 8-32m iDS-(8-32mm)");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 8,
                column: "Description",
                value: "Camera Outdoor Dome 2MP 120db WDR IP67 Fixed Lens 30m IR 2.8mm HikVision");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 10,
                column: "Description",
                value: "Camera Dome 6MP WDR Smart 2.8mm H.265 120dB (C)(0-STD");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 12,
                column: "Description",
                value: "Camera - HIKVision 4MP Dome DeepinView Moto Varifocal 2.8- 12mm IK10");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 13,
                column: "Description",
                value: "Camera - Hikvision 8 MP Smart Hybrid Light with ColorVu Mini Dome 2.8mm");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 14,
                column: "Description",
                value: "Camera-Hikvision 4MP 4XOutdoor IR Wi-Fi Mini Dome PTZ DS-2DE2A404IW-DE3/W(S6)");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 15,
                column: "Description",
                value: "Camera-HikVision 2.8mm Panoram Dome 32x PTZ TandemVu Camera");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 16,
                column: "Description",
                value: "Dome Camera 5MP 2.8-12mm Varifocal H.265+ IP67 IK10 HikVision (2.8-12mm)(C)(O-STD)");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 17,
                column: "Description",
                value: "Camera FishEye 5MP H.265 Indoor 20M IR EasyIP3.0 HikVision");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 18,
                column: "Description",
                value: "Camera - Hikvision 6 MP Deepin View Fisheye Network 1.16 mm DS-2CD6365G1-IVS(1.16mm)");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 19,
                column: "Description",
                value: "Camera - 5MP Fixed Fisheye Network");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 2,
                column: "Description",
                value: "Camera 4MP Mini Bullet 40m IR IP67 2.8mm HIKVision");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 3,
                column: "Description",
                value: "Camera Bullet Single 2MP 30m WiFi IR IP66 2.8mm");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 4,
                column: "Description",
                value: "Camera Bullet 6MP 50m IR 2.8mm EXIR H.265 120dB WDR IP67");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 5,
                column: "Description",
                value: "Camera HIKVision 4K AcuSense Strobe Light Audible Warning Varifocal Bullet");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 6,
                column: "Description",
                value: "Camera Hikvision 4MP Deepin View ANPR Moto VF Bullet 8-32mm");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 8,
                column: "Description",
                value: "Camera Outdoor Dome 2MP 120dB WDR IP67 Fixed Lens 30m IR 2.8mm HikVision");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 10,
                column: "Description",
                value: "Camera Dome 6MP WDR Smart 2.8mm H.265 120dB");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 12,
                column: "Description",
                value: "Camera HIKVision 4MP Dome DeepinView Moto Varifocal 2.8-12mm IK10");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 13,
                column: "Description",
                value: "Camera Hikvision 8MP Smart Hybrid Light with ColorVu Mini Dome 2.8mm");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 14,
                column: "Description",
                value: "Camera Hikvision 4MP 4X Outdoor IR Wi-Fi Mini Dome PTZ");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 15,
                column: "Description",
                value: "Camera HikVision 2.8mm Panoramic Dome 32x PTZ TandemVu Camera");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 16,
                column: "Description",
                value: "Dome Camera 5MP 2.8-12mm Varifocal H.265+ IP67 IK10 HikVision");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 17,
                column: "Description",
                value: "Camera FishEye 5MP H.265 Indoor 20m IR EasyIP3.0 HikVision");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 18,
                column: "Description",
                value: "Camera Hikvision 6MP Deepin View Fisheye Network 1.16mm");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 19,
                column: "Description",
                value: "Camera 5MP Fixed Fisheye Network");
        }
    }
}
