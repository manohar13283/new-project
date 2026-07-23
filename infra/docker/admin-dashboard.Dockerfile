# syntax=docker/dockerfile:1
FROM node:20-alpine AS build
WORKDIR /app
COPY admin-dashboard/package*.json ./
RUN npm install
COPY admin-dashboard/ ./
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY infra/docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
