import { createTestUser } from './create-test-user';
import { deleteTestUser } from './test-delete-user';
import { createTestThread } from './test-create-thread';
import { viewTables } from './test-view-tables';

const cleanup = false;

async function run(cleanup: boolean = false) {
  if (cleanup) {
    await deleteTestUser();
    await viewTables();
    return;
  }
  // await createTestUser();
  // await createTestThread();

  await viewTables();
}

run(cleanup);
