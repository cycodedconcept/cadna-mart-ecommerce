import { useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import AccountLayout from "../components/account/AccountLayout";
import AddressForm from "../components/account/AddressForm";
import {
  saveAddress,
  deleteAddress,
  setDefaultAddress,
  emptyAccount,
  type SavedAddress,
} from "../features/account/slice";

export default function AddressesPage() {
  const dispatch = useAppDispatch();
  const account = useAppSelector((state) => state.account ?? emptyAccount());
  const [editing, setEditing] = useState<SavedAddress | null>(null);
  const [message, setMessage] = useState("");
  const addButton = useRef<HTMLButtonElement>(null);
  const close = () => {
    setEditing(null);
    addButton.current?.focus();
  };
  return (
    <AccountLayout title="Saved addresses" section="addresses">
      <p>
        One address is used as your default. Deleting it makes the first
        remaining address the default.
      </p>
      <button
        ref={addButton}
        className="primary-button"
        onClick={() =>
          setEditing({ id: "", label: "", address: "", city: "", state: "" })
        }
      >
        Add new address
      </button>
      <p role="status">{message}</p>
      {editing && (
        <AddressForm
          key={editing.id}
          initial={editing}
          onCancel={close}
          onSave={(value) => {
            dispatch(
              saveAddress({ ...value, id: value.id || crypto.randomUUID() }),
            );
            setMessage("Address saved.");
            close();
          }}
        />
      )}
      {!account.addresses.length ? (
        <section className="empty-state">
          <h2>No saved addresses</h2>
          <p>Add a delivery address to use at checkout.</p>
        </section>
      ) : (
        <div className="address-grid">
          {account.addresses.map((item) => (
            <article className="profile-panel address-card" key={item.id}>
              <h2>{item.label}</h2>
              <p>
                {item.address}
                <br />
                {item.city}, {item.state}
              </p>
              {account.defaultId === item.id && (
                <strong>Default address</strong>
              )}
              <div className="account-actions">
                <button
                  aria-label={`Edit ${item.label}`}
                  onClick={() => setEditing(item)}
                >
                  Edit
                </button>
                <button
                  aria-label={`Delete ${item.label}`}
                  onClick={() => {
                    if (
                      window.confirm(
                        `Delete ${item.label}? This cannot be undone.`,
                      )
                    ) {
                      dispatch(deleteAddress(item.id));
                      if (editing?.id === item.id) close();
                      setMessage(
                        "Address deleted. The first remaining address becomes the default if needed.",
                      );
                      addButton.current?.focus();
                    }
                  }}
                >
                  Delete
                </button>
                {account.defaultId !== item.id && (
                  <button
                    onClick={() => {
                      dispatch(setDefaultAddress(item.id));
                      setMessage(`${item.label} is now the default address.`);
                      addButton.current?.focus();
                    }}
                  >
                    Make default
                    <span className="visually-hidden">: {item.label}</span>
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </AccountLayout>
  );
}
