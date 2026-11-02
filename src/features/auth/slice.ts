import {
  createSlice,
  type PayloadAction,
  type ThunkAction,
  type UnknownAction,
} from "@reduxjs/toolkit";
import type {
  AuthAdapter,
  AuthOperation,
  AuthState,
  CustomerProfile,
  LoginInput,
  RegistrationInput,
  ResetInput,
} from "./types";
import {
  cleanProfile,
  validateEmail,
  validateLogin,
  validateProfile,
  validateRegistration,
  validateReset,
} from "./validation";
import { demoCustomerId } from "./identity";

const initialState: AuthState = {
  customerId: null,
  profile: null,
  status: "idle",
  operation: null,
  requestId: null,
  error: null,
};
export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    restoreProfile(state, { payload }: PayloadAction<CustomerProfile>) {
      if (state.profile) state.profile = cleanProfile(payload);
    },
    started(
      state,
      {
        payload,
      }: PayloadAction<{ operation: AuthOperation; requestId: string }>,
    ) {
      state.status = "loading";
      state.error = null;
      Object.assign(state, payload);
    },
    succeeded(
      state,
      {
        payload,
      }: PayloadAction<{
        requestId: string;
        profile?: CustomerProfile;
        customerId?: string;
      }>,
    ) {
      if (state.requestId !== payload.requestId) return;
      state.status = "success";
      state.requestId = null;
      if (payload.profile) state.profile = cleanProfile(payload.profile);
      if (payload.customerId) state.customerId = payload.customerId;
    },
    failed(state, { payload }: PayloadAction<{ requestId: string }>) {
      if (state.requestId !== payload.requestId) return;
      state.status = "error";
      state.requestId = null;
      // Never serialize adapter errors: a future adapter could include credentials in one.
      state.error =
        "The demo request could not be completed. Please try again.";
    },
    logout: () => initialState,
  },
});
export const { logout } = authSlice.actions;
export const selectCustomer = (state: { auth?: AuthState }) =>
  state.auth?.profile ?? null;
export const selectIsAuthenticated = (state: { auth?: AuthState }) =>
  !!selectCustomer(state);
export const selectCustomerId = (state: { auth?: AuthState }) =>
  state.auth?.profile ? state.auth.customerId : null;
type Result = "success" | "error" | "busy" | "cancelled";
type AuthThunk = ThunkAction<
  Promise<Result>,
  { auth: AuthState },
  { auth: AuthAdapter },
  UnknownAction
>;

// Credential-bearing input stays in a thunk closure. Unlike createAsyncThunk arguments,
// it never appears in Redux action payloads/meta or DevTools history.
function run(
  operation: AuthOperation,
  valid: boolean,
  request: (adapter: AuthAdapter) => Promise<CustomerProfile | void>,
): AuthThunk {
  return async (dispatch, getState, extra) => {
    if (getState().auth.status === "loading") return "busy";
    if (operation === "profile" && !getState().auth.profile) return "error";
    const requestId = crypto.randomUUID();
    dispatch(authSlice.actions.started({ operation, requestId }));
    try {
      if (!valid) throw new Error("Invalid form");
      const profile = await request(extra.auth);
      const customerId =
        operation === "login" && profile
          ? await demoCustomerId(profile.email)
          : undefined;
      if (getState().auth.requestId !== requestId) return "cancelled";
      dispatch(
        authSlice.actions.succeeded({
          requestId,
          ...(profile ? { profile: cleanProfile(profile) } : {}),
          ...(customerId ? { customerId } : {}),
        }),
      );
      return "success";
    } catch {
      if (getState().auth.requestId !== requestId) return "cancelled";
      dispatch(authSlice.actions.failed({ requestId }));
      return "error";
    }
  };
}
export const loginDemo = (input: LoginInput) =>
  run("login", !Object.keys(validateLogin(input)).length, (adapter) =>
    adapter.login(input),
  );
export const registerDemo = (input: RegistrationInput) =>
  run("register", !Object.keys(validateRegistration(input)).length, (adapter) =>
    adapter.register(input),
  );
export const forgotPasswordDemo = (email: string) =>
  run("forgot", !validateEmail(email), (adapter) =>
    adapter.forgotPassword(email),
  );
export const resetPasswordDemo = (input: ResetInput) =>
  run("reset", !Object.keys(validateReset(input)).length, (adapter) =>
    adapter.resetPassword(input),
  );
export const updateDemoProfile = (profile: CustomerProfile) =>
  run("profile", !Object.keys(validateProfile(profile)).length, (adapter) =>
    adapter.updateProfile(cleanProfile(profile)),
  );
