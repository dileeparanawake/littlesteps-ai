import { describe, it, expect } from 'vitest';

import {
  DEFAULT_THREAD_TITLE,
  THREAD_TITLE_MAX_LENGTH,
  titleFromPrompt,
} from '@/lib/chat/thread-title';

describe('titleFromPrompt', () => {
  it('keeps a short message as it is', () => {
    expect(titleFromPrompt('Toddler bedtime help')).toBe(
      'Toddler bedtime help',
    );
  });

  it('trims a long message to its first six words', () => {
    expect(
      titleFromPrompt(
        'Give me 3 short tips as a bulleted list for a calmer toddler bedtime.',
      ),
    ).toBe('Give me 3 short tips as…');
  });

  it('collapses line breaks and extra spaces', () => {
    expect(titleFromPrompt('  How   do I\n\nstop   biting?  ')).toBe(
      'How do I stop biting?',
    );
  });

  it('drops trailing punctuation before the ellipsis', () => {
    expect(titleFromPrompt('Sleep, naps, food, play, bath, books, more')).toBe(
      'Sleep, naps, food, play, bath, books…',
    );
  });

  it('never goes over the stored title length', () => {
    const title = titleFromPrompt('a'.repeat(200));
    expect(title.length).toBeLessThanOrEqual(THREAD_TITLE_MAX_LENGTH);
    expect(title.endsWith('…')).toBe(true);
  });

  it('falls back to the default for an empty message', () => {
    expect(titleFromPrompt('   ')).toBe(DEFAULT_THREAD_TITLE);
  });
});
