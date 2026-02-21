export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  avatarUrl: string | null;
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}
