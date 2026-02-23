export const privacyNotice = `# Privacy Policy

**Last updated:** 2026-02-23

LittleSteps AI is a personal demo project built and operated by Dileepa Ranawake, based in the United Kingdom.

This policy explains what personal data we collect, why we collect it, who we share it with, and what rights you have.

## What we collect

### When you sign in with Google

We receive and store the following from your Google account:

- Your name
- Your email address
- Your profile picture URL
- Whether your email is verified

### When you use the app

- **Chat messages** - the messages you send and the AI-generated responses, linked to your account
- **Thread titles** - the names of your conversation threads
- **Session data** - your IP address and browser user agent, recorded when you sign in
- **Usage data** - token counts for each message (used to manage service limits)

## Why we collect it

Our lawful basis for processing your data is **legitimate interest** - we need this data to provide and operate the service.

- **Name, email, profile picture** - to identify you and let you sign in
- **Chat messages and thread titles** - to let you see and continue your conversations
- **IP address and user agent** - for session security and management
- **Token usage counts** - to manage usage limits

## Children's data

This service is designed for adults - specifically parents seeking guidance about their children's development. We do not collect data directly from children, and children should not use this service.

We recognise that chat messages are likely to contain information about your children, such as their age, developmental progress, or health-related questions. This information is stored as part of your chat history and is subject to the same protections and retention policies as all other data described in this policy.

## Third parties

### OpenAI

Your chat messages are sent to OpenAI's API to generate responses. The full conversation history for a thread is sent with each request to provide context.

OpenAI processes this data on our behalf under their API data usage policy:

- API inputs are not used to train OpenAI's models (data sharing is disabled for this project)
- OpenAI retains API data for up to 30 days for abuse and misuse monitoring, then deletes it

OpenAI is based in the United States. This means your chat data is transferred to the US when you use the service. OpenAI maintains appropriate safeguards for international data transfers under their standard terms.

### Google

We use Google OAuth for sign-in. Google provides your profile information (name, email, profile picture) when you sign in. Google's own privacy policy governs how Google handles your data on their side.

### Hosting

- **Application hosting** - Fly.io, London (UK) region
- **Database hosting** - Neon, London (EU) region

Your data is stored in the UK/EU. No international transfer occurs for hosting.

## Cookies

We use a single session cookie set by our authentication system (Better Auth) to keep you signed in. This is a strictly necessary cookie - the service cannot function without it.

We do not use any tracking cookies, analytics, or third-party scripts.

## Data retention

Accounts inactive for more than 90 days are periodically removed along with all associated data. If you want your data deleted sooner, you can request immediate deletion by emailing the address below.

## Your rights

Under UK GDPR, you have the right to:

- **Access** your data - request a copy of what we hold about you
- **Correct** inaccurate data
- **Delete** your data - request that we remove your account and all associated data
- **Object** to our processing of your data
- **Data portability** - request your data in a portable format

To exercise any of these rights, email: general.dileepa@icloud.com

We will respond within 30 days.

## How deletion works

When your account is deleted - whether by automatic cleanup or by request - the following data is permanently removed:

- Your user profile (name, email, profile picture)
- All sessions (including IP addresses and user agents)
- All authentication tokens
- All conversation threads and messages

This is handled by cascade deletion in our database - removing your account automatically removes all associated data.

To request immediate deletion, email: general.dileepa@icloud.com

## Changes to this policy

We may update this policy from time to time. Changes will be posted on this page with an updated date.

## Complaints

If you are unhappy with how we handle your data, you have the right to complain to the Information Commissioner's Office (ICO):

- Website: https://ico.org.uk

## Contact

Dileepa Ranawake
general.dileepa@icloud.com
`;
