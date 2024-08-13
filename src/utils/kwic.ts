import type { ColumnDef } from "@tanstack/vue-table";
import type { KeywordInContext } from '@types/query';


export const getKWICColumns = (open: (keyword: KeywordInContext) => void): Array<ColumnDef<KeywordInContext>> => [
	{
		accessorKey: "docid",
		header: () => h("div", { class: "text-right" }, "DocID"),
		cell: ({ row }) => {
			const docid = row.getValue("docid");
			return h("div", { class: "text-right font-medium" }, docid as string);
		},
	},
	{
		accessorKey: "source",
		header: () => h("div", { class: "text-right" }, "Source"),
		cell: ({ row }) => {
			const source = row.getValue("source");
			return h("div", { class: "text-right font-medium" }, source as string);
		},
	},
	{
		accessorKey: "region",
		header: () => h("div", { class: "text-right" }, "Region"),
		cell: ({ row }) => {
			const region = row.getValue("region");
			return h("div", { class: "text-right font-medium" }, region as string);
		},
	},
	{
		accessorKey: "left",
		header: () => h("div", { class: "text-right" }, "Left"),
		cell: ({ row }) => {
			const left = row.getValue("left");
			return h("div", { class: "text-right font-medium" }, left as string);
		},
	},
	{
		accessorKey: "word",
		header: () => h("div", { class: "text-right" }, "Word"),
		cell: ({ row }) => {
			const word = row.getValue("word");
			return h("div", { class: "text-right font-medium" }, word as string);
		},
	},
	{
		accessorKey: "right",
		header: () => h("div", { class: "text-left" }, "Right"),
		cell: ({ row }) => {
			const right = row.getValue("right");
			return h("div", { class: "text-right font-medium" }, right as string);
		},
	},
	{
		accessorKey: "link",
		header: () => h("div", { class: "text-right" }, "Link"),
		cell: ({ row }) => {
			// const link = row.getValue("link");
			// <  size = "" class="me-2" icon = "mdi-open-in-new" @click="open(item)" />
			return h(
				"VIcon",
				{
					onClick: () => open(row.original),
					size: "small",
					icon: "mdi-open-in-new",
					class: "me-2 cursor-pointer font-medium",
				},
				`open`,
			);
		},
	},
];
