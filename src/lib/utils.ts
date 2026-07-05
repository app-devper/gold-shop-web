import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function apiErrorMessage(error: unknown, fallback: string) {
  const e = error as { response?: { data?: { message?: string } } }
  return e.response?.data?.message || fallback
}
