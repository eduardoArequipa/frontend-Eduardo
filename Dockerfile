# --- Etapa 1: Construcción con Node.js ---
FROM node:18-alpine as build
WORKDIR /app
# Copiamos los archivos de definición de paquetes
COPY package.json package-lock.json ./
# Instalamos dependencias
RUN npm install
# Copiamos el código fuente
COPY . .
# Construimos la versión de producción
RUN npm run build

# --- Etapa 2: Servidor Nginx ---
FROM nginx:alpine
# Copiamos los archivos construidos desde la etapa anterior
# NOTA: Si usas Vite en vez de Create-React-App, cambia '/app/build' por '/app/dist' abajo:
COPY --from=build /app/dist /usr/share/nginx/html
# Copiamos nuestra configuración personalizada de Nginx creada en el paso anterior
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
