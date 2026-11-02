import type { AuthAdapter } from "./types";
import { cleanProfile } from "./validation";

const wait = () => new Promise<void>((resolve) => setTimeout(resolve, 450));
// A documented demonstration failure, not a stored customer or credential lookup.
const rejectDemoEmail = (email: string) => {
  if (email.trim().toLowerCase() === "fail@example.com")
    throw new Error("Demo request failed. Try a different email address.");
};
export const mockAuthAdapter: AuthAdapter = {
  async login({ email }) {
    await wait();
    rejectDemoEmail(email);
    return {
      fullName: "Demo Customer",
      email: email.trim().toLowerCase(),
      phone: "",
    };
  },
  async register({ email }) {
    await wait();
    rejectDemoEmail(email);
  },
  async forgotPassword() {
    await wait();
  },
  async resetPassword() {
    await wait();
  },
  async updateProfile(profile) {
    await wait();
    rejectDemoEmail(profile.email);
    return cleanProfile(profile);
  },
};
