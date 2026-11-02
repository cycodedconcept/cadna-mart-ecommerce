export interface CustomerProfile {
  fullName: string;
  email: string;
  phone: string;
}
export interface LoginInput {
  email: string;
  password: string;
}
export interface RegistrationInput extends CustomerProfile {
  password: string;
  confirmPassword: string;
}
export interface ResetInput {
  password: string;
  confirmPassword: string;
}
export type AuthOperation =
  | "login"
  | "register"
  | "forgot"
  | "reset"
  | "profile";
export interface AuthState {
  customerId: string | null;
  profile: CustomerProfile | null;
  status: "idle" | "loading" | "success" | "error";
  operation: AuthOperation | null;
  requestId: string | null;
  error: string | null;
}
export interface AuthAdapter {
  login(input: LoginInput): Promise<CustomerProfile>;
  register(input: RegistrationInput): Promise<void>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(input: ResetInput): Promise<void>;
  updateProfile(profile: CustomerProfile): Promise<CustomerProfile>;
}
