//  provides a session object that you can use to access the session data.

import { auth } from './auth'; // path to your Better Auth server instance
import { headers } from 'next/headers';

const getServerSession = async () => {
  const session = await auth.api.getSession({
    headers: await headers(), // you need to pass the headers object.
  });

  return Promise.resolve(session);
};

export default getServerSession;
