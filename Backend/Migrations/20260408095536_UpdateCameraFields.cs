using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class UpdateCameraFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Aperture",
                table: "Cameras",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "FovDiagonal",
                table: "Cameras",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "FovHorizontal",
                table: "Cameras",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "FovVertical",
                table: "Cameras",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "IrRange",
                table: "Cameras",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "LensType",
                table: "Cameras",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "OperatingTemp",
                table: "Cameras",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Price",
                table: "Cameras",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "Aperture", "FovDiagonal", "FovHorizontal", "FovVertical", "IrRange", "LensType", "OperatingTemp", "Price", "Range" },
                values: new object[] { "F1.4", "133°–53°", "112°–46°", "60°–26°", "50m", "Motorised Varifocal", "–30°C to 60°C", "$480–$650", "50m" });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "Aperture", "FovDiagonal", "FovHorizontal", "FovVertical", "IrRange", "LensType", "OperatingTemp", "Price" },
                values: new object[] { "F1.4", "123°–98°–62°", "103°–83°–53°", "55°–45°–28°", "40m", "Fixed Focal Lens", "–30°C to 60°C", "$180–$260" });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "Aperture", "FovDiagonal", "FovHorizontal", "FovVertical", "IrRange", "LensType", "OperatingTemp", "Price" },
                values: new object[] { "F2.0", "135°–102°", "114°–86°", "62°–46°", "30m", "Fixed Focal Lens", "–30°C to 60°C", "$120–$180" });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "Aperture", "FovDiagonal", "FovHorizontal", "FovVertical", "IrRange", "LensType", "OperatingTemp", "Price" },
                values: new object[] { "F1.6", "128°–101°", "99°–80°–60°", "61°–51°–38°", "80m", "Fixed Focal Lens", "–30°C to 60°C", "$260–$340" });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "Aperture", "FovDiagonal", "FovHorizontal", "FovVertical", "IrRange", "LensType", "OperatingTemp", "Price", "Range" },
                values: new object[] { "F1.4", "127.4°–52°", "108°–46°", "58°–26°", "60m", "Motorised Varifocal", "–30°C to 60°C", "$590–$750", "60" });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "Aperture", "FovDiagonal", "FovHorizontal", "FovVertical", "IrRange", "LensType", "OperatingTemp", "Price" },
                values: new object[] { "F1.4", "127°–52°", "108°–46°", "58°–26°", "80m", "Motorised Varifocal", "–30°C to 60°C", "$650–$850" });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "Aperture", "FovDiagonal", "FovHorizontal", "FovVertical", "IrRange", "LensType", "OperatingTemp", "Price", "Range" },
                values: new object[] { "F1.5", "67°–3°", "57°–2.6°", "33°–1.5°", "100m", "Motorised Varifocal", "–30°C to 60°C", "$900–$1200", "100m" });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 8,
                columns: new[] { "Aperture", "FovDiagonal", "FovHorizontal", "FovVertical", "IrRange", "LensType", "OperatingTemp", "Price" },
                values: new object[] { "F2.0", "135°–102°", "114°–86°", "62°–46°", "30m", "Fixed Focal Lens", "–30°C to 60°C", "$120–$180" });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 9,
                columns: new[] { "Aperture", "FovDiagonal", "FovHorizontal", "FovVertical", "IrRange", "LensType", "OperatingTemp", "Price", "Range" },
                values: new object[] { "F1.6", "122.6°-37.8", "103.4°–33°", "53.8°-18.9°", "30m", "PTZ", "–30°C to 60°C", "$350–$500", "30m" });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 10,
                columns: new[] { "Aperture", "FovDiagonal", "FovHorizontal", "FovVertical", "IrRange", "LensType", "OperatingTemp", "Price", "Range" },
                values: new object[] { "F1.6", "128°–101°", "99°–80°", "61°–51°", "30m", "Fixed Focal Lens", "–30°C to 60°C", "$260–$340", "30m" });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 11,
                columns: new[] { "Aperture", "FovDiagonal", "FovHorizontal", "FovVertical", "IrRange", "LensType", "OperatingTemp", "Price", "Range" },
                values: new object[] { "F1.5", "60.5°-3°", "57°–2.6°", "30.6°-1.5°", "50m", "PTZ", "–30°C to 60°C", "$900–$1200", "50m" });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 12,
                columns: new[] { "Aperture", "FovDiagonal", "FovHorizontal", "FovVertical", "IrRange", "LensType", "OperatingTemp", "Price", "Range" },
                values: new object[] { "F1.4", "127°–52°", "108°–46°", "58°–26°", "80m", "Motorised Varifocal", "–30°C to 60°C", "$650–$850", "80m" });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 13,
                columns: new[] { "Aperture", "FovDiagonal", "FovHorizontal", "FovVertical", "IrRange", "LensType", "OperatingTemp", "Price", "Range" },
                values: new object[] { "F1.6", "120°", "102°", "55°", "30m", "Fixed Focal Lens", "–30°C to 60°C", "$260–$340", "30m" });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 14,
                columns: new[] { "Aperture", "FovDiagonal", "FovHorizontal", "FovVertical", "IrRange", "LensType", "OperatingTemp", "Price", "Range" },
                values: new object[] { "F1.6", "115.13°-36.32°", "98°–30°", "51.16°-17.8°", "50m", "PTZ", "–30°C to 60°C", "$450–$650", "50m" });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 15,
                columns: new[] { "Aperture", "FovDiagonal", "FovHorizontal", "FovVertical", "IrRange", "LensType", "OperatingTemp", "Price", "Range" },
                values: new object[] { "F1.5", "", "57°–2.6°", "", "150m", "PTZ", "–30°C to 60°C", "$1800–$2400", "150m" });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 16,
                columns: new[] { "Aperture", "FovDiagonal", "FovHorizontal", "FovVertical", "IrRange", "LensType", "OperatingTemp", "Price", "Range" },
                values: new object[] { "F1.6", "128°–35°", "99°–30°", "61°–17°", "40m", "Motorised Varifocal", "–30°C to 60°C", "$350–$500", "40m" });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 17,
                columns: new[] { "Aperture", "FovDiagonal", "FovHorizontal", "FovVertical", "IrRange", "LensType", "OperatingTemp", "Price" },
                values: new object[] { "F2.0", "", "360°", "", "10m", "Fisheye", "–30°C to 60°C", "$250–$350" });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 18,
                columns: new[] { "Aperture", "FovDiagonal", "FovHorizontal", "FovVertical", "IrRange", "LensType", "OperatingTemp", "Price", "Range" },
                values: new object[] { "F2.0", "", "360°", "", "15m", "Fisheye", "–30°C to 60°C", "$450–$650", "15m" });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 19,
                columns: new[] { "Aperture", "FovDiagonal", "FovHorizontal", "FovVertical", "IrRange", "LensType", "OperatingTemp", "Price", "Range" },
                values: new object[] { "F2.0", "", "360°", "", "10m", "Fisheye", "–30°C to 60°C", "$250–$350", "10m" });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 20,
                columns: new[] { "Aperture", "FovDiagonal", "FovHorizontal", "FovVertical", "IrRange", "LensType", "OperatingTemp", "Price", "Range" },
                values: new object[] { "F1.6", "", "59°–2.3°", "", "100m", "PTZ", "–30°C to 60°C", "$1200–$1600", "100m" });

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 21,
                columns: new[] { "Aperture", "FovDiagonal", "FovHorizontal", "FovVertical", "IrRange", "LensType", "OperatingTemp", "Price" },
                values: new object[] { "F1.5", "", "60°–2.3°", "", "200m", "PTZ", "–30°C to 60°C", "$2500–$3200" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Aperture",
                table: "Cameras");

            migrationBuilder.DropColumn(
                name: "FovDiagonal",
                table: "Cameras");

            migrationBuilder.DropColumn(
                name: "FovHorizontal",
                table: "Cameras");

            migrationBuilder.DropColumn(
                name: "FovVertical",
                table: "Cameras");

            migrationBuilder.DropColumn(
                name: "IrRange",
                table: "Cameras");

            migrationBuilder.DropColumn(
                name: "LensType",
                table: "Cameras");

            migrationBuilder.DropColumn(
                name: "OperatingTemp",
                table: "Cameras");

            migrationBuilder.DropColumn(
                name: "Price",
                table: "Cameras");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 1,
                column: "Range",
                value: "");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 5,
                column: "Range",
                value: "");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 7,
                column: "Range",
                value: "");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 9,
                column: "Range",
                value: "");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 10,
                column: "Range",
                value: "");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 11,
                column: "Range",
                value: "");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 12,
                column: "Range",
                value: "");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 13,
                column: "Range",
                value: "");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 14,
                column: "Range",
                value: "");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 15,
                column: "Range",
                value: "");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 16,
                column: "Range",
                value: "");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 18,
                column: "Range",
                value: "");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 19,
                column: "Range",
                value: "");

            migrationBuilder.UpdateData(
                table: "Cameras",
                keyColumn: "Id",
                keyValue: 20,
                column: "Range",
                value: "");
        }
    }
}
