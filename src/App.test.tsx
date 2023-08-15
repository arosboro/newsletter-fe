import React from 'react';
import { describe, expect, it } from 'vitest';
import App from '@/App';
import { render, screen, userEvent } from '@/test/test-utils';
describe('Sample App vitest', () => {
  it('the Create action is visible', () => {
    render(<App />);
    expect(screen.getByText(/Create/i)).toBeTruthy();
  });
  it('The Consume action is visible', () => {
    render(<App />);
    expect(screen.getByText(/Consume/i)).toBeTruthy();
  });
  it('The Deploy|Obey action is visible', async () => {
    render(<App />);
    expect(await screen.findByText(/Deploy|Obey/i)).toBeTruthy();
  });
});
