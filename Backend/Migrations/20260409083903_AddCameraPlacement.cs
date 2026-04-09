using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddCameraPlacement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CameraPlacemens",
                columns: table => new
                {
                    PlacementID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FloorID = table.Column<int>(type: "int", nullable: false),
                    CameraId = table.Column<int>(type: "int", nullable: false),
                    X = table.Column<double>(type: "float", nullable: false),
                    Y = table.Column<double>(type: "float", nullable: false),
                    Rotation = table.Column<double>(type: "float", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FloorLayoutFloorID = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CameraPlacemens", x => x.PlacementID);
                    table.ForeignKey(
                        name: "FK_CameraPlacemens_FloorLayouts_FloorLayoutFloorID",
                        column: x => x.FloorLayoutFloorID,
                        principalTable: "FloorLayouts",
                        principalColumn: "FloorID");
                });

            migrationBuilder.CreateIndex(
                name: "IX_CameraPlacemens_FloorLayoutFloorID",
                table: "CameraPlacemens",
                column: "FloorLayoutFloorID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CameraPlacemens");
        }
    }
}
