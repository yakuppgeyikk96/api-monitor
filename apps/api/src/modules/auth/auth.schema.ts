import { Type, type Static } from "@sinclair/typebox";

export const RegisterBodySchema = Type.Object({
  email: Type.String({ format: "email", maxLength: 255 }),
  password: Type.String({ minLength: 8, maxLength: 128 }),
  fullName: Type.String({ minLength: 1, maxLength: 100 }),
});

export type RegisterBody = Static<typeof RegisterBodySchema>;

export const LoginBodySchema = Type.Object({
  email: Type.String({ format: "email", maxLength: 255 }),
  password: Type.String({ minLength: 1, maxLength: 128 }),
});

export type LoginBody = Static<typeof LoginBodySchema>;
