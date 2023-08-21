import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

/**
 * Custom hook to dispatch Redux actions.
 * This is a typed version of the useDispatch hook from 'react-redux'.
 * Use this custom hook throughout your app instead of the plain `useDispatch` for type safety.
 *
 * @returns {AppDispatch} The dispatch function from your Redux store.
 */
export const useAppDispatch: () => AppDispatch = useDispatch;

/**
 * Custom hook to select state from the Redux store.
 * This is a typed version of the useSelector hook from 'react-redux'.
 * Use this custom hook throughout your app instead of the plain `useSelector` for type safety.
 *
 * @type {TypedUseSelectorHook<RootState>}
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
