using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomCamerasAndObstacles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CustomCameraId",
                table: "CameraPlacemens",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CustomCamera",
                columns: table => new
                {
                    CustomCameraId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CreatedByUserId = table.Column<int>(type: "int", nullable: false),
                    ModelNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Brand = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Resolution = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Range = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LensSize = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LensType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FovHorizontal = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FovVertical = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FovDiagonal = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IrRange = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Aperture = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    OperatingTemp = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Price = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PowerConsumption = table.Column<double>(type: "float", nullable: true),
                    Bitrate = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedById = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomCamera", x => x.CustomCameraId);
                    table.ForeignKey(
                        name: "FK_CustomCamera_Users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_CameraPlacemens_CustomCameraId",
                table: "CameraPlacemens",
                column: "CustomCameraId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomCamera_CreatedById",
                table: "CustomCamera",
                column: "CreatedById");

            migrationBuilder.AddForeignKey(
                name: "FK_CameraPlacemens_CustomCamera_CustomCameraId",
                table: "CameraPlacemens",
                column: "CustomCameraId",
                principalTable: "CustomCamera",
                principalColumn: "CustomCameraId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CameraPlacemens_CustomCamera_CustomCameraId",
                table: "CameraPlacemens");

            migrationBuilder.DropTable(
                name: "CustomCamera");

            migrationBuilder.DropIndex(
                name: "IX_CameraPlacemens_CustomCameraId",
                table: "CameraPlacemens");

            migrationBuilder.DropColumn(
                name: "CustomCameraId",
                table: "CameraPlacemens");
        }
    }
}
