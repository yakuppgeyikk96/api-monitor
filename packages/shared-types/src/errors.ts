export const ErrorCode = {
  // Auth
  EMAIL_TAKEN: "EMAIL_TAKEN",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  UNAUTHORIZED: "UNAUTHORIZED",

  // Resource
  NOT_FOUND: "NOT_FOUND",
  USER_NOT_FOUND: "USER_NOT_FOUND",

  // Workspace
  WORKSPACE_NOT_FOUND: "WORKSPACE_NOT_FOUND",
  SLUG_TAKEN: "SLUG_TAKEN",
  FORBIDDEN: "FORBIDDEN",

  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export const ErrorMessage: Record<ErrorCode, string> = {
  [ErrorCode.EMAIL_TAKEN]: "Email address is already in use",
  [ErrorCode.INVALID_CREDENTIALS]: "Invalid email or password",
  [ErrorCode.UNAUTHORIZED]: "Authentication required",
  [ErrorCode.NOT_FOUND]: "Resource not found",
  [ErrorCode.USER_NOT_FOUND]: "User not found",
  [ErrorCode.WORKSPACE_NOT_FOUND]: "Workspace not found",
  [ErrorCode.SLUG_TAKEN]: "Workspace slug is already in use",
  [ErrorCode.FORBIDDEN]: "You do not have permission to perform this action",
  [ErrorCode.VALIDATION_ERROR]: "Validation failed",
};
