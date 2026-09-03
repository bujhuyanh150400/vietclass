.DEFAULT_GOAL := help
SHELL := /bin/bash

COMPOSE := docker compose --env-file .env.dev -f compose.dev.yml

.PHONY: help dev-init setup-app-dev dev dev-down

help: ## Show available development commands.
	@awk 'BEGIN {FS = ":.*##"; printf "Usage:\n  make \033[36m<target>\033[0m\n\nTargets:\n"} /^[a-zA-Z0-9_-]+:.*##/ {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

dev-init: ## Install app dependencies and start Docker development infrastructure.
	@test -f .env.dev || cp .env.dev.example .env.dev
	@(cd api && composer install --no-interaction --prefer-dist)
	@(cd frontend && npm ci)
	@$(COMPOSE) pull
	@$(COMPOSE) up -d
	@$(COMPOSE) ps

setup-app-dev: dev-init ## Bootstrap the API and frontend applications for development.
	@test -f api/.env || cp api/.env.example api/.env
	@if ! grep -Eq '^APP_KEY=.+$$' api/.env; then (cd api && php artisan key:generate --ansi); fi
	@$(COMPOSE) up -d --wait
	@set -a; . .env.dev; set +a; \
		(cd api && \
			DB_CONNECTION=pgsql \
			DB_HOST=127.0.0.1 \
			DB_PORT="$$POSTGRES_PORT" \
			DB_DATABASE="$$POSTGRES_DB" \
			DB_USERNAME="$$POSTGRES_USER" \
			DB_PASSWORD="$$POSTGRES_PASSWORD" \
			php artisan migrate --force)
	@(cd frontend && npm run build)

# Start the local API and frontend together and clean them up on exit.
#
# The app and the API live on separate hostnames here (see frontend/.env.example) so
# the session cookie is exercised cross-origin the way production will be.
#
# Both servers therefore bind DEV_BIND_HOST, 0.0.0.0 by default: a server bound to the
# loopback inside WSL2 is reachable only as "localhost", so a browser on the Windows
# host cannot reach it under any other hostname. On native Linux or macOS set
# DEV_BIND_HOST=127.0.0.1 in .env.dev. DEV_API_PORT keeps the API off a port another
# local project may already hold.
dev: ## Start infrastructure, Laravel API, and Next.js frontend.
	@$(COMPOSE) up -d
	@set -Eeuo pipefail; \
		. .env.dev; \
		bind_host="$${DEV_BIND_HOST:-0.0.0.0}"; \
		api_port="$${DEV_API_PORT:-8001}"; \
		printf 'App:  %s\nAPI:  %s\n\n' \
			"$$(sed -n 's/^APP_ORIGIN=//p' frontend/.env.local 2>/dev/null | head -1)" \
			"$$(sed -n 's/^NEXT_PUBLIC_API_ORIGIN=//p' frontend/.env.local 2>/dev/null | head -1)"; \
		api_pid=; \
		frontend_pid=; \
		trap 'if [[ -n "$$api_pid" ]]; then kill "$$api_pid" 2>/dev/null || true; fi; if [[ -n "$$frontend_pid" ]]; then kill "$$frontend_pid" 2>/dev/null || true; fi' EXIT; \
		trap 'if [[ -n "$$api_pid" ]]; then kill "$$api_pid" 2>/dev/null || true; fi; if [[ -n "$$frontend_pid" ]]; then kill "$$frontend_pid" 2>/dev/null || true; fi; exit 0' INT TERM; \
		(cd api && \
			DB_CONNECTION=pgsql \
			DB_HOST=127.0.0.1 \
			DB_PORT="$$POSTGRES_PORT" \
			DB_DATABASE="$$POSTGRES_DB" \
			DB_USERNAME="$$POSTGRES_USER" \
			DB_PASSWORD="$$POSTGRES_PASSWORD" \
			php artisan serve --host="$$bind_host" --port="$$api_port") & api_pid=$$!; \
		(cd frontend && npm run dev -- -H "$$bind_host") & frontend_pid=$$!; \
		if ((BASH_VERSINFO[0] > 4 || (BASH_VERSINFO[0] == 4 && BASH_VERSINFO[1] >= 3))); then \
			wait -n "$$api_pid" "$$frontend_pid"; \
		else \
			wait "$$api_pid" "$$frontend_pid"; \
		fi

dev-down: ## Stop Docker development infrastructure and preserve volumes.
	@$(COMPOSE) down
