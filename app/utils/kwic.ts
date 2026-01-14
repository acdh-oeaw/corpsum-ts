import type { ColumnDef } from "@tanstack/vue-table";
import { ExternalLink } from "lucide-vue-next";

interface RowObj {
	row: { getValue: (s: string) => string; original: KeywordInContext };
}

export const getKWICColumns = (
	t: (s: string) => string,
	open: (keyword: KeywordInContext) => void,
	additionalRefHeaders: Array<string>,
	fixedKWICStructures: Array<string>,
): Array<ColumnDef<KeywordInContext>> => {
	const columns: Array<ColumnDef<KeywordInContext>> = [
		{
			accessorKey: "source",
			header: () => h("div", { class: "text-right" }, t("Corpsum.source")),
			cell: ({ row }: RowObj) => {
				const source = row.getValue("source");
				return h("div", { class: "text-right font-medium" }, source);
			},
		},
		{
			accessorKey: "region",
			header: () => h("div", { class: "text-right" }, t("Corpsum.region")),
			cell: ({ row }: RowObj) => {
				const region = row.getValue("region");
				return h("div", { class: "text-right font-medium" }, region);
			},
		},
		{
			accessorKey: "left",
			header: () => h("div", { class: "text-right" }, t("Corpsum.left")),
			cell: ({ row }: RowObj) => {
				const left = row.getValue("left");
				return h(
					"div",
					{
						class: "text-right font-medium overflow-hidden text-ellipsis",
						style: "max-width: 24rem; text-overflow: ellipsis;",
					},
					left,
				);
			},
		},
		{
			accessorKey: "word",
			header: () => h("div", { class: "text-right" }, t("Corpsum.word")),
			cell: ({ row }: RowObj) => {
				const word = row.getValue("word");
				return h("div", { class: "text-right font-medium" }, word);
			},
		},
		{
			accessorKey: "right",
			header: () => h("div", { class: "text-left" }, t("Corpsum.right")),
			cell: ({ row }: RowObj) => {
				return h(
					"div",
					{
						class: "text-left font-medium overflow-hidden text-ellipsis",
						style: "max-width: 24rem; text-overflow: ellipsis;",
					},
					row.getValue("right"),
				);
			},
		},
	];

	additionalRefHeaders
		.filter((header) => !fixedKWICStructures.includes(header))
		.forEach((header, i) => {
			const idx = i + fixedKWICStructures.length;
			columns.push({
				accessorKey: "refs",
				header: () => h("div", { class: "text-right" }, t(header)),
				cell: ({ row }: RowObj) => {
					const value = row.getValue("refs")[idx];
					return h("div", { class: "text-right font-medium" }, value);
				},
			});
		});

	columns.push({
		accessorKey: "link",
		header: () => h("div", { class: "text-right" }, t("Corpsum.link")),
		cell: ({ row }: RowObj) => {
			return h(
				"button",
				{
					class: "inline-flex items-center text-sm text-primary hover:underline",
					onClick: () => {
						open(row.original);
					},
				},
				[h(ExternalLink, { class: "mr-1 size-4" }), t("Corpsum.open")],
			);
		},
	});

	return columns;
};
