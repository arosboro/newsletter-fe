import { AnyAction, Dispatch, MiddlewareAPI, configureStore } from '@reduxjs/toolkit';
import accountsReducer from '@/features/accounts/accountsSlice';
import recordsReducer, { fetchRecords } from '@/features/records/recordsSlice';
import newslettersReducer, {
  decryptNewsletterRecords,
  resolveNewsletterRecords,
  setContent,
  setNewsletter,
  setTemplate,
  setTitle,
} from '@/features/newsletters/newslettersSlice';
import subscriptionsReducer, {
  lookupSubscriptionRecords,
  decryptSubscriptionMappings,
} from '@/features/subscriptions/subscriptionsSlice';

const loggerMiddleware = (storeAPI: MiddlewareAPI) => (next: Dispatch<AnyAction>) => (action) => {
  console.log('dispatching', action);
  const result = next(action);
  console.log('next state', storeAPI.getState());
  return result;
};

const newsletterMiddleware = (storeAPI: any) => (next: Dispatch<AnyAction>) => (action: AnyAction) => {
  if (fetchRecords.fulfilled.match(action)) {
    storeAPI.dispatch(resolveNewsletterRecords(action.payload));
  }
  if (resolveNewsletterRecords.fulfilled.match(action)) {
    storeAPI.dispatch(decryptNewsletterRecords(action.payload));
  }
  if (setNewsletter.match(action)) {
    console.log('setNewsletter', action.payload);
    const data = action.payload.data;
    storeAPI.dispatch(setTitle(data.title as string));
    storeAPI.dispatch(setTemplate(data.template as string));
    storeAPI.dispatch(setContent(data.content as string));
  }
  return next(action);
};

const subscriptionMiddleware = (storeAPI: any) => (next: Dispatch<AnyAction>) => (action: AnyAction) => {
  if (fetchRecords.fulfilled.match(action)) {
    storeAPI.dispatch(lookupSubscriptionRecords(action.payload));
  }
  if (lookupSubscriptionRecords.fulfilled.match(action)) {
    storeAPI.dispatch(decryptSubscriptionMappings(action.payload));
  }
  return next(action);
};

export const store = configureStore({
  reducer: {
    accounts: accountsReducer,
    records: recordsReducer,
    newsletters: newslettersReducer,
    subscriptions: subscriptionsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(loggerMiddleware).concat(newsletterMiddleware).concat(subscriptionMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
