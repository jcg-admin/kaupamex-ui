/**
 * PropShapes -- PracticaYoruba
 * Definiciones centralizadas de prop-types para los dominios del e-commerce.
 * Evita duplicar definiciones en cada componente.
 */

import PropTypes from 'prop-types';

export const UserShape = PropTypes.shape({
  id:         PropTypes.number.isRequired,
  email:      PropTypes.string.isRequired,
  first_name: PropTypes.string,
  last_name:  PropTypes.string,
  is_staff:   PropTypes.bool,
});

export const CategoryShape = PropTypes.shape({
  id:   PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  slug: PropTypes.string.isRequired,
});

export const ProductShape = PropTypes.shape({
  id:             PropTypes.number.isRequired,
  slug:           PropTypes.string.isRequired,
  name:           PropTypes.string.isRequired,
  price:          PropTypes.number.isRequired,
  original_price: PropTypes.number,
  stock:          PropTypes.number.isRequired,
  category:       CategoryShape,
  images:         PropTypes.arrayOf(PropTypes.shape({
    id:      PropTypes.number,
    url:     PropTypes.string,
    is_main: PropTypes.bool,
  })),
  rating_avg:    PropTypes.number,
  review_count:  PropTypes.number,
});

export const CartItemShape = PropTypes.shape({
  id:         PropTypes.number.isRequired,
  product_id: PropTypes.number.isRequired,
  name:       PropTypes.string.isRequired,
  price:      PropTypes.number.isRequired,
  quantity:   PropTypes.number.isRequired,
  image:      PropTypes.string,
});

export const VoucherShape = PropTypes.shape({
  code:  PropTypes.string.isRequired,
  type:  PropTypes.oneOf(['PERCENT', 'FIXED']).isRequired,
  value: PropTypes.number.isRequired,
});

export const OrderShape = PropTypes.shape({
  id:         PropTypes.number.isRequired,
  status:     PropTypes.string.isRequired,
  total:      PropTypes.number.isRequired,
  created_at: PropTypes.string.isRequired,
  items:      PropTypes.array,
});

export const AddressShape = PropTypes.shape({
  first_name:  PropTypes.string,
  last_name:   PropTypes.string,
  street:      PropTypes.string,
  number:      PropTypes.string,
  city:        PropTypes.string,
  state:       PropTypes.string,
  postal_code: PropTypes.string,
  country:     PropTypes.string,
});

export const ToastShape = PropTypes.shape({
  id:      PropTypes.number.isRequired,
  type:    PropTypes.oneOf(['success', 'error', 'warning', 'info']).isRequired,
  title:   PropTypes.string,
  message: PropTypes.string,
});
