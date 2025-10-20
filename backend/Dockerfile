FROM node:20-alpine

WORKDIR /app

# Копируем package.json и yarn.lock
COPY package.json yarn.lock ./

# Устанавливаем зависимости
RUN yarn install --frozen-lockfile

# Копируем исходники
COPY . .

# Открываем порт
EXPOSE 3001

# Команда запуска (переопределяется в docker-compose)
CMD ["yarn", "start:dev"]
