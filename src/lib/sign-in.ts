import { authClient } from './auth-client';

export const signIn = async () => {
  const data = await authClient.signIn.social({
    provider: 'google',
  });
};
