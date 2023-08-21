import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * The shape of the Account state in the Redux store.
 */
export type AccountState = {
  /** The public key of the user's account. */
  publicKey: string;

  /**
   * Represents the loading state of the account.
   * - `uninitialized`: The state before any operations are performed.
   * - `loading`: When an operation related to the account is ongoing.
   * - `idle`: When no operations are in progress.
   */
  status: 'uninitialized' | 'loading' | 'idle';

  /** An error message that can occur during any operations. */
  error: string | undefined;
};

/** The initial state for the Account feature slice. */
const initialState: AccountState = { publicKey: '', status: 'uninitialized', error: undefined };

/**
 * The accounts slice manages the data and loading states related to user accounts.
 */
const accountsSlice = createSlice({
  /** The name of the slice. */
  name: 'accounts',

  /** The initial state. */
  initialState,

  /** The reducers for this slice. */
  reducers: {
    /**
     * Set the public key of the user's account.
     * @param state - The current state of the slice.
     * @param action - An action containing the new public key.
     */
    setPublicKey: (state, action: PayloadAction<string>) => {
      state.publicKey = action.payload;
    },
  },
  /** Placeholder for potential future asynchronous actions or other special case reducers. */
  extraReducers: {},
});

/** Export the action creator to set a new public key. */
export const { setPublicKey } = accountsSlice.actions;

/**
 * Selector to retrieve the public key from the state.
 * @param state - The root state of the Redux store.
 * @returns The public key of the user.
 */
export const selectPublicKey = (state: { accounts: AccountState }) => state.accounts.publicKey;

/**
 * Selector to determine if the account slice is in a loading state.
 * @param state - The root state of the Redux store.
 * @returns `true` if the account is in loading state, otherwise `false`.
 */
export const selectIsLoading = (state: { accounts: AccountState }) => state.accounts.status === 'loading';

/** Export the reducer to be combined at the store level. */
export default accountsSlice.reducer;
