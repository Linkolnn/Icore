# 🚀 Docker Quick Start - Быстрый старт

> Минимальная инструкция для запуска проекта через Docker

---

## 📦 Установка Docker (Arch Linux)

```bash
# 1. Установить Docker
sudo pacman -S docker docker-compose

# 2. Запустить Docker service
sudo systemctl start docker
sudo systemctl enable docker

# 3. Добавить себя в группу docker
sudo usermod -aG docker $USER

# 4. ВАЖНО: Перезайти в систему!
# Выйти и войти обратно

# 5. Проверить (без sudo!)
docker --version
docker-compose --version
docker ps
```

---

## 🎯 Запуск проекта

```bash
# Перейти в проект
cd /home/linkoln/Project/Icore

# Запустить всё (первый раз долго)
docker-compose up

# ИЛИ запустить в фоне
docker-compose up -d
```

---

## ✅ Проверка

После запуска откройте:

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **MongoDB**: `docker-compose exec mongodb mongosh -u admin -p password123`
- **Redis**: `docker-compose exec redis redis-cli`

---

## 📋 Частые команды

```bash
# Остановить
docker-compose down

# Посмотреть логи
docker-compose logs -f

# Логи одного сервиса
docker-compose logs -f backend

# Перезапустить сервис
docker-compose restart backend

# Пересобрать и перезапустить
docker-compose up -d --build backend

# Список контейнеров
docker ps
```

---

## 🐛 Проблемы?

**Порт занят?**
```bash
sudo lsof -i :3001
sudo kill -9 <PID>
```

**Permission denied?**
```bash
# Убедитесь что в группе docker
groups | grep docker

# Если нет - добавьте и перезайдите
sudo usermod -aG docker $USER
```

**Изменения не применяются?**
```bash
docker-compose up -d --build
```

---

## 📚 Подробное руководство

Смотрите: [`learning/Docker_Guide.md`](./learning/Docker_Guide.md)

---

**Запустили? Переходите к Day 1!** 🎉
