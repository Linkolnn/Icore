#!/bin/bash

# Скрипт для проверки структуры проекта ИCore Messenger

echo "🔍 Проверка структуры проекта ИCore Messenger..."
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_exists() {
    if [ -e "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "${RED}✗${NC} $1 - НЕ НАЙДЕН"
        return 1
    fi
}

echo "📁 Корневые файлы:"
check_exists "README.md"
check_exists "QUICKSTART.md"
check_exists "PROJECT_STRUCTURE.md"
check_exists "docker-compose.yml"
check_exists ".gitignore"
echo ""

echo "🔧 Backend структура:"
check_exists "backend/package.json"
check_exists "backend/Dockerfile"
check_exists "backend/.env.example"
check_exists "backend/src/main.ts"
check_exists "backend/src/app.module.ts"
echo ""

echo "📦 Backend модули:"
check_exists "backend/src/modules/auth/auth.module.ts"
check_exists "backend/src/modules/users/users.module.ts"
check_exists "backend/src/modules/messages/messages.module.ts"
check_exists "backend/src/modules/chats/chats.module.ts"
check_exists "backend/src/modules/websocket/websocket.module.ts"
check_exists "backend/src/modules/webrtc/webrtc.module.ts"
check_exists "backend/src/modules/encryption/encryption.module.ts"
echo ""

echo "🎨 Frontend структура:"
check_exists "frontend/package.json"
check_exists "frontend/Dockerfile"
check_exists "frontend/.env.example"
check_exists "frontend/nuxt.config.ts"
check_exists "frontend/app/app.vue"
echo ""

echo "📂 Frontend папки:"
check_exists "frontend/app/pages"
check_exists "frontend/app/components"
check_exists "frontend/app/stores"
check_exists "frontend/app/composables"
check_exists "frontend/app/services"
check_exists "frontend/app/utils"
check_exists "frontend/app/assets/styles"
echo ""

echo "📚 Документация:"
check_exists "docs/ARCHITECTURE.md"
check_exists "docs/DEVELOPMENT.md"
echo ""

echo "🐳 Docker конфигурация:"
check_exists "backend/Dockerfile"
check_exists "backend/.dockerignore"
check_exists "frontend/Dockerfile"
check_exists "frontend/.dockerignore"
echo ""

echo -e "${GREEN}✅ Проверка завершена!${NC}"
echo ""
echo "📊 Статус зависимостей:"

if [ -d "backend/node_modules" ]; then
    echo -e "${GREEN}✓${NC} Backend: node_modules установлены"
else
    echo -e "${YELLOW}⚠${NC} Backend: node_modules не установлены (запустите: cd backend && yarn install)"
fi

if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}✓${NC} Frontend: node_modules установлены"
else
    echo -e "${YELLOW}⚠${NC} Frontend: node_modules не установлены (запустите: cd frontend && yarn install)"
fi

echo ""
echo "🚀 Проект готов к разработке!"
echo "📖 Смотрите QUICKSTART.md для инструкций по запуску"
