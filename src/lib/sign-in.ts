import { authClient } from './auth-client';

export const signIn = async () => {
  await authClient.signIn.social({
    provider: 'google',
    disableRedirect: false,
  });
};
