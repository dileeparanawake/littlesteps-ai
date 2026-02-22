// @vitest-environment jsdom

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div>{children}</div>,
}));

vi.mock('@/content/privacy-notice', () => ({
  privacyNotice: '# Privacy Policy\n\nThis is the privacy policy content.',
}));

describe('Privacy policy page (/privacy)', () => {
  async function renderPage() {
    const { default: PrivacyPage } = await import('@/app/privacy/page');
    render(<PrivacyPage />);
  }

  it('renders without errors', async () => {
    await renderPage();
    expect(screen.getByText(/privacy policy/i)).toBeTruthy();
  });

  it('displays the expected heading text', async () => {
    await renderPage();
    expect(screen.getByText(/Privacy Policy/)).toBeTruthy();
  });

  it('renders without authentication context', async () => {
    await renderPage();
    expect(screen.getByText(/privacy policy/i)).toBeTruthy();
  });
});
