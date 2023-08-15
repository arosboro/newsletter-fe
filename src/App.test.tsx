import React from 'react';
import { describe, expect, it } from 'vitest';
import App from '@/App';
import { render, screen, userEvent } from '@/test/test-utils';

describe('The Create Page Renders', () => {
  it('The Create action is visible', () => {
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
  it('Contains a title input with placeholder', () => {
    render(<App />);
    expect(screen.getByPlaceholderText(/Title/i)).toBeTruthy();
  });
  it('Contains a filter input with placeholder', () => {
    render(<App />);
    expect(screen.getByPlaceholderText(/Filter/i)).toBeTruthy();
  });
  it('Has a New button', () => {
    render(<App />);
    expect(screen.getByText(/New/i)).toBeTruthy();
  });
  it('Has an Example button', () => {
    render(<App />);
    expect(screen.getByText(/Example/i)).toBeTruthy();
  });
  it('Has a MultiModal button', () => {
    render(<App />);
    expect(screen.getByText(/Select Wallet/i)).toBeTruthy();
  });
});

describe('The menu routing works', () => {
  it('The Consume action works', async () => {
    render(<App />);
    await userEvent.click(screen.getByText(/Example/i));
    await userEvent.click(screen.getByText(/Consume/i));
    expect(await screen.findByText(/Privacy mode/i)).toBeTruthy();
    expect(await screen.findByText(/Draft Preview/i)).toBeTruthy();
    // Check that a toggle for "Template mode (on)" is no longer visible.
    expect(screen.queryByText(/Template mode/i)).toBeNull();
    expect(screen.getByText(/(Journal|The Crypto Classifieds)/i)).toBeTruthy();
  });
  it('The Create action works', async () => {
    render(<App />);
    await userEvent.click(screen.getByText(/Consume/i));
    expect(screen.queryByText(/Template mode/i)).toBeNull();
    await userEvent.click(screen.getByText(/Create/i));
    expect(screen.queryByText(/Draft Preview/i)).toBeNull();
    await userEvent.click(screen.getByText(/Example/i));
    expect(screen.getByDisplayValue(/(Journal|The Crypto Classifieds)/i)).toBeTruthy();
  });
});
