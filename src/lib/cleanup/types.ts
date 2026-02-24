export interface InactiveUser {
  id: string;
  email: string;
  lastActiveDate: Date;
}

export type OidcVerificationResult =
  | { success: true }
  | { success: false; status: 401 | 403; error: string };

export type CleanupResponse =
  | { success: true; message: string; deletedCount: number }
  | { success: false; error: string };

export type CleanupLogEntry =
  | {
      action: 'userCleanupSucceeded';
      success: true;
      message: string;
      deletedUserIds: string[];
      deletedCount: number;
    }
  | {
      action: 'userCleanupNoop';
      success: true;
      message: string;
      deletedCount: 0;
    }
  | {
      action: 'userCleanupFailed';
      success: false;
      message: string;
      errorMessage: string;
    };
