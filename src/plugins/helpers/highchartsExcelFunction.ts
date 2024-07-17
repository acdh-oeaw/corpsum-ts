// @ts-nocheck
 
// sadly this function is just js, so need to disable typechecker for it
import zipcelx from "zipcelx";

export const HighchartsExcelDownload = (H) => {
	if (H.getOptions().exporting) {
		H.Chart.prototype.downloadXLSX = function () {
			const div = document.createElement("div");
			let name,
				xlsxRows = [];
			div.style.display = "none";
			document.body.appendChild(div);
			const rows = this.getDataRows(true);
			xlsxRows = rows.slice(1).map(function (row) {
				return row.map(function (column) {
					return {
						type: typeof column === "number" ? "number" : "string",
						value: column,
					};
				});
			});

			// Get the filename, copied from the Chart.fileDownload function
			if (this.options.exporting.filename) {
				name = this.options.exporting.filename;
			} else if (this.title.textStr) {
				name = this.title.textStr.replace(/ /g, "-").toLowerCase();
			} else {
				name = "chart";
			}

			zipcelx({
				filename: name,
				sheet: {
					data: xlsxRows,
				},
			});
		};

		// Default lang string, overridable in i18n options
		H.getOptions().lang.downloadXLSX = "Download XLSX";

		// Add the menu item handler
		H.getOptions().exporting.menuItemDefinitions.downloadXLSX = {
			textKey: "downloadXLSX",
			onclick: function () {
				this.downloadXLSX();
			},
		};

		// Replace the menu item
		const menuItems = H.getOptions().exporting.buttons.contextButton.menuItems;
		menuItems[menuItems.indexOf("downloadXLS")] = "downloadXLSX";
	}
};
