using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddObstaclesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CameraPlacemens_CustomCamera_CustomCameraId",
                table: "CameraPlacemens");

            migrationBuilder.DropForeignKey(
                name: "FK_CustomCamera_Users_CreatedById",
                table: "CustomCamera");

            migrationBuilder.DropPrimaryKey(
                name: "PK_CustomCamera",
                table: "CustomCamera");

            migrationBuilder.DropIndex(
                name: "IX_CustomCamera_CreatedById",
                table: "CustomCamera");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "CustomCamera");

            migrationBuilder.RenameTable(
                name: "CustomCamera",
                newName: "CustomCameras");

            migrationBuilder.AddPrimaryKey(
                name: "PK_CustomCameras",
                table: "CustomCameras",
                column: "CustomCameraId");

            migrationBuilder.CreateTable(
                name: "Obstacles",
                columns: table => new
                {
                    ObstacleId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FloorID = table.Column<int>(type: "int", nullable: false),
                    Label = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    X = table.Column<double>(type: "float", nullable: false),
                    Y = table.Column<double>(type: "float", nullable: false),
                    Width = table.Column<double>(type: "float", nullable: false),
                    Height = table.Column<double>(type: "float", nullable: false),
                    Rotation = table.Column<double>(type: "float", nullable: false),
                    Color = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Obstacles", x => x.ObstacleId);
                    table.ForeignKey(
                        name: "FK_Obstacles_FloorLayouts_FloorID",
                        column: x => x.FloorID,
                        principalTable: "FloorLayouts",
                        principalColumn: "FloorID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CustomCameras_CreatedByUserId",
                table: "CustomCameras",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Obstacles_FloorID",
                table: "Obstacles",
                column: "FloorID");

            migrationBuilder.AddForeignKey(
                name: "FK_CameraPlacemens_CustomCameras_CustomCameraId",
                table: "CameraPlacemens",
                column: "CustomCameraId",
                principalTable: "CustomCameras",
                principalColumn: "CustomCameraId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_CustomCameras_Users_CreatedByUserId",
                table: "CustomCameras",
                column: "CreatedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CameraPlacemens_CustomCameras_CustomCameraId",
                table: "CameraPlacemens");

            migrationBuilder.DropForeignKey(
                name: "FK_CustomCameras_Users_CreatedByUserId",
                table: "CustomCameras");

            migrationBuilder.DropTable(
                name: "Obstacles");

            migrationBuilder.DropPrimaryKey(
                name: "PK_CustomCameras",
                table: "CustomCameras");

            migrationBuilder.DropIndex(
                name: "IX_CustomCameras_CreatedByUserId",
                table: "CustomCameras");

            migrationBuilder.RenameTable(
                name: "CustomCameras",
                newName: "CustomCamera");

            migrationBuilder.AddColumn<int>(
                name: "CreatedById",
                table: "CustomCamera",
                type: "int",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_CustomCamera",
                table: "CustomCamera",
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

            migrationBuilder.AddForeignKey(
                name: "FK_CustomCamera_Users_CreatedById",
                table: "CustomCamera",
                column: "CreatedById",
                principalTable: "Users",
                principalColumn: "Id");
        }
    }
}
