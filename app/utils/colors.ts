//fallback for legacy visualizations without a set color
export const colors = [
	"#3498db",
	"#e74c3c",
	"#2ecc71",
	"#f39c12",
	"#9b59b6",
	"#33bbcc",
	"#1abc9c",
	"#e6ce00",
	"#34495e",
];

//we need this for the media-types, so they're not hardcoded to the template
export const categoryColors = [
	"#1f77b4",
	"#aec7e8",
	"#ff7f0e",
	"#ffbb78",
	"#2ca02c",
	"#98df8a",
	"#d62728",
	"#ff9896",
	"#9467bd",
	"#c5b0d5",
	"#8c564b",
	"#c49c94",
	"#e377c2",
	"#f7b6d2",
	"#7f7f7f",
	"#c7c7c7",
	"#bcbd22",
	"#dbca3f",
	"#17becf",
	"#9edae5",
];

export function assignQueryColors(
	ids: string[],
	existing: Record<string, string> = {},
): Record<string, string> {
	const result: Record<string, string> = {};
	const used = new Set<string>();
	for (const id of ids) {
		const color = existing[id]?.toLowerCase();
		if (color && /^#[0-9a-f]{6}$/.test(color) && !used.has(color)) {
			result[id] = color;
			used.add(color);
		}
	}
	for (const id of ids) {
		if (result[id]) continue;
		let color = colors.find((candidate) => !used.has(candidate.toLowerCase()));
		if (!color) {
			let n = 0;
			do {
				color = `#${(n++).toString(16).padStart(6, "0")}`;
			} while (used.has(color));
		}
		result[id] = color;
		used.add(color.toLowerCase());
	}
	return result;
}
