import { expect, type Locator, type Page } from '@playwright/test';

export const PROMPT_PLACEHOLDER = 'What would you like to know?';

export function chatInput(page: Page): Locator {
  return page.getByPlaceholder(PROMPT_PLACEHOLDER);
}

export function askButton(page: Page): Locator {
  return page.getByRole('button', { name: 'Ask', exact: true });
}

export function signInButton(page: Page): Locator {
  return page.getByRole('button', { name: 'Sign in with Google' });
}

export function messages(page: Page, role: 'user' | 'assistant'): Locator {
  return page.locator(`[data-message-role="${role}"]`);
}

/** Types like a person, so the video shows the message being written. */
export async function typePrompt(page: Page, text: string): Promise<void> {
  const input = chatInput(page);
  await input.click();
  await input.pressSequentially(text, { delay: 25 });
  await expect(input).toHaveValue(text);
}

/**
 * Checks a message rendered as formatted text, not raw model output.
 * Behaviour only: never the model name or the exact reply.
 */
export async function expectRenderedMessage(
  message: Locator,
  { expectList = false }: { expectList?: boolean } = {},
): Promise<void> {
  const body = message.locator('[data-message-body]');
  await expect(body).toBeVisible();

  const text = (await body.innerText()).trim();
  expect(text.length, 'reply has real content').toBeGreaterThan(20);

  // Markdown was rendered, not shown raw.
  expect(text, 'no raw bold markers').not.toMatch(/\*\*|__/);
  expect(text, 'no raw heading markers').not.toMatch(/^#{1,6}\s/m);
  expect(text, 'no literal \\n').not.toMatch(/\\n/);
  expect(text, 'no undefined/null leaks').not.toMatch(
    /\bundefined\b|\bnull\b|\[object Object\]/,
  );

  // At least one rendered block element (paragraph or list item).
  await expect(body.locator('p, li').first()).toBeVisible();
  if (expectList) {
    expect(
      await body.locator('ul li, ol li').count(),
      'list items rendered',
    ).toBeGreaterThanOrEqual(2);
  }
}

/** No sideways scroll and the message stays inside the viewport. */
export async function expectNoLayoutBreak(
  page: Page,
  message?: Locator,
): Promise<void> {
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow, 'no horizontal page overflow').toBeLessThanOrEqual(0);

  if (message) {
    const box = await message.boundingBox();
    const viewport = page.viewportSize();
    expect(box, 'message is laid out').not.toBeNull();
    expect(viewport).not.toBeNull();
    if (box && viewport) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
    }
  }
}
