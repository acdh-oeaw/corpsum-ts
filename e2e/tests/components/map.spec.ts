import { expect, test } from "@playwright/experimental-ct-vue";

import Map from "@/components/map.vue";

const colors: Record<string, [number, number, number, number]> = {
	"at-ost": [239, 68, 68, 255],
	"at-west": [59, 130, 246, 255],
};

const regionData = {
	"at-ost": {
		payload: [["Articles", 12]] as Array<[string, number]>,
		config: { Articles: { label: "Articles", color: "#ef4444" } },
		x: "Vienna",
	},
	"at-west": {
		payload: [["Articles", 7]] as Array<[string, number]>,
		config: { Articles: { label: "Articles", color: "#ef4444" } },
		x: "Styria",
	},
};

test.describe("map", () => {
	test("renders a canvas and menu trigger", async ({ mount }) => {
		const component = await mount(Map, {
			props: {
				colors,
				regionData,
				height: 400,
			},
		});

		await expect(component.getByRole("img", { name: "Map" })).toBeVisible();
		await expect(component.getByRole("button")).toBeVisible();
	});

	test("shows export options in dropdown menu", async ({ mount }) => {
		const component = await mount(Map, {
			props: {
				colors,
				regionData,
				height: 400,
			},
		});

		await component.getByRole("button").click();

		await expect(component.getByRole("menuitem", { name: "Open fullscreen" })).toBeVisible();
		await expect(component.getByRole("menuitem", { name: "Export CSV" })).toBeVisible();
		await expect(component.getByRole("menuitem", { name: "Export XLSX" })).toBeVisible();
		await expect(component.getByRole("menuitem", { name: "Export PNG" })).toBeVisible();
		await expect(component.getByRole("menuitem", { name: "Export JPG" })).toBeVisible();
	});

	test("renders with minimal props", async ({ mount }) => {
		const component = await mount(Map, {
			props: {
				colors: {},
			},
		});

		await expect(component.getByRole("img", { name: "Map" })).toBeVisible();
		await expect(component.getByRole("button")).toBeVisible();
	});
});
