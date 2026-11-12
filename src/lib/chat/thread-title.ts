export const DEFAULT_THREAD_TITLE = 'Untitled Thread';

/** Matches thread.title (VARCHAR 60) and the rename validator. */
export const THREAD_TITLE_MAX_LENGTH = 60;

const TITLE_WORDS = 6;
const ELLIPSIS = '…';

/**
 * Names a new chat from its first message: the first six words, at most
 * 60 characters. Plain string work, no model call (free and instant).
 */
export function titleFromPrompt(prompt: string): string {
  const words = prompt.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return DEFAULT_THREAD_TITLE;

  let title = words.slice(0, TITLE_WORDS).join(' ');
  let trimmed = words.length > TITLE_WORDS;

  if (title.length > THREAD_TITLE_MAX_LENGTH) {
    title = title.slice(0, THREAD_TITLE_MAX_LENGTH - ELLIPSIS.length);
    trimmed = true;
  }

  if (!trimmed) return title;
  return title.replace(/[\s.,;:!?-]+$/, '') + ELLIPSIS;
}
