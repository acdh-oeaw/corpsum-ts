import { createRequire } from "node:module";

import { createError, defineEventHandler, readBody, setHeader } from "h3";

interface XlsxModule {
	utils: {
		book_new: () => unknown;
		aoa_to_sheet: (data: Array<Array<string>>) => unknown;
		book_append_sheet: (workbook: unknown, worksheet: unknown, name: string) => void;
		sheet_to_csv: (
			worksheet: unknown,
			options?: { FS?: string; RS?: string; strip?: boolean; blankrows?: boolean },
		) => string;
	};
	write: (workbook: unknown, options: { bookType: "xlsx"; type: "buffer" }) => Buffer;
}

const require = createRequire(import.meta.url);
const XLSX = require("xlsx") as unknown as XlsxModule;

interface ExportRequestBody {
	fileName?: unknown;
	headers?: Array<unknown>;
	rows?: Array<Array<unknown>>;
	sheetName?: unknown;
	format?: unknown;
	csvSeparator?: unknown;
}

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
	const body = await readBody<ExportRequestBody>(event);
	const headers = Array.isArray(body.headers)
		? body.headers.map((header) => normalizeCell(header))
		: [];
	if (headers.length === 0) {
		throw createError({ message: "Missing export headers.", statusCode: 400 });
	}

	const rows = Array.isArray(body.rows)
		? body.rows.map((row) =>
				Array.isArray(row) ? row.map((cell) => normalizeCell(cell)) : [normalizeCell(row)],
			)
		: [];

	const worksheetData = [headers, ...rows];
	const workbook = XLSX.utils.book_new();
	const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
	XLSX.utils.book_append_sheet(workbook, worksheet, sanitizeSheetName(body.sheetName));
	const format = getStringValue(body.format).toLowerCase() === "csv" ? "csv" : "xlsx";
	const fileName = sanitizeFileName(body.fileName);

	if (format === "csv") {
		const csvSeparator = getStringValue(body.csvSeparator) || ",";
		const csvString = XLSX.utils.sheet_to_csv(worksheet, {
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

	const workbookBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

	setHeader(
		event,
		"Content-Type",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	);
	setHeader(event, "Content-Disposition", `attachment; filename="${fileName}.xlsx"`);
	setHeader(event, "Content-Length", workbookBuffer.byteLength);

	return workbookBuffer;
});
