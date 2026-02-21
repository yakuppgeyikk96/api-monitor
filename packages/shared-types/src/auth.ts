export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  avatarUrl: string | null;
}

export interface AuthResult {
  token: string;
  user: AuthUser;
}
