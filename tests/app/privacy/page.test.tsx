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
    expect(screen.getByRole('article')).toBeTruthy();
  });

  it('passes privacy notice content to ReactMarkdown', async () => {
    await renderPage();
    expect(
      screen.getByText(/this is the privacy policy content/i),
    ).toBeTruthy();
  });
});

describe('Privacy notice content', () => {
  async function loadNotice() {
    const mod = await vi.importActual<
      typeof import('@/content/privacy-notice')
    >('@/content/privacy-notice');
    return mod.privacyNotice;
  }

  it('asks people to complain to us first', async () => {
    const notice = await loadNotice();
    expect(notice).toMatch(/right to complain to us/i);
    expect(notice).toMatch(/acknowledge your complaint within 30 days/i);
  });

  it('names the Information Commission as the regulator', async () => {
    const notice = await loadNotice();
    expect(notice).toMatch(/complain to the Information Commission,/);
    expect(notice).toContain('https://ico.org.uk');
  });
});
