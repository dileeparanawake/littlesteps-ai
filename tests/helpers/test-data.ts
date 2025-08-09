export const testUser = {
  id: 'user-id-123',
  name: 'Test User',
  email: 'test@example.com',
};

export function makeTestUser() {
  const id = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  return {
    id,
    name: `Test User ${id}`,
    email: `test-${id}@example.com`,
  };
}
