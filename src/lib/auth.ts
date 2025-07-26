import { betterAuth } from 'better-auth';

export const auth = betterAuth({
  // TODO: ad db config instructions step 4 https://www.better-auth.com/docs/installation

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});
