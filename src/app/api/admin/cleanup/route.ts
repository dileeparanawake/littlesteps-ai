import { NextResponse } from 'next/server';

import { verifyGitHubOidc } from '@/lib/cleanup/verify-github-oidc';
import { findInactiveUsers } from '@/lib/cleanup/find-inactive-users';
import { deleteInactiveUsers } from '@/lib/cleanup/delete-inactive-users';
import { purgeExpiredVerifications } from '@/lib/cleanup/purge-expired-verifications';
import type { CleanupResponse, CleanupLogEntry } from '@/lib/cleanup/types';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Missing authorization header' },
        { status: 401 },
      );
    }

    const parts = authHeader.split(' ', 2);
    if (parts[0] !== 'Bearer' || !parts[1]) {
      return NextResponse.json(
        { success: false, error: 'Invalid authorization header format' },
        { status: 401 },
      );
    }

    const token = parts[1];

    const verification = await verifyGitHubOidc(token);
    if (verification.success === false) {
      return NextResponse.json(
        { success: false, error: verification.error },
        { status: verification.status },
      );
    }

    const inactiveUsers = await findInactiveUsers();

    let response: CleanupResponse;

    if (inactiveUsers.length === 0) {
      const logEntry: CleanupLogEntry = {
        action: 'userCleanupNoop',
        success: true,
        message: 'No inactive users found',
        deletedCount: 0,
      };
      console.log(logEntry);

      response = {
        success: true,
        message: 'No inactive users found',
        deletedCount: 0,
      };
    } else {
      await deleteInactiveUsers(inactiveUsers);

      const logEntry: CleanupLogEntry = {
        action: 'userCleanupSucceeded',
        success: true,
        message: 'Inactive user cleanup succeeded',
        deletedUserIds: inactiveUsers.map((u) => u.id),
        deletedCount: inactiveUsers.length,
      };
      console.log(logEntry);

      response = {
        success: true,
        message: 'Inactive users deleted',
        deletedCount: inactiveUsers.length,
      };
    }

    try {
      const purgedCount = await purgeExpiredVerifications();
      const purgeLog: CleanupLogEntry = {
        action: 'verificationPurgeSucceeded',
        success: true,
        message: 'Expired verification cleanup succeeded',
        purgedCount,
      };
      console.log(purgeLog);
    } catch (purgeError: unknown) {
      const purgeLog: CleanupLogEntry = {
        action: 'verificationPurgeFailed',
        success: false,
        message: 'Expired verification cleanup failed',
        errorMessage:
          purgeError instanceof Error
            ? purgeError.message
            : String(purgeError),
      };
      console.error(purgeLog);
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error: unknown) {
    const logEntry: CleanupLogEntry = {
      action: 'userCleanupFailed',
      success: false,
      message: 'Inactive user cleanup failed',
      errorMessage: error instanceof Error ? error.message : String(error),
    };
    console.error(logEntry);

    const response: CleanupResponse = {
      success: false,
      error: 'Inactive user cleanup failed',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
