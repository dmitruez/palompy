import { RouteDefinition } from '../http/types';
import { json } from '../http/responses';
import { assertRecord, assertString } from '../utils/validation';
import { createShop } from '../services/shopsService';

const routes: RouteDefinition[] = [
  {
    method: 'POST',
    path: '/api/shops',
    handler: async ({ request }) => {
      const body = assertRecord(request.body, 'body');
      const name = assertString(body.name, 'name', { minLength: 2 });
      const shop = await createShop(name);
      return json({ shop }, 201);
    },
  },
];

export default routes;
