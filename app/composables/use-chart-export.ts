import type { Ref } from "vue";

type DataPoint = [string | number, number] | undefined;

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

export function useChartExport(
	containerRef: Ref<HTMLElement | null>,
	chartData: Ref<Array<Array<DataPoint>> | undefined>,
	seriesLabels: Ref<Array<string>>,
	title: Ref<string | undefined>,
	xAxisLabel: Ref<string | undefined>,
) {
	function exportCsv() {
		if (!chartData.value) return;
		const headers = [xAxisLabel.value ?? "x", ...seriesLabels.value];
		const rows = chartData.value.map((row) => {
			const xVal = row[0]?.[0] ?? "";
			const yVals = row.map((cell) => cell?.[1] ?? "");
			return [xVal, ...yVals].join(",");
		});
		const csv = [headers.join(","), ...rows].join("\n");
		const blob = new Blob([csv], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${title.value ?? "chart"}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function exportSvg() {
		const svg = containerRef.value?.querySelector<SVGSVGElement>("svg:not(.lucide)");
		if (!svg) return;

		const clone = svg.cloneNode(true) as SVGSVGElement;
		inlineSvgStyles(svg, clone);

		const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
		bg.setAttribute("width", clone.getAttribute("width") ?? "100%");
		bg.setAttribute("height", clone.getAttribute("height") ?? "100%");
		bg.setAttribute("fill", getEffectiveBackground(containerRef));
		clone.insertBefore(bg, clone.firstChild);

		const serializer = new XMLSerializer();
		const svgStr = serializer.serializeToString(clone);
		const blob = new Blob([svgStr], { type: "image/svg+xml" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${title.value ?? "chart"}.svg`;
		a.click();
		URL.revokeObjectURL(url);
	}

	return { exportCsv, exportSvg };
}
