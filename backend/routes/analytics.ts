import { RouteDefinition } from '../http/types';
import { json, noContent } from '../http/responses';
import { HttpError } from '../http/errors';
import { getShopById, getShopByPublicKey } from '../services/shopsService';
import { getAnalyticsSummary, recordWidgetEvent } from '../services/analyticsService';
import { assertRecord, assertString, assertUuid } from '../utils/validation';

const routes: RouteDefinition[] = [
  {
    method: 'POST',
    path: '/api/analytics/events',
    handler: async ({ request }) => {
      const body = assertRecord(request.body, 'body');
      const shopPublicKey = assertUuid(body.shopPublicKey, 'shopPublicKey');
      const sessionId = assertString(body.sessionId, 'sessionId', { minLength: 4 });
      const eventName = assertString(body.eventName, 'eventName', { minLength: 2 });
      const metadata = body.metadata ? assertRecord(body.metadata, 'metadata') : undefined;

      const shop = await getShopByPublicKey(shopPublicKey);
      if (!shop) {
        throw new HttpError(404, 'Магазин не найден');
      }

      await recordWidgetEvent({
        shopId: shop.id,
        sessionId,
        eventName,
        metadata,
      });

      return noContent();
    },
  },
  {
    method: 'GET',
    path: '/api/analytics/shops/:shopId/summary',
    handler: async ({ request }) => {
      const shopId = Number(request.params.shopId);
      if (!Number.isFinite(shopId)) {
        throw new HttpError(400, 'Некорректный идентификатор магазина');
      }
      const shop = await getShopById(shopId);
      if (!shop) {
        throw new HttpError(404, 'Магазин не найден');
      }
      const summary = await getAnalyticsSummary(shop.id);
      return json({ summary });
    },
  },
];

export default routes;
