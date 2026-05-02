# Local Node only — uses npm; see README.md.

.PHONY: help install dev build start lint test clean prisma-generate db-push db-prepare db-up seed

# `make` runs recipes with `/bin/sh` and a minimal PATH, so `npm` from nvm/fnm/Homebrew
# is often missing ("No such file or directory"). Use login zsh so ~/.zprofile/.zshrc apply.
_ZSH_LC := /usr/bin/env zsh -lic

.DEFAULT_GOAL := help

help:
	@echo "share-music — local Node dev (DB = DATABASE_URL, usually hosted Postgres):"
	@echo "  make install          npm ci"
	@echo "  make dev              npm run dev"
	@echo "  make build | make start"
	@echo "  make lint | make test"
	@echo "  make prisma-generate  npx prisma generate"
	@echo "  make db-prepare       prisma db push（对齐远端 schema，需有效的 DATABASE_URL）"
	@echo "  make seed             npm run seed"
	@echo "  make clean            rm -rf .next"
	@echo ""
	@echo "Optional — only if you insist on Postgres on this machine:"
	@echo "  make db-up            Podman 容器或检测本机 :5432（见 scripts/ensure-local-db.sh）"

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

db-push db-prepare:
	$(_ZSH_LC) 'cd "$(CURDIR)" && npm run db:prepare'

db-up:
	$(_ZSH_LC) 'cd "$(CURDIR)" && npm run db:up'

seed:
	$(_ZSH_LC) 'cd "$(CURDIR)" && npm run seed'
