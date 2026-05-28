using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddFovFieldsToCameraPlacement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "CorridorMode",
                table: "CameraPlacemens",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<double>(
                name: "FocalLength",
                table: "CameraPlacemens",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "IrRange",
                table: "CameraPlacemens",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<string>(
                name: "SensorType",
                table: "CameraPlacemens",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CorridorMode",
                table: "CameraPlacemens");

            migrationBuilder.DropColumn(
                name: "FocalLength",
                table: "CameraPlacemens");

            migrationBuilder.DropColumn(
                name: "IrRange",
                table: "CameraPlacemens");

            migrationBuilder.DropColumn(
                name: "SensorType",
                table: "CameraPlacemens");
        }
    }
}
