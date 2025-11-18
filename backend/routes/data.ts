import { RouteDefinition } from '../http/types';
import { json } from '../http/responses';
import { HttpError } from '../http/errors';
import { ingestKnowledgeDocuments } from '../services/knowledgeService';
import { getShopById } from '../services/shopsService';
import { assertArray, assertNumber, assertRecord, assertString } from '../utils/validation';

const routes: RouteDefinition[] = [
  {
    method: 'POST',
    path: '/api/shops/:shopId/data',
    handler: async ({ request }) => {
      const shopId = Number(request.params.shopId);
      if (!Number.isFinite(shopId)) {
        throw new HttpError(400, 'Некорректный идентификатор магазина');
      }
      const shop = await getShopById(shopId);
      if (!shop) {
        throw new HttpError(404, 'Магазин не найден');
      }
      const body = assertRecord(request.body, 'body');
      const documentsInput = assertArray(body.documents, 'documents');
      if (!documentsInput.length) {
        throw new HttpError(400, 'Нужно передать хотя бы один документ');
      }
      const documents = documentsInput.map((doc, index) => {
        const record = assertRecord(doc, `documents[${index}]`);
        const sourceType = assertString(record.sourceType, 'sourceType');
        const sourceId = record.sourceId ? assertString(record.sourceId, 'sourceId') : undefined;
        const text = assertString(record.text, 'text', { minLength: 10 });
        let chunkSize: number | undefined;
        if (record.chunkSize !== undefined) {
          chunkSize = assertNumber(record.chunkSize, 'chunkSize');
          if (chunkSize < 100 || chunkSize > 2000) {
            throw new HttpError(400, 'chunkSize должен быть от 100 до 2000 символов');
          }
        }
        return { sourceType, sourceId, text, chunkSize };
      });
      const inserted = await ingestKnowledgeDocuments(shop.id, documents);
      return json({ inserted });
    },
  },
];

export default routes;
