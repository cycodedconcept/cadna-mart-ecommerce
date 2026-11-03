import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { logout } from "../auth/slice";
import { validateCheckout } from "../checkout/slice";

export interface SavedAddress {
  id: string;
  label: string;
  address: string;
  city: string;
  state: string;
}
export interface Preferences {
  orderUpdates: boolean;
  promotions: boolean;
}
export interface AccountState {
  addresses: SavedAddress[];
  defaultId: string | null;
  preferences: Preferences;
}
export const emptyAccount = (): AccountState => ({
  addresses: [],
  defaultId: null,
  preferences: { orderUpdates: true, promotions: false },
});
export function validateAddress(value: SavedAddress) {
  const { address, city, state } = validateCheckout({
    ...value,
    fullName: "Demo Customer",
    email: "demo@example.com",
    phone: "08012345678",
    instructions: "",
  });
  return {
    ...(address || value.address.length > 300
      ? { address: address || "Use at most 300 characters." }
      : {}),
    ...(city || value.city.length > 100
      ? { city: city || "Use at most 100 characters." }
      : {}),
    ...(state || value.state.length > 100
      ? { state: state || "Use at most 100 characters." }
      : {}),
    ...(value.label.trim().length < 2 || value.label.length > 50
      ? { label: "Enter a label (2–50 characters)." }
      : {}),
  };
}
export const accountSlice = createSlice({
  name: "account",
  initialState: emptyAccount(),
  reducers: {
    restored: (_, action: PayloadAction<AccountState>) => action.payload,
    saveAddress(state, { payload }: PayloadAction<SavedAddress>) {
      if (!payload.id || Object.keys(validateAddress(payload)).length) return;
      const clean = {
        id: payload.id,
        label: payload.label.trim(),
        address: payload.address.trim(),
        city: payload.city.trim(),
        state: payload.state.trim(),
      };
      const index = state.addresses.findIndex((item) => item.id === clean.id);
      if (index < 0) state.addresses.push(clean);
      else state.addresses[index] = clean;
      if (!state.defaultId) state.defaultId = clean.id;
    },
    deleteAddress(state, { payload }: PayloadAction<string>) {
      state.addresses = state.addresses.filter((item) => item.id !== payload);
      if (state.defaultId === payload)
        state.defaultId = state.addresses[0]?.id ?? null;
    },
    setDefaultAddress(state, { payload }: PayloadAction<string>) {
      if (state.addresses.some((item) => item.id === payload))
        state.defaultId = payload;
    },
    savePreferences(state, { payload }: PayloadAction<Preferences>) {
      state.preferences = {
        orderUpdates: !!payload.orderUpdates,
        promotions: !!payload.promotions,
      };
    },
  },
  extraReducers: (builder) => builder.addCase(logout, () => emptyAccount()),
});
export const {
  saveAddress,
  deleteAddress,
  setDefaultAddress,
  savePreferences,
} = accountSlice.actions;
