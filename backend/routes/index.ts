import { RouteDefinition } from '../http/types';
import analyticsRoutes from './analytics';
import chatRoutes from './chat';
import dataRoutes from './data';
import shopsRoutes from './shops';
import surveyResponsesRoutes from './surveyResponses';
import surveysRoutes from './surveys';

const routes: RouteDefinition[] = [
  ...shopsRoutes,
  ...dataRoutes,
  ...chatRoutes,
  ...surveysRoutes,
  ...surveyResponsesRoutes,
  ...analyticsRoutes,
];

export default routes;
