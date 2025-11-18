import { RouteDefinition } from '../http/types';
import { json } from '../http/responses';
import { assertRecord, assertString } from '../utils/validation';
import { issueCsrfToken } from '../security/csrf';
import { authenticateRequest } from '../security/authentication';
import { requireRoles } from '../services/rbacService';
import { enableTwoFactor, requestTwoFactorSetup } from '../services/twoFactorService';
import { HttpError } from '../http/errors';

const TWO_FACTOR_ROLES = ['admin', 'owner'];

const routes: RouteDefinition[] = [
  {
    method: 'GET',
    path: '/api/security/csrf',
    handler: async ({ request }) => {
      if (!request.sessionId) {
        throw new HttpError(400, 'Не передан X-Session-Id');
      }
      const token = issueCsrfToken(request.sessionId);
      return json(token, 200, { 'X-CSRF-Token': token.token });
    },
  },
  {
    method: 'POST',
    path: '/api/security/2fa/setup',
    handler: async ({ request }) => {
      const auth = authenticateRequest(request.headers);
      await requireRoles(auth.userId, TWO_FACTOR_ROLES);
      const payload = await requestTwoFactorSetup(auth.userId);
      return json(payload);
    },
  },
  {
    method: 'POST',
    path: '/api/security/2fa/enable',
    handler: async ({ request }) => {
      const auth = authenticateRequest(request.headers);
      await requireRoles(auth.userId, TWO_FACTOR_ROLES);
      const body = assertRecord(request.body, 'body');
      const token = assertString(body.token, 'token', { minLength: 6, maxLength: 12 });
      await enableTwoFactor(auth.userId, token);
      return json({ enabled: true });
    },
  },
];

export default routes;
