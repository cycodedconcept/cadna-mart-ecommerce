import type {
  CustomerProfile,
  LoginInput,
  RegistrationInput,
  ResetInput,
} from "./types";

export type FormErrors = Partial<Record<keyof RegistrationInput, string>>;
export function validateEmail(email: string): string | undefined {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ? undefined
    : "Enter a valid email address.";
}
export function passwordRules(password: string, fullName = "", email = "") {
  const lower = password.toLowerCase();
  const personal = [
    ...fullName.toLowerCase().trim().split(/\s+/),
    email.toLowerCase().split("@")[0],
  ].filter((value) => value.length >= 3);
  return [
    {
      label: "At least 8 characters (maximum 128)",
      valid: password.length >= 8 && password.length <= 128,
    },
    {
      label: "Include a letter, a number and a symbol",
      valid:
        /[a-z]/i.test(password) &&
        /\d/.test(password) &&
        /[^\w\s]/.test(password),
    },
    { label: "No spaces", valid: !/\s/.test(password) },
    {
      label: "Do not include your name or email username",
      valid: personal.every((value) => !lower.includes(value)),
    },
  ];
}
export function validateProfile(profile: CustomerProfile): FormErrors {
  const errors: FormErrors = {};
  if (
    profile.fullName.trim().length < 2 ||
    profile.fullName.trim().length > 100
  )
    errors.fullName = "Enter your full name (2–100 characters).";
  const emailError = validateEmail(profile.email);
  if (emailError) errors.email = emailError;
  if (
    !/^\+?[\d\s()-]+$/.test(profile.phone.trim()) ||
    !/^\d{7,15}$/.test(profile.phone.replace(/\D/g, ""))
  )
    errors.phone = "Enter a phone number with 7–15 digits.";
  return errors;
}
export function validateLogin(input: LoginInput): FormErrors {
  const errors: FormErrors = {};
  const emailError = validateEmail(input.email);
  if (emailError) errors.email = emailError;
  if (!input.password.trim()) errors.password = "Enter your password.";
  return errors;
}
export function validateReset(
  input: ResetInput,
  fullName = "",
  email = "",
): FormErrors {
  const errors: FormErrors = {};
  if (
    passwordRules(input.password, fullName, email).some((rule) => !rule.valid)
  )
    errors.password = "Meet all password requirements below.";
  if (!input.confirmPassword) errors.confirmPassword = "Confirm your password.";
  else if (input.password !== input.confirmPassword)
    errors.confirmPassword = "Passwords must match.";
  return errors;
}
export function validateRegistration(input: RegistrationInput): FormErrors {
  return {
    ...validateProfile(input),
    ...validateReset(input, input.fullName, input.email),
  };
}
export const cleanProfile = (profile: CustomerProfile): CustomerProfile => ({
  fullName: profile.fullName.trim(),
  email: profile.email.trim().toLowerCase(),
  phone: profile.phone.trim(),
});
