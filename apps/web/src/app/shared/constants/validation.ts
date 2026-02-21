export const VALIDATION_RULES = {
  password: {
    minLength: 8,
  },
} as const;

export const VALIDATION_MESSAGES = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  minLength: (length: number) => `Must be at least ${length} characters`,
} as const;
