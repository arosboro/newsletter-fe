import React from 'react';
import { describe, expect, it } from 'vitest';
import App from '@/App';
import { render, screen, userEvent } from '@/test/test-utils';

/**
 * Tests to verify the rendering of the Create Page components.
 */
describe('The Create Page Renders', () => {
  /**
   * Ensures the Create action text is visible on the page.
   */
  it('The Create action is visible', () => {
    render(<App />);
    expect(screen.getByText(/Create/i)).toBeTruthy();
  });

  /**
   * Ensures the Consume action text is visible on the page.
   */
  it('The Consume action is visible', () => {
    render(<App />);
    expect(screen.getByText(/Consume/i)).toBeTruthy();
  });

  /**
   * Ensures the Deploy|Obey action text is visible on the page.
   */
  it('The Deploy|Obey action is visible', async () => {
    render(<App />);
    expect(await screen.findByText(/Deploy|Obey/i)).toBeTruthy();
  });

  /**
   * Verifies the presence of an input field with a "Title" placeholder.
   */
  it('Contains a title input with placeholder', () => {
    render(<App />);
    expect(screen.getByPlaceholderText(/Title/i)).toBeTruthy();
  });

  /**
   * Verifies the presence of an input field with a "Filter" placeholder.
   */
  it('Contains a filter input with placeholder', () => {
    render(<App />);
    expect(screen.getByPlaceholderText(/Filter/i)).toBeTruthy();
  });

  /**
   * Ensures the New button is visible on the page.
   */
  it('Has a New button', () => {
    render(<App />);
    expect(screen.getByText(/New/i)).toBeTruthy();
  });

  /**
   * Ensures the Example button is visible on the page.
   */
  it('Has an Example button', () => {
    render(<App />);
    expect(screen.getByText(/Example/i)).toBeTruthy();
  });

  /**
   * Ensures the MultiModal button with the text "Select Wallet" is visible on the page.
   */
  it('Has a MultiModal button', () => {
    render(<App />);
    expect(screen.getByText(/Select Wallet/i)).toBeTruthy();
  });
});

/**
 * Tests to verify menu routing functionality.
 */
describe('The menu routing works', () => {
  /**
   * Verifies the Consume action's functionality in the menu routing.
   */
  it('The Consume action works', async () => {
    render(<App />);
    await userEvent.click(screen.getByText(/Example/i));
    await userEvent.click(screen.getByText(/Consume/i));
    expect(await screen.findByText(/Privacy mode/i)).toBeTruthy();
    expect(await screen.findByText(/Draft Preview/i)).toBeTruthy();
    expect(screen.queryByText(/Template mode/i)).toBeNull();
    expect(screen.getByText(/(Journal|The Crypto Classifieds)/i)).toBeTruthy();
  });

  /**
   * Verifies the Create action's functionality in the menu routing.
   */
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
