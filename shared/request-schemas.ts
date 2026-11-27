import { z } from "zod";

export const loginRequestSchema = z.object({
	username: z.string().min(1),
	password: z.string().min(1),
});

export type LoginRequest = z.input<typeof loginRequestSchema>;

export const tableExportRequestSchema = z.object({
	headers: z.array(z.unknown()).min(1),
	rows: z.array(z.unknown()).optional(),
	fileName: z.unknown(),
	sheetName: z.unknown(),
	format: z.unknown(),
	csvSeparator: z.unknown(),
});

export type TableExportRequest = z.input<typeof tableExportRequestSchema>;
