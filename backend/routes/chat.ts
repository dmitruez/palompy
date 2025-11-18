import { RouteDefinition } from '../http/types';
import { json } from '../http/responses';
import { HttpError } from '../http/errors';
import { handleChatMessage } from '../services/chatService';
import { getShopByPublicKey } from '../services/shopsService';
import { assertOneOf, assertRecord, assertString, assertUuid } from '../utils/validation';

const routes: RouteDefinition[] = [
  {
    method: 'POST',
    path: '/api/chat',
    handler: async ({ request }) => {
      const body = assertRecord(request.body, 'body');
      const shopPublicKey = assertUuid(body.shopPublicKey, 'shopPublicKey');
      const sessionId = assertString(body.sessionId, 'sessionId', { minLength: 8 });
      const message = assertString(body.message, 'message', { minLength: 2 });
      const language = body.language ? assertOneOf(body.language, 'language', ['ru', 'en']) : undefined;

      const shop = await getShopByPublicKey(shopPublicKey);
      if (!shop) {
        throw new HttpError(404, 'Магазин не найден');
      }

      const answer = await handleChatMessage({
        shopId: shop.id,
        sessionId,
        message,
        language,
      });

      return json({ answer });
    },
  },
];

export default routes;
