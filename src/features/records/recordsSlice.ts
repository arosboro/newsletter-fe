import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NewsletterProgramId } from '@/aleo/newsletter-program';
import { MessageSignerWalletAdapterProps } from '@demox-labs/aleo-wallet-adapter-base';

export interface Record {
  id: string;
  owner: string;
  program_id: string;
  spent: boolean;
  data: { [key: string]: string };
}

export type RecordState = {
  list: { [key: string]: Record };
  status: 'uninitialized' | 'loading' | 'idle';
  error: string | undefined;
};

const initialState: RecordState = { list: {}, status: 'uninitialized', error: undefined };

export const fetchRecords = createAsyncThunk(
  'records/fetchRecords',
  async ({
    connected,
    requestRecords,
  }: {
    connected: boolean;
    requestRecords: MessageSignerWalletAdapterProps['requestRecords'] | undefined;
  }) => {
    if (!connected || !requestRecords) {
      return [] as Record[];
    }
    const records = await requestRecords(NewsletterProgramId);
    return records as Record[];
  },
);

const recordsSlice = createSlice({
  name: 'records',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecords.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchRecords.fulfilled, (state, action: PayloadAction<Record[]>) => {
        const newRecords: { [key: string]: Record } = {};
        action.payload.forEach((record: Record) => {
          newRecords[record.id] = record;
        });
        state.list = newRecords;
        state.status = 'idle';
      })
      .addCase(fetchRecords.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.error.message;
      });
  },
});

export default recordsSlice.reducer;
