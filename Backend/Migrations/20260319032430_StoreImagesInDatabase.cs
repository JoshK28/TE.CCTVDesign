using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class StoreImagesInDatabase : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Image",
                table: "FloorLayouts",
                newName: "ImageContentType");

            migrationBuilder.AddColumn<string>(
                name: "FileName",
                table: "FloorLayouts",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<byte[]>(
                name: "ImageData",
                table: "FloorLayouts",
                type: "varbinary(max)",
                nullable: false,
                defaultValue: new byte[0]);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FileName",
                table: "FloorLayouts");

            migrationBuilder.DropColumn(
                name: "ImageData",
                table: "FloorLayouts");

            migrationBuilder.RenameColumn(
                name: "ImageContentType",
                table: "FloorLayouts",
                newName: "Image");
        }
    }
}
