using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddPowerAndBitrateFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "PowerConsumption",
                table: "NetworkingDevices",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Bitrate",
                table: "Cameras",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "PowerConsumption",
                table: "Cameras",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "PowerConsumption",
                table: "AccessControlDevices",
                type: "float",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "Bitrate", "PowerConsumption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "Bitrate", "PowerConsumption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "Bitrate", "PowerConsumption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "Bitrate", "PowerConsumption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "Bitrate", "PowerConsumption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "Bitrate", "PowerConsumption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "Bitrate", "PowerConsumption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 8,
                columns: new[] { "Bitrate", "PowerConsumption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 9,
                columns: new[] { "Bitrate", "PowerConsumption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 10,
                columns: new[] { "Bitrate", "PowerConsumption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 11,
                columns: new[] { "Bitrate", "PowerConsumption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 12,
                columns: new[] { "Bitrate", "PowerConsumption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 13,
                columns: new[] { "Bitrate", "PowerConsumption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 14,
                columns: new[] { "Bitrate", "PowerConsumption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 15,
                columns: new[] { "Bitrate", "PowerConsumption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 16,
                columns: new[] { "Bitrate", "PowerConsumption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 17,
                columns: new[] { "Bitrate", "PowerConsumption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 18,
                columns: new[] { "Bitrate", "PowerConsumption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 19,
                columns: new[] { "Bitrate", "PowerConsumption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 20,
                columns: new[] { "Bitrate", "PowerConsumption" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 21,
                columns: new[] { "Bitrate", "PowerConsumption" },
                values: new object[] { null, null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PowerConsumption",
                table: "NetworkingDevices");

            migrationBuilder.DropColumn(
                name: "Bitrate",
                table: "Cameras");

            migrationBuilder.DropColumn(
                name: "PowerConsumption",
                table: "Cameras");

            migrationBuilder.DropColumn(
                name: "PowerConsumption",
                table: "AccessControlDevices");
        }
    }
}
