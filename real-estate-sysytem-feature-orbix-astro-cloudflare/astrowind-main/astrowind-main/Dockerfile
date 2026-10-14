# مرحلة البناء
FROM node:lts AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# إضافة متغيرات البيئة لمرحلة البناء
ARG PUBLIC_STRAPI_URL
ARG STRAPI_API_TOKEN
ARG CMS_FALLBACK_ALLOWED
ENV PUBLIC_STRAPI_URL=$PUBLIC_STRAPI_URL
ENV STRAPI_API_TOKEN=$STRAPI_API_TOKEN
ENV CMS_FALLBACK_ALLOWED=$CMS_FALLBACK_ALLOWED

RUN npm run build

# مرحلة التشغيل النهائية باستخدام Node.js
FROM node:lts AS runtime
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
ENV HOST=0.0.0.0
ENV PORT=8080
EXPOSE 8080
CMD ["node", "./dist/server/entry.mjs"]
