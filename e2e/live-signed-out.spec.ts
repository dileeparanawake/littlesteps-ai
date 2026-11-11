// Live site, signed out only: land → type → sign-in prompt appears.
// Never signs in and never clicks the Google button.

import { test, expect } from '@playwright/test';

import {
  askButton,
  chatInput,
  signInButton,
  typePrompt,
} from './support/chat-page';

test('live pages return 200', async ({ request }) => {
  for (const path of ['/', '/chat', '/privacy', '/api/health']) {
    const response = await request.get(path);
    expect(response.status(), `${path} status`).toBe(200);
  }
});

test('a signed-out visitor types a question and is asked to sign in', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/chat$/);
  await expect(chatInput(page)).toBeVisible();

  await typePrompt(page, 'How can I help my toddler sleep through the night?');
  await askButton(page).click();

  await expect(signInButton(page)).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Privacy Policy' }),
  ).toBeVisible();

  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow, 'no horizontal page overflow').toBeLessThanOrEqual(0);

  await page.waitForTimeout(1500);
});
