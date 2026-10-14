export default {
  routes: [
    {
      method: 'POST',
      path: '/ai/generate-article-summary',
      handler: 'ai.generateArticleSummary',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/ai/health',
      handler: 'ai.health',
      config: {
        auth: false,
      },
    },
  ],
};
