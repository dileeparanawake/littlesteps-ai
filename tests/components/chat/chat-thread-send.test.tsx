// @vitest-environment jsdom

// What a parent sees right after pressing Ask (ls#76): their message at once,
// a clear "Thinking…" state and a screen-reader status, before any reply.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ data: { user: { id: 'user-1' } } }),
  },
}));

vi.mock('@/components/providers/ModalProvider', () => ({
  useModal: () => ({ setShowSignIn: vi.fn() }),
}));

const PROMPT = 'How do I help my toddler sleep through the night?';
const NEW_THREAD_ID = '11111111-1111-1111-1111-111111111111';

type Deferred = { resolve: (r: Response) => void; reject: (e: Error) => void };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

let chatPost: Deferred;

function mockFetch() {
  return vi.fn((url: string, init?: RequestInit) => {
    if (url.startsWith('/api/chat') && init?.method === 'POST') {
      return new Promise<Response>((resolve, reject) => {
        chatPost = { resolve, reject };
      });
    }
    if (url.startsWith('/api/chat')) {
      return Promise.resolve(
        json([
          { id: 'm1', role: 'user', content: PROMPT },
          { id: 'm2', role: 'assistant', content: 'Try a calm routine.' },
        ]),
      );
    }
    if (url.startsWith('/api/threads')) {
      return Promise.resolve(json([]));
    }
    return Promise.reject(new Error(`unexpected fetch ${url}`));
  });
}

async function renderNewChat() {
  const { default: ChatThread } = await import(
    '@/components/chat/ChatThread/ChatThread'
  );
  const { ChatStatusProvider } = await import('@/components/chat/ChatStatus');
  const { SidebarProvider } = await import(
    '@/components/chat/ChatSidebar/SidebarContext'
  );
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <SidebarProvider value={{ openSidebar: vi.fn(), closeSidebar: vi.fn() }}>
        <ChatStatusProvider>
          <ChatThread />
        </ChatStatusProvider>
      </SidebarProvider>
    </QueryClientProvider>,
  );
}

function ask(text: string) {
  fireEvent.change(
    screen.getByPlaceholderText('What would you like to know?'),
    {
      target: { value: text },
    },
  );
  fireEvent.click(screen.getByRole('button', { name: 'Ask' }));
}

describe('ChatThread: sending a message', () => {
  beforeEach(() => {
    push.mockReset();
    vi.stubGlobal('fetch', mockFetch());
    Element.prototype.scrollTo = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('shows the sent message and a thinking state before the reply', async () => {
    await renderNewChat();
    ask(PROMPT);

    // The reply hasn't come back, yet the parent's message is on screen
    const sent = await screen.findByText(PROMPT);
    expect(sent.closest('[data-message-role="user"]')).not.toBeNull();
    expect(screen.getByText('Thinking…')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe(
      'Message sent. Waiting for a reply…',
    );

    // The box is cleared and Ask can't be pressed twice
    expect(
      (
        screen.getByPlaceholderText(
          'What would you like to know?',
        ) as HTMLTextAreaElement
      ).value,
    ).toBe('');
    expect(
      (screen.getByRole('button', { name: 'Ask' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it('moves a new chat to its page once the reply is saved', async () => {
    await renderNewChat();
    ask(PROMPT);
    await screen.findByText('Thinking…');

    await act(async () => {
      chatPost.resolve(json({ threadID: NEW_THREAD_ID }));
    });

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith(`/chat/${NEW_THREAD_ID}`),
    );
    expect(screen.getByRole('status').textContent).toBe('Reply received.');
  });

  it('gives the message back if sending fails', async () => {
    await renderNewChat();
    ask(PROMPT);
    await screen.findByText('Thinking…');

    await act(async () => {
      chatPost.resolve(json({ error: 'Weekly limit reached' }, 429));
    });

    await screen.findByText(/Weekly limit reached/);
    expect(screen.queryByText('Thinking…')).toBeNull();
    expect(
      (
        screen.getByPlaceholderText(
          'What would you like to know?',
        ) as HTMLTextAreaElement
      ).value,
    ).toBe(PROMPT);
    expect(push).not.toHaveBeenCalled();
  });
});
