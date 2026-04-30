using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddWallsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Walls",
                columns: table => new
                {
                    WallID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FloorID = table.Column<int>(type: "int", nullable: false),
                    X1 = table.Column<double>(type: "float", nullable: false),
                    Y1 = table.Column<double>(type: "float", nullable: false),
                    X2 = table.Column<double>(type: "float", nullable: false),
                    Y2 = table.Column<double>(type: "float", nullable: false),
                    Length = table.Column<double>(type: "float", nullable: false),
                    RealWorldLength = table.Column<double>(type: "float", nullable: false),
                    RealWorldHeight = table.Column<double>(type: "float", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Walls", x => x.WallID);
                    table.ForeignKey(
                        name: "FK_Walls_FloorLayouts_FloorID",
                        column: x => x.FloorID,
                        principalTable: "FloorLayouts",
                        principalColumn: "FloorID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Walls_FloorID",
                table: "Walls",
                column: "FloorID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Walls");
        }
    }
}
