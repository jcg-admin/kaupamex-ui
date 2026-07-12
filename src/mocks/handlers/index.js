import { authHandlers }      from './auth';
import { catalogueHandlers } from './catalogue';
import { cartHandlers }      from './cart';
import { ordersHandlers }    from './orders';
import { adminHandlers }     from './admin';
import { paymentsHandlers }  from './payments';
import { accountHandlers }   from './account';
import { geoHandlers }       from './geo';

export {
  authHandlers,
  catalogueHandlers,
  cartHandlers,
  ordersHandlers,
  adminHandlers,
  paymentsHandlers,
  accountHandlers,
  geoHandlers,
};

export const allHandlers = [
  ...authHandlers,
  ...catalogueHandlers,
  ...cartHandlers,
  ...ordersHandlers,
  ...adminHandlers,
  ...paymentsHandlers,
  ...accountHandlers,
  ...geoHandlers,
];
