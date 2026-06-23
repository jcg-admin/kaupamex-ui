import { authHandlers }      from './auth';
import { catalogueHandlers } from './catalogue';
import { cartHandlers }      from './cart';
import { ordersHandlers }    from './orders';

export { authHandlers, catalogueHandlers, cartHandlers, ordersHandlers };

export const allHandlers = [
  ...authHandlers,
  ...catalogueHandlers,
  ...cartHandlers,
  ...ordersHandlers,
];
