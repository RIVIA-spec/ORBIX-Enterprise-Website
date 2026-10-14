import type { Core } from '@strapi/strapi';

const config = ({
  env,
}: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
  i18n: true,
  'users-permissions': {
    enabled: true,
  },
});

export default config;
