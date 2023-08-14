import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type AccountState = {
  publicKey: string;
  status: 'uninitialized' | 'loading' | 'idle';
  error: string | undefined;
};

const initialState: AccountState = { publicKey: '', status: 'uninitialized', error: undefined };

const accountsSlice = createSlice({
  name: 'accounts',
  initialState,
  reducers: {
    setPublicKey: (state, action: PayloadAction<string>) => {
      state.publicKey = action.payload;
    },
  },
  extraReducers: {},
});

export const { setPublicKey } = accountsSlice.actions;

export const selectPublicKey = (state: { accounts: AccountState }) => state.accounts.publicKey;

export const selectIsLoading = (state: { accounts: AccountState }) => state.accounts.status === 'loading';

export default accountsSlice.reducer;
