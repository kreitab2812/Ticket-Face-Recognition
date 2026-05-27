# Stage 1: Build ung dung React bang Node.js
FROM node:22-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Phuc vu cac file tinh bang Nginx (Sieu nhe)
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# FIX BUG 404 REACT ROUTER: Them cau hinh try_files de Nginx dieu huong dung
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
