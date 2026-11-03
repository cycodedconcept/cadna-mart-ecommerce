import type { CustomerProfile } from "../auth/types";
import { cleanProfile, validateProfile } from "../auth/validation";
import type { StorageAccess } from "../cart/persistence";
import {
  accountSlice,
  emptyAccount,
  type AccountState,
  type SavedAddress,
} from "./slice";

const key = (id: string) => `cadna-account-v1:${id}`;
export function restoreAccount(
  id: string,
  storage?: StorageAccess,
): { account: AccountState; profile?: CustomerProfile } {
  const account = emptyAccount();
  try {
    const data = JSON.parse(storage?.getItem(key(id)) ?? "null");
    if (data?.version !== 1) return { account };
    let result = account;
    if (Array.isArray(data.addresses))
      for (const item of data.addresses) {
        if (
          item &&
          ["id", "label", "address", "city", "state"].every(
            (field) => typeof item[field] === "string",
          )
        )
          result = accountSlice.reducer(
            result,
            accountSlice.actions.saveAddress(item as SavedAddress),
          );
      }
    if (typeof data.defaultId === "string")
      result = accountSlice.reducer(
        result,
        accountSlice.actions.setDefaultAddress(data.defaultId),
      );
    if (
      typeof data.preferences?.orderUpdates === "boolean" &&
      typeof data.preferences?.promotions === "boolean"
    )
      result = accountSlice.reducer(
        result,
        accountSlice.actions.savePreferences(data.preferences),
      );
    const p = data.profile;
    const profile =
      p &&
      ["fullName", "email", "phone"].every(
        (field) => typeof p[field] === "string",
      ) &&
      !Object.keys(validateProfile(p)).length
        ? cleanProfile(p)
        : undefined;
    return { account: result, profile };
  } catch {
    return { account };
  }
}
export function persistAccount(
  id: string,
  account: AccountState,
  profile: CustomerProfile,
  storage?: StorageAccess,
): boolean {
  try {
    if (!storage) return false;
    storage.setItem(
      key(id),
      JSON.stringify({
        version: 1,
        profile: cleanProfile(profile),
        addresses: account.addresses.map(
          ({ id, label, address, city, state }) => ({
            id,
            label,
            address,
            city,
            state,
          }),
        ),
        defaultId: account.defaultId,
        preferences: {
          orderUpdates: account.preferences.orderUpdates,
          promotions: account.preferences.promotions,
        },
      }),
    );
    return true;
  } catch {
    return false;
  }
}
