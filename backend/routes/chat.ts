import { RouteDefinition } from '../http/types';
import { json } from '../http/responses';
import { HttpError } from '../http/errors';
import { ChatMetadata, handleChatMessage } from '../services/chatService';
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
      const metadata = parseMetadata(body.metadata);

      const shop = await getShopByPublicKey(shopPublicKey);
      if (!shop) {
        throw new HttpError(404, 'Магазин не найден');
      }

      const result = await handleChatMessage({
        shop,
        sessionId,
        message,
        language,
        metadata,
      });

      return json(result);
    },
  },
];

function parseMetadata(raw: unknown): ChatMetadata | undefined {
  if (!raw) {
    return undefined;
  }
  const record = assertRecord(raw, 'metadata');
  const metadata: ChatMetadata = {};
  if (record.pageUrl) {
    metadata.pageUrl = assertString(record.pageUrl, 'metadata.pageUrl', { maxLength: 500 });
  }
  if (record.pageTitle) {
    metadata.pageTitle = assertString(record.pageTitle, 'metadata.pageTitle', { maxLength: 200 });
  }
  return Object.keys(metadata).length ? metadata : undefined;
}

export default routes;
