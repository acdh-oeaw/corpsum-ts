import type { Updater } from "@tanstack/vue-table";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Ref } from "vue";

export function cn(...inputs: Array<ClassValue>) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line
export function valueUpdater<T extends Updater<any>>(updaterOrValue: T, ref: Ref) {
	// eslint-disable-next-line
	ref.value = typeof updaterOrValue === "function" ? updaterOrValue(ref.value) : updaterOrValue;
}
