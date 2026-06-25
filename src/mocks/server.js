import { setupServer } from 'msw/node';
import { allHandlers } from './handlers/index';

export const server = setupServer(...allHandlers);
