import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
// import Database from 'better-sqlite3'; // TODO: remove this and replace with PostgreSQL + Drizzle in MVS3
import { db } from '@/db';
import * as schema from '@/db/schema';

// export const auth = betterAuth({
//   // TODO: update DB config instructions step 4 for MVS3 https://www.better-auth.com/docs/installation

//   database: new Database('./sqlite.db'),
//   emailAndPassword: {
//     enabled: false,
//   },
//   socialProviders: {
//     google: {
//       clientId: process.env.GOOGLE_CLIENT_ID as string,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
//       prompt: 'select_account+consent',
//     },
//   },
// });

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  emailAndPassword: {
    enabled: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      prompt: 'select_account+consent',
    },
  },
});
