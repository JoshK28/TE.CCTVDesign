using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class UpdateCameraPlacementRelationships : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
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

            migrationBuilder.DropIndex(
                name: "IX_CameraPlacemens_AccessControlDeviceAccessControlID",
                table: "CameraPlacemens");

            migrationBuilder.DropIndex(
                name: "IX_CameraPlacemens_NetworkingDeviceNetworkingID",
                table: "CameraPlacemens");

            migrationBuilder.DropColumn(
                name: "AccessControlDeviceAccessControlID",
                table: "CameraPlacemens");

            migrationBuilder.DropColumn(
                name: "NetworkingDeviceNetworkingID",
                table: "CameraPlacemens");

            migrationBuilder.CreateIndex(
                name: "IX_CameraPlacemens_AccessControlId",
                table: "CameraPlacemens",
                column: "AccessControlId");

            migrationBuilder.CreateIndex(
                name: "IX_CameraPlacemens_NetworkingId",
                table: "CameraPlacemens",
                column: "NetworkingId");

            migrationBuilder.AddForeignKey(
                name: "FK_CameraPlacemens_AccessControlDevices_AccessControlId",
                table: "CameraPlacemens",
                column: "AccessControlId",
                principalTable: "AccessControlDevices",
                principalColumn: "AccessControlID",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_CameraPlacemens_Cameras_CameraId",
                table: "CameraPlacemens",
                column: "CameraId",
                principalTable: "Cameras",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_CameraPlacemens_NetworkingDevices_NetworkingId",
                table: "CameraPlacemens",
                column: "NetworkingId",
                principalTable: "NetworkingDevices",
                principalColumn: "NetworkingID",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CameraPlacemens_AccessControlDevices_AccessControlId",
                table: "CameraPlacemens");

            migrationBuilder.DropForeignKey(
                name: "FK_CameraPlacemens_Cameras_CameraId",
                table: "CameraPlacemens");

            migrationBuilder.DropForeignKey(
                name: "FK_CameraPlacemens_NetworkingDevices_NetworkingId",
                table: "CameraPlacemens");

            migrationBuilder.DropIndex(
                name: "IX_CameraPlacemens_AccessControlId",
                table: "CameraPlacemens");

            migrationBuilder.DropIndex(
                name: "IX_CameraPlacemens_NetworkingId",
                table: "CameraPlacemens");

            migrationBuilder.AddColumn<int>(
                name: "AccessControlDeviceAccessControlID",
                table: "CameraPlacemens",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "NetworkingDeviceNetworkingID",
                table: "CameraPlacemens",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CameraPlacemens_AccessControlDeviceAccessControlID",
                table: "CameraPlacemens",
                column: "AccessControlDeviceAccessControlID");

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
    }
}
