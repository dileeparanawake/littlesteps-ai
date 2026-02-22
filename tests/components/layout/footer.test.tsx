// @vitest-environment jsdom

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from '@/components/layout/Footer';

describe('Footer component', () => {
  it('renders on the page', () => {
    const { container } = render(<Footer />);
    expect(container.querySelector('footer')).toBeTruthy();
  });

  it('contains a link to /privacy', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /privacy/i });
    expect(link.getAttribute('href')).toBe('/privacy');
  });

  it('privacy link opens in a new tab', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /privacy/i });
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
    expect(link.getAttribute('rel')).toContain('noreferrer');
  });
});
