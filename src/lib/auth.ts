import { betterAuth } from 'better-auth';
import Database from 'better-sqlite3'; // TODO: remove this and replace with PostgreSQL + Drizzle in MVS3

export const auth = betterAuth({
  // TODO: update DB config instructions step 4 for MVS3 https://www.better-auth.com/docs/installation

  database: new Database('./sqlite.db'),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});
