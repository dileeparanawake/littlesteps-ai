// Main flow, local build: land → type → prompted to sign in → signed in →
// send → reply renders → second message → it renders too. Real OpenAI call.

import { test, expect } from '@playwright/test';

import {
  SESSION_COOKIE_NAME,
  seedSignedInSession,
} from './support/session-seed';
import {
  askButton,
  chatInput,
  expectNoLayoutBreak,
  expectRenderedMessage,
  messages,
  signInButton,
  typePrompt,
} from './support/chat-page';

const REPLY_TIMEOUT = 90_000;

const FIRST_PROMPT =
  'Give me 3 short tips as a bulleted list for a calmer toddler bedtime. Put one key word in bold.';
const SECOND_PROMPT = 'Thanks! One more tip, in two sentences?';

test('a parent signs in, asks two questions and both replies render', async ({
  page,
  context,
  baseURL,
}) => {
  // Land: the home page sends a new visitor to a new chat.
  await page.goto('/');
  await expect(page).toHaveURL(/\/chat$/);
  await expect(page.getByRole('heading', { name: 'New chat' })).toBeVisible();

  // Type a question while signed out, then ask: the sign-in prompt appears.
  await typePrompt(page, FIRST_PROMPT);
  await askButton(page).click();
  await expect(signInButton(page)).toBeVisible();
  await page.waitForTimeout(1500); // hold so the video shows the prompt

  // Sign in (test-only session for a local database; Google is not used).
  const { cookieValue } = await seedSignedInSession({
    NODE_ENV: process.env.NODE_ENV,
    E2E_ALLOW_SESSION_SEED: process.env.E2E_ALLOW_SESSION_SEED,
    DATABASE_URL: process.env.E2E_DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.E2E_AUTH_SECRET,
  });
  if (!baseURL) throw new Error('baseURL is not set');
  await context.addCookies([
    { name: SESSION_COOKIE_NAME, value: cookieValue, url: baseURL },
  ]);
  await page.reload();

  // Back from sign-in: the modal is gone and the question is still there.
  await expect(signInButton(page)).toBeHidden();
  await expect(chatInput(page)).toHaveValue(FIRST_PROMPT);

  // Send it and wait for the reply.
  await askButton(page).click();
  await expect(page).toHaveURL(/\/chat\/[0-9a-f-]{36}$/, {
    timeout: REPLY_TIMEOUT,
  });
  await expect(messages(page, 'assistant')).toHaveCount(1, {
    timeout: REPLY_TIMEOUT,
  });
  await expect(messages(page, 'user')).toHaveCount(1);
  await expectRenderedMessage(messages(page, 'assistant').first(), {
    expectList: true,
  });
  await expectNoLayoutBreak(page, messages(page, 'assistant').first());
  await page.waitForTimeout(1500); // hold so the video shows the reply

  // A second, short message in the same chat renders too.
  await typePrompt(page, SECOND_PROMPT);
  await askButton(page).click();
  await expect(messages(page, 'assistant')).toHaveCount(2, {
    timeout: REPLY_TIMEOUT,
  });
  await expect(messages(page, 'user')).toHaveCount(2);
  await expect(chatInput(page)).toHaveValue('');
  const secondReply = messages(page, 'assistant').nth(1);
  await secondReply.scrollIntoViewIfNeeded();
  await expectRenderedMessage(secondReply);
  await expectNoLayoutBreak(page, secondReply);

  // The new chat shows a title instead of the placeholder.
  await expect(page.locator('#thread-title')).not.toHaveText(
    /^(New chat|Loading\.\.\.)$/,
  );

  // Hold the final frame so the video ends on the rendered reply.
  await page.waitForTimeout(2500);
});
