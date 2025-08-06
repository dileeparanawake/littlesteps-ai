import { createTestUser } from './test-create-user';
import { deleteTestUser } from './test-delete-user';
import { createTestThread } from './test-create-thread';
import { viewTables } from './test-view-tables';

async function run() {
  // await createTestUser();
  // await createTestThread();
  await deleteTestUser();
  await viewTables();
}

run();
