import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format as dateFnsFormat, parseISO as dateFnsParseISO, isValid } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeParseISO(dateString?: string | null) {
  if (!dateString) return new Date(NaN);
  const parsed = dateFnsParseISO(dateString);
  return isValid(parsed) ? parsed : new Date(NaN);
}

export function safeFormat(date: Date | string | null | undefined, fmt: string, fallback = "Invalid Date") {
  if (!date) return fallback;
  try {
    const d = typeof date === "string" ? safeParseISO(date) : date;
    if (!isValid(d)) return fallback;
    return dateFnsFormat(d, fmt);
  } catch(e) {
    return fallback;
  }
}
