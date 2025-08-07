import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function validateRequiredFields(fields: Record<string, any>) {
  const missingFields = Object.entries(fields)
    .filter(
      ([_, value]) => value === undefined || value === null || value === '',
    )
    .map(([key]) => key);

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
}
