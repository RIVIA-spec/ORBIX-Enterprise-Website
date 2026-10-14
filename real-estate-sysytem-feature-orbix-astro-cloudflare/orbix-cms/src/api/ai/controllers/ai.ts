const serviceName = 'api::ai.ai';

export default ({ strapi }: { strapi: any }) => ({
  async generateArticleSummary(ctx: any) {
    const service = strapi.service(serviceName);

    if (!service.isAuthorized(ctx)) {
      return ctx.unauthorized('Invalid AI secret.');
    }

    const articleId = service.readArticleId(ctx.request.body);

    if (!articleId) {
      return ctx.badRequest('articleId is required.');
    }

    try {
      const result = await service.generateArticleSummary(articleId);
      ctx.body = result;
    } catch (error) {
      strapi.log.error('Failed to generate article summary', error);
      ctx.throw(500, error instanceof Error ? error.message : 'Failed to generate article summary.');
    }
  },

  async health(ctx: any) {
    const service = strapi.service(serviceName);

    if (!service.isAuthorized(ctx)) {
      return ctx.unauthorized('Invalid AI secret.');
    }

    ctx.body = service.getHealth();
  },
});
