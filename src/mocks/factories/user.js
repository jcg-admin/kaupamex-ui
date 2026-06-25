import { faker } from '@faker-js/faker';

export function makeUser(overrides = {}) {
  const firstName = faker.person.firstName();
  const lastName  = faker.person.lastName();
  return {
    id:           faker.number.int({ min: 1, max: 9999 }),
    username:     overrides.username ?? faker.internet.username({ firstName, lastName }),
    email:        faker.internet.email({ firstName, lastName }),
    first_name:   firstName,
    last_name:    lastName,
    is_staff:     false,
    is_superuser: false,
    ...overrides,
  };
}
