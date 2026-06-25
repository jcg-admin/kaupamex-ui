import { setupWorker } from 'msw/browser';
import { allHandlers } from './handlers/index';

export const worker = setupWorker(...allHandlers);
