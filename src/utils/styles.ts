import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Ref } from 'vue'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}
