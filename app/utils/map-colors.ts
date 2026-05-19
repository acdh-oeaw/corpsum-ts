export const MAP_USED_REGIONS = ["amitte", "aost", "asuedost", "awest"];

export function hexToRgb(hex: string): [number, number, number] {
	const clean = hex.startsWith("#") ? hex : "#eeeeee";
	const full =
		clean.length === 4
			? `#${clean[1]}${clean[1]}${clean[2]}${clean[2]}${clean[3]}${clean[3]}`
			: clean;
	return [
		parseInt(full.slice(1, 3), 16),
		parseInt(full.slice(3, 5), 16),
		parseInt(full.slice(5, 7), 16),
	];
}

export function logInterpolate(
	value: number,
	maxVal: number,
	minColor: [number, number, number],
	maxColor: [number, number, number],
): [number, number, number, number] {
	if (value <= 0) return [minColor[0], minColor[1], minColor[2], 255];
	const t = Math.log(value + 1) / Math.log(maxVal + 1);
	return [
		Math.round(minColor[0] + t * (maxColor[0] - minColor[0])),
		Math.round(minColor[1] + t * (maxColor[1] - minColor[1])),
		Math.round(minColor[2] + t * (maxColor[2] - minColor[2])),
		255,
	];
}
