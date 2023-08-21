import { cleanup, render } from '@testing-library/react';
import React, { PropsWithChildren } from 'react';
import { afterEach } from 'vitest';
import { Provider } from 'react-redux';
import { store } from '@/app/store';

afterEach(() => {
  cleanup();
});

const customRender = (ui: React.ReactElement, options = {}) => {
  render(ui, {
    wrapper: ({ children }: PropsWithChildren<object>): JSX.Element => {
      return <Provider store={store}>{children}</Provider>;
    },
    ...options,
  });
};

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

export { customRender as render };
