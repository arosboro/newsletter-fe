/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './app/store';
import App from './App';
import './index.css';

/**
 * This is the entry point for the app.
 * It renders the App component into the DOM.
 * It also wraps the App component with the Redux Provider component.
 * This allows the App component to access the Redux store.
 * The Provider component takes a store prop.
 * The store prop is the Redux store.
 * The Redux store is created in src/app/store.ts.
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <App />
  </Provider>,
);
