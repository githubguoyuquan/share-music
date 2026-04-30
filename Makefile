# Local workflows use npm; Docker targets wrap Compose (OrbStack / Docker Desktop).

.PHONY: help install dev build start lint test clean prisma-generate db-prepare db-up seed
.PHONY: docker-build docker-up docker-down docker-rebuild docker-logs docker-ps docker-seed docker-compose-config

COMPOSE ?= docker compose

# `make` runs recipes with `/bin/sh` and a minimal PATH, so `npm` from nvm/fnm/Homebrew
# is often missing ("No such file or directory"). Use login zsh so ~/.zprofile/.zshrc apply.
_ZSH_LC := /usr/bin/env zsh -lic

.DEFAULT_GOAL := help

help:
	@echo "share-music — targets:"
	@echo ""
	@echo "  Local development:"
	@echo "    make install          npm ci"
	@echo "    make dev              npm run dev"
	@echo "    make build            npm run build"
	@echo "    make start            npm run start (after build)"
	@echo "    make lint             npm run lint"
	@echo "    make test             npm run test"
	@echo "    make prisma-generate  npx prisma generate"
	@echo "    make db-up            scripts/ensure-local-db.sh"
	@echo "    make db-prepare       db-up + prisma db push"
	@echo "    make seed             npm run seed (needs DATABASE_URL)"
	@echo "    make clean            rm -rf .next"
	@echo ""
	@echo "  Docker Compose (.env with JWT_SECRET; copy docker.env.example):"
	@echo "    make docker-build     compose build app image"
	@echo "    make docker-up        compose up -d"
	@echo "    make docker-down      compose down"
	@echo "    make docker-rebuild   compose build --no-cache + up -d"
	@echo "    make docker-logs      compose logs -f app"
	@echo "    make docker-ps        compose ps"
	@echo "    make docker-seed      compose exec app npm run seed"
	@echo "    make docker-compose-config   compose config (sanity check)"

install:
	$(_ZSH_LC) 'cd "$(CURDIR)" && npm ci'

dev:
	$(_ZSH_LC) 'cd "$(CURDIR)" && npm run dev'

build:
	$(_ZSH_LC) 'cd "$(CURDIR)" && npm run build'

start:
	$(_ZSH_LC) 'cd "$(CURDIR)" && npm run start'

lint:
	$(_ZSH_LC) 'cd "$(CURDIR)" && npm run lint'

test:
	$(_ZSH_LC) 'cd "$(CURDIR)" && npm run test'

clean:
	rm -rf .next

prisma-generate:
	$(_ZSH_LC) 'cd "$(CURDIR)" && npx prisma generate'

db-up:
	$(_ZSH_LC) 'cd "$(CURDIR)" && npm run db:up'

db-prepare:
	$(_ZSH_LC) 'cd "$(CURDIR)" && npm run db:prepare'

seed:
	$(_ZSH_LC) 'cd "$(CURDIR)" && npm run seed'

docker-build:
	$(COMPOSE) build

docker-up:
	$(COMPOSE) up -d

docker-down:
	$(COMPOSE) down

docker-rebuild:
	$(COMPOSE) build --no-cache
	$(COMPOSE) up -d

docker-logs:
	$(COMPOSE) logs -f app

docker-ps:
	$(COMPOSE) ps

docker-seed:
	$(COMPOSE) exec app npm run seed

docker-compose-config:
	$(COMPOSE) config
