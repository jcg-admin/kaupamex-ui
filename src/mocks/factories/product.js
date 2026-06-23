import { faker } from '@faker-js/faker';

export function makeProduct(overrides = {}) {
  const id   = overrides.id   ?? faker.number.int({ min: 1, max: 1000 });
  const name = overrides.name ?? faker.commerce.productName();
  const slug = overrides.slug ?? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return {
    id,
    name,
    slug,
    description: faker.commerce.productDescription(),
    price:       faker.commerce.price({ min: 10, max: 500 }),
    images:      [],
    category:    { id: 1, name: 'Velas', slug: 'velas' },
    variants: [
      {
        id:        faker.number.int({ min: 1, max: 9999 }),
        name:      'Default',
        sku:       `SKU-${String(id).padStart(3, '0')}`,
        price:     faker.commerce.price({ min: 10, max: 500 }),
        stock:     faker.number.int({ min: 0, max: 100 }),
      },
    ],
    ...overrides,
  };
}
