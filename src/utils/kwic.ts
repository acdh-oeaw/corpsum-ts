import type { ColumnDef } from "@tanstack/vue-table";
import { VIcon } from "vuetify/components";

// this is not totally correct. It should be a type from the shadcn
interface rowObj {
	row: { getValue: (s: string) => string; original: KeywordInContext };
}

export const getKWICColumns = (
	t: (s: string) => string,
	open: (keyword: KeywordInContext) => void,
	additionalRefHeaders: Array<string>,
	fixedKWICStructures: Array<string>,
): Array<ColumnDef<KeywordInContext>> => {
	const arr = [
		{
			accessorKey: "source",
			header: () => h("div", { class: "text-right" }, t("Corpsum.source")),
			cell: ({ row }: rowObj) => {
				const source = row.getValue("source");
				return h("div", { class: "text-right font-medium" }, source);
			},
		},
		{
			accessorKey: "region",
			header: () => h("div", { class: "text-right" }, t("Corpsum.region")),
			cell: ({ row }: rowObj) => {
				const region = row.getValue("region");
				return h("div", { class: "text-right font-medium" }, region);
			},
		},
		{
			accessorKey: "left",
			header: () => h("div", { class: "text-right" }, t("Corpsum.left")),
			cell: ({ row }: rowObj) => {
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
			cell: ({ row }: rowObj) => {
				const word = row.getValue("word");
				return h("div", { class: "text-right font-medium" }, word);
			},
		},
		{
			accessorKey: "right",
			header: () => h("div", { class: "text-left" }, t("Corpsum.right")),
			cell: ({ row }: rowObj) => {
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
			arr.push({
				accessorKey: "refs",
				header: () => h("div", { class: "text-right" }, t(header)),
				cell: ({ row }: rowObj) => {
					const value = row.getValue("refs")[idx];
					return h("div", { class: "text-right font-medium" }, value);
				},
			});
		});

	// add link as lasht column
	arr.push({
		accessorKey: "link",
		header: () => h("div", { class: "text-right" }, t("Corpsum.link")),
		cell: ({ row }: rowObj) => {
			// const link = row.getValue("link");
			// <  size = "" class="me-2" icon = "mdi-open-in-new" @click="open(item)" />
			return h(
				VIcon,
				{
					onClick: () => {
						open(row.original);
					},
					size: "small",
					icon: "mdi-open-in-new",
					class: "me-2 cursor-pointer font-medium",
				},
				// "open",
			);
		},
	});

	return arr;
};
