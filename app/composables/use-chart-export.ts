import type { Ref } from "vue";

type DataPoint = [string | number, number] | undefined;

interface TableData {
	headers: Array<string>;
	rows: Array<Array<string | number>>;
}

const SVG_INLINE_PROPS = [
	"fill",
	"stroke",
	"stroke-width",
	"stroke-dasharray",
	"stroke-linecap",
	"stroke-linejoin",
	"stroke-opacity",
	"fill-opacity",
	"opacity",
	"font-family",
	"font-size",
	"font-weight",
	"font-style",
	"text-anchor",
	"dominant-baseline",
	"color",
];

function inlineSvgStyles(original: Element, clone: Element) {
	const computed = getComputedStyle(original);
	SVG_INLINE_PROPS.forEach((prop) => {
		const val = computed.getPropertyValue(prop);
		if (val) (clone as SVGElement).style.setProperty(prop, val);
	});
	Array.from(original.children).forEach((child, i) => {
		inlineSvgStyles(child, clone.children[i]!);
	});
}

function getEffectiveBackground(containerRef: Ref<HTMLElement | null>): string {
	let el: Element | null = containerRef.value;
	while (el) {
		const bg = getComputedStyle(el).backgroundColor;
		if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") return bg;
		el = el.parentElement;
	}
	return "white";
}

function triggerDownload(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

function buildExportClone(
	containerRef: Ref<HTMLElement | null>,
): { clone: SVGSVGElement; width: number; height: number } | null {
	const svg = containerRef.value?.querySelector<SVGSVGElement>("svg:not(.lucide)");
	if (!svg) return null;

	const { width, height } = svg.getBoundingClientRect();

	const clone = svg.cloneNode(true) as SVGSVGElement;
	inlineSvgStyles(svg, clone);

	clone.setAttribute("width", String(width));
	clone.setAttribute("height", String(height));

	return { clone, width, height };
}

export function useChartExport(
	containerRef: Ref<HTMLElement | null>,
	chartData: Ref<Array<Array<DataPoint>> | TableData | undefined>,

	title: Ref<string | undefined>,
	seriesLabels?: Ref<Array<string>>,
	xAxisLabel?: Ref<string | undefined>,
) {
	function buildExportTableData(): TableData | null {
		if (!chartData.value) return null;

		if ("headers" in chartData.value) return chartData.value;

		const headers = [xAxisLabel?.value ?? "Categories", ...(seriesLabels?.value ?? [])];
		const rows = chartData.value.map((row) => {
			const xVal = row[0]?.[0] ?? "";
			const yVals = row.map((cell) => cell?.[1] ?? "");
			return [xVal, ...yVals];
		});

		return { headers, rows };
	}

	function exportCsv() {
		const tableData = buildExportTableData();
		if (!tableData) return;

		const rows = tableData.rows.map((row) => row.join(","));
		const csv = [tableData.headers.join(","), ...rows].join("\n");
		triggerDownload(new Blob([csv], { type: "text/csv" }), `${title.value ?? "chart"}.csv`);
	}

	async function exportXlsx() {
		const tableData = buildExportTableData();
		if (!tableData) return;

		const response = await fetch("/api/export-table-xlsx", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				fileName: title.value ?? "chart",
				sheetName: title.value ?? "Chart",
				headers: tableData.headers,
				rows: tableData.rows,
			}),
		});

		if (!response.ok) {
			throw new Error(`XLSX export failed with status ${String(response.status)}`);
		}

		const blob = new Blob([await response.arrayBuffer()], {
			type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		});
		triggerDownload(blob, `${title.value ?? "chart"}.xlsx`);
	}

	function exportSvg() {
		const prepared = buildExportClone(containerRef);
		if (!prepared) return;

		const svgStr = new XMLSerializer().serializeToString(prepared.clone);
		triggerDownload(new Blob([svgStr], { type: "image/svg+xml" }), `${title.value ?? "chart"}.svg`);
	}

	async function exportRaster(format: "png" | "jpeg") {
		const prepared = buildExportClone(containerRef);
		if (!prepared) return;

		const { clone, width, height } = prepared;
		const svgStr = new XMLSerializer().serializeToString(clone);
		const svgUrl = URL.createObjectURL(new Blob([svgStr], { type: "image/svg+xml" }));

		const img = new Image();
		await new Promise<void>((resolve, reject) => {
			img.onload = () => {
				resolve();
			};
			img.onerror = reject;
			img.src = svgUrl;
		});
		URL.revokeObjectURL(svgUrl);

		const scale = window.devicePixelRatio || 1;
		const canvas = document.createElement("canvas");
		canvas.width = width * scale;
		canvas.height = height * scale;
		const ctx = canvas.getContext("2d")!;
		ctx.scale(scale, scale);
		if (format === "jpeg") {
			ctx.fillStyle = getEffectiveBackground(containerRef);
			ctx.fillRect(0, 0, width, height);
		}
		ctx.drawImage(img, 0, 0, width, height);

		const ext = format === "png" ? "png" : "jpg";
		canvas.toBlob(
			(blob) => {
				if (blob) triggerDownload(blob, `${title.value ?? "chart"}.${ext}`);
			},
			`image/${format}`,
			// format === "jpeg" ? 0.92 : undefined,
		);
	}

	const exportPng = () => {
		void exportRaster("png");
	};
	const exportJpg = () => {
		void exportRaster("jpeg");
	};

	return { exportCsv, exportXlsx, exportSvg, exportPng, exportJpg };
}
