// @vitest-environment jsdom

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ isPending: false, error: null }),
  },
}));

vi.mock('@/components/providers/ModalProvider', () => ({
  useModal: () => ({ showSignIn: true, setShowSignIn: vi.fn() }),
}));

vi.mock('@/lib/sign-in', () => ({
  signIn: vi.fn(),
}));

describe('SignInModal privacy notice', () => {
  async function renderModal() {
    const { default: SignInModal } = await import(
      '@/components/sign-in/SignInModal'
    );
    render(<SignInModal />);
  }

  it('displays privacy notice text', async () => {
    await renderModal();
    expect(
      screen.getByText(/by signing in you agree to our/i),
    ).toBeTruthy();
  });

  it('contains a link to /privacy', async () => {
    await renderModal();
    const link = screen.getByRole('link', { name: /privacy policy/i });
    expect(link.getAttribute('href')).toBe('/privacy');
  });

  it('privacy link opens in a new tab', async () => {
    await renderModal();
    const link = screen.getByRole('link', { name: /privacy policy/i });
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
    expect(link.getAttribute('rel')).toContain('noreferrer');
  });
});
