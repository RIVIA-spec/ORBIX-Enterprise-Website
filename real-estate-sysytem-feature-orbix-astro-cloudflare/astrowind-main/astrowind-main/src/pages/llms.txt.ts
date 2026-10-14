import { getBrandSettings } from '~/lib/strapi/client';
import { publicRoutes } from '~/lib/seo/routes';
import { getCanonical } from '~/utils/permalinks';

export const GET = async () => {
  const brand = await getBrandSettings();
  const lines = [
    `# ${brand.brandName}`,
    '',
    brand.llmsDescription || brand.entityDefinition,
    '',
    `Operated by: ${brand.operatedBy}`,
    `Relationship: ${brand.riviaRelationship}`,
    '',
    '## Canonical Resources',
    ...publicRoutes.map((route) => `- ${getCanonical(route)}`),
    '',
    '## Notes',
    '- llms.txt is provided as a machine-readable discovery aid. It is not a ranking or inclusion guarantee.',
  ];

  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
