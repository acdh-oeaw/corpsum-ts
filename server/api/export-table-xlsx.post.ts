import { createError, defineEventHandler, readBody, setHeader } from "h3";
import { utils, write } from "xlsx";

import { tableExportRequestSchema } from "~/shared/request-schemas";

function getStringValue(value: unknown) {
	if (typeof value === "string") return value;
	if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint")
		return value.toString();
	if (typeof value === "symbol") return value.description ?? "";
	if (value instanceof Date) return value.toISOString();
	return "";
}

function removeControlChars(value: string) {
	return value
		.split("")
		.filter((char) => char.charCodeAt(0) >= 32)
		.join("");
}

function sanitizeFileName(fileName?: unknown) {
	const value = removeControlChars(getStringValue(fileName))
		.trim()
		.replace(/[<>:"/\\|?*]/g, "_")
		.replace(/\s+/g, " ")
		.slice(0, 120);
	return value.length > 0 ? value : "table-export";
}

function sanitizeSheetName(sheetName?: unknown) {
	const value = removeControlChars(getStringValue(sheetName))
		.trim()
		.split("")
		.map((char) => (":\\/?*[]".includes(char) ? "_" : char))
		.join("")
		.slice(0, 31);
	return value.length > 0 ? value : "Table";
}

function normalizeCell(value: unknown) {
	if (value === null || value === undefined) return "";
	if (Array.isArray(value)) return value.join("; ");
	if (typeof value === "string") return value;
	if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint")
		return value.toString();
	if (typeof value === "symbol") return value.description ?? "";
	if (value instanceof Date) return value.toISOString();
	if (typeof value === "object") return JSON.stringify(value);
	return "";
}

export default defineEventHandler(async (event) => {
	const payload = tableExportRequestSchema.safeParse(await readBody<unknown>(event));
	if (!payload.success) {
		throw createError({ message: "Invalid table export request.", statusCode: 400 });
	}
	const body = payload.data;
	const headers = body.headers.map(normalizeCell);

	const rows = (body.rows ?? []).map((row) =>
		Array.isArray(row) ? row.map(normalizeCell) : [normalizeCell(row)],
	);

	const worksheetData = [headers, ...rows];
	const workbook = utils.book_new();
	const worksheet = utils.aoa_to_sheet(worksheetData);
	utils.book_append_sheet(workbook, worksheet, sanitizeSheetName(body.sheetName));
	const format = getStringValue(body.format).toLowerCase() === "csv" ? "csv" : "xlsx";
	const fileName = sanitizeFileName(body.fileName);

	if (format === "csv") {
		const csvSeparator = getStringValue(body.csvSeparator) || ",";
		const csvString = utils.sheet_to_csv(worksheet, {
			FS: csvSeparator,
			RS: "\n",
			blankrows: false,
			strip: true,
		});
		const csvBuffer = Buffer.from(csvString, "utf8");
		setHeader(event, "Content-Type", "text/csv; charset=utf-8");
		setHeader(event, "Content-Disposition", `attachment; filename="${fileName}.csv"`);
		setHeader(event, "Content-Length", csvBuffer.byteLength);
		return csvBuffer;
	}

	const workbookBuffer = write(workbook, { bookType: "xlsx", type: "buffer" });

	setHeader(
		event,
		"Content-Type",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	);
	setHeader(event, "Content-Disposition", `attachment; filename="${fileName}.xlsx"`);
	setHeader(event, "Content-Length", workbookBuffer.byteLength);

	return workbookBuffer;
});
