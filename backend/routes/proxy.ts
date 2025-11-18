import { RouteDefinition } from '../http/types';
import { ProxyController } from '../server/controllers/proxyController';

const controller = new ProxyController();

const routes: RouteDefinition[] = [
  {
    method: 'POST',
    path: '/api/proxy',
    handler: (context) => controller.handle(context),
  },
];

export default routes;
