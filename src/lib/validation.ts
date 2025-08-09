// client safe validation functions

import { ValidationError } from './errors/errors';

// Throws an error if any of the required fields, specified in the fields object, are missing.
export function throwIfMissingFields(fields: Record<string, unknown>) {
  const missingFields = Object.entries(fields)
    .filter(
      ([, value]) => value === undefined || value === null || value === '',
    )
    .map(([key]) => key);

  if (missingFields.length > 0) {
    const errorMessage = `Missing required fields: ${missingFields.join(', ')}`;
    const error = new ValidationError(errorMessage);
    console.error(error.message);
    throw error;
  }
}
