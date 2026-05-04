using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddUpsDevices : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UpsDevices",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PowerWatts = table.Column<int>(type: "int", nullable: false),
                    DefaultUnits = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UpsDevices", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "UpsDevices",
                columns: new[] { "Id", "DefaultUnits", "Name", "PowerWatts" },
                values: new object[,]
                {
                    { 1, 1, "AXIS QD536 8MP Dome", 15 },
                    { 2, 1, "HikVision DS-2CD2142FWD", 12 },
                    { 3, 1, "NVR 16CH 4K", 40 },
                    { 4, 1, "Network Switch PoE 8-port", 60 },
                    { 5, 1, "Access Control Panel (4-door)", 25 },
                    { 6, 1, "Electric Strike (per door)", 10 },
                    { 7, 1, "HID Card Reader", 3 },
                    { 8, 1, "Monitors / workstation load (allowance)", 80 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UpsDevices");
        }
    }
}
