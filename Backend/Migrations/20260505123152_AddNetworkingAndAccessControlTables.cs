using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddNetworkingAndAccessControlTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "CameraId",
                table: "CameraPlacemens",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<int>(
                name: "AccessControlDeviceAccessControlID",
                table: "CameraPlacemens",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AccessControlId",
                table: "CameraPlacemens",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "NetworkingDeviceNetworkingID",
                table: "CameraPlacemens",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "NetworkingId",
                table: "CameraPlacemens",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AccessControlDevices",
                columns: table => new
                {
                    AccessControlID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Manufacturer = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Price = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccessControlDevices", x => x.AccessControlID);
                });

            migrationBuilder.CreateTable(
                name: "NetworkingDevices",
                columns: table => new
                {
                    NetworkingID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Manufacturer = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Price = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NetworkingDevices", x => x.NetworkingID);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CameraPlacemens_AccessControlDeviceAccessControlID",
                table: "CameraPlacemens",
                column: "AccessControlDeviceAccessControlID");

            migrationBuilder.CreateIndex(
                name: "IX_CameraPlacemens_CameraId",
                table: "CameraPlacemens",
                column: "CameraId");

            migrationBuilder.CreateIndex(
                name: "IX_CameraPlacemens_NetworkingDeviceNetworkingID",
                table: "CameraPlacemens",
                column: "NetworkingDeviceNetworkingID");

            migrationBuilder.AddForeignKey(
                name: "FK_CameraPlacemens_AccessControlDevices_AccessControlDeviceAccessControlID",
                table: "CameraPlacemens",
                column: "AccessControlDeviceAccessControlID",
                principalTable: "AccessControlDevices",
                principalColumn: "AccessControlID");

            migrationBuilder.AddForeignKey(
                name: "FK_CameraPlacemens_Cameras_CameraId",
                table: "CameraPlacemens",
                column: "CameraId",
                principalTable: "Cameras",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_CameraPlacemens_NetworkingDevices_NetworkingDeviceNetworkingID",
                table: "CameraPlacemens",
                column: "NetworkingDeviceNetworkingID",
                principalTable: "NetworkingDevices",
                principalColumn: "NetworkingID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CameraPlacemens_AccessControlDevices_AccessControlDeviceAccessControlID",
                table: "CameraPlacemens");

            migrationBuilder.DropForeignKey(
                name: "FK_CameraPlacemens_Cameras_CameraId",
                table: "CameraPlacemens");

            migrationBuilder.DropForeignKey(
                name: "FK_CameraPlacemens_NetworkingDevices_NetworkingDeviceNetworkingID",
                table: "CameraPlacemens");

            migrationBuilder.DropTable(
                name: "AccessControlDevices");

            migrationBuilder.DropTable(
                name: "NetworkingDevices");

            migrationBuilder.DropIndex(
                name: "IX_CameraPlacemens_AccessControlDeviceAccessControlID",
                table: "CameraPlacemens");

            migrationBuilder.DropIndex(
                name: "IX_CameraPlacemens_CameraId",
                table: "CameraPlacemens");

            migrationBuilder.DropIndex(
                name: "IX_CameraPlacemens_NetworkingDeviceNetworkingID",
                table: "CameraPlacemens");

            migrationBuilder.DropColumn(
                name: "AccessControlDeviceAccessControlID",
                table: "CameraPlacemens");

            migrationBuilder.DropColumn(
                name: "AccessControlId",
                table: "CameraPlacemens");

            migrationBuilder.DropColumn(
                name: "NetworkingDeviceNetworkingID",
                table: "CameraPlacemens");

            migrationBuilder.DropColumn(
                name: "NetworkingId",
                table: "CameraPlacemens");

            migrationBuilder.AlterColumn<int>(
                name: "CameraId",
                table: "CameraPlacemens",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);
        }
    }
}
