import { AnyAction, Dispatch, MiddlewareAPI, configureStore } from '@reduxjs/toolkit';
import accountsReducer from '@/features/accounts/accountsSlice';
import recordsReducer, { fetchRecords } from '@/features/records/recordsSlice';
import newslettersReducer, {
  decryptNewsletterRecords,
  resolveNewsletterRecords,
} from '@/features/newsletters/newslettersSlice';
import subscriptionsReducer, {
  lookupSubscriptionRecords,
  fetchSubscriptionMappings,
} from '@/features/subscriptions/subscriptionsSlice';

/**
 * Middleware to log actions and state.
 * @param {MiddlewareAPI} storeAPI - The middleware API provided by Redux.
 * @returns The middleware chain.
 */
const loggerMiddleware = (storeAPI: MiddlewareAPI) => (next: Dispatch<AnyAction>) => (action: any) => {
  console.log('dispatching', action);
  const result = next(action);
  console.log('next state', storeAPI.getState());
  return result;
};

/**
 * Middleware to handle newsletters' records logic.
 * @param {any} storeAPI - The middleware API (generic type).
 * @returns The middleware chain.
 */
const newsletterMiddleware = (storeAPI: any) => (next: Dispatch<AnyAction>) => (action: AnyAction) => {
  if (fetchRecords.fulfilled.match(action)) {
    storeAPI.dispatch(resolveNewsletterRecords(action.payload));
  }
  if (resolveNewsletterRecords.fulfilled.match(action)) {
    storeAPI.dispatch(decryptNewsletterRecords(action.payload));
  }
  return next(action);
};

/**
 * Middleware to handle subscriptions' records logic.
 * @param {any} storeAPI - The middleware API (generic type).
 * @returns The middleware chain.
 */
const subscriptionMiddleware = (storeAPI: any) => (next: Dispatch<AnyAction>) => (action: AnyAction) => {
  if (fetchRecords.fulfilled.match(action)) {
    storeAPI.dispatch(lookupSubscriptionRecords(action.payload));
  }
  if (lookupSubscriptionRecords.fulfilled.match(action)) {
    storeAPI.dispatch(fetchSubscriptionMappings(action.payload));
  }
  return next(action);
};

/**
 * The main Redux store configuration.
 */
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

/**
 * Type definition for the root state of the application.
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * Type definition for the main dispatch function of the application.
 */
export type AppDispatch = typeof store.dispatch;
