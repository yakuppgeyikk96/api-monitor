export interface JwtPayload {
  sub: number;
  email: string;
}

export const JWT_CONFIG = {
  expiresIn: process.env.JWT_EXPIRES_IN || "7d",
} as const;
