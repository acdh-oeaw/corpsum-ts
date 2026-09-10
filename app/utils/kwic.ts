import type { ColumnDef } from "@tanstack/vue-table";
import { ExternalLink } from "lucide-vue-next";

interface RowObj {
	row: { getValue: (s: string) => string; original: KeywordInContext };
}

export const getKWICColumns = (
	t: (s: string) => string,
	open: (keyword: KeywordInContext) => void,
	refHeaders: Array<string>,
	allowDetails = true,
): Array<ColumnDef<KeywordInContext>> => {
	const referenceLabels: Record<string, string> = {
		"doc.id": t("KwicReferences.documentId"),
		"doc.datum": t("KwicReferences.date"),
		"doc.year": t("KwicReferences.year"),
		"doc.region": t("Corpsum.region"),
		"doc.docsrc": t("Corpsum.source"),
	};
	const columns: Array<ColumnDef<KeywordInContext>> = refHeaders.map((header) => ({
		id: `ref:${header}`,
		accessorFn: (row) => row.refValues[header] ?? "",
		header: () => h("div", { class: "text-right" }, referenceLabels[header] ?? header),
		cell: ({ row }) =>
			h("div", { class: "text-right font-medium" }, row.original.refValues[header] ?? ""),
	}));

	columns.push(
		{
			accessorKey: "left",
			header: () => h("div", { class: "text-right ml-auto" }, t("Corpsum.left")),
			cell: ({ row }: RowObj) => {
				const left = row.getValue("left");
				return h(
					"div",
					{
						class: "text-right font-medium overflow-hidden text-ellipsis ml-auto",
						style: "max-width: 24rem; text-overflow: ellipsis;",
					},
					left,
				);
			},
		},
		{
			accessorKey: "word",
			header: () => h("div", { class: "text-center" }, t("Corpsum.word")),
			cell: ({ row }: RowObj) => {
				const word = row.getValue("word");
				return h("div", { class: "text-center font-medium" }, word);
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
	);

	if (allowDetails)
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
