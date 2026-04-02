export interface AuthActionState {
  success: boolean;
  message: string;
  error?: string;
}

export type RegisterResult = AuthActionState;

export type LoginActionState = AuthActionState;
