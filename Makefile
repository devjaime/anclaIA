export UV_LINK_MODE=copy

.PHONY: install index run dev init-db \
        docker-up docker-down docker-logs docker-index

# ── Local (uv) ────────────────────────────────────────────────────────────────
install:
	uv sync

index:
	uv run python backend/mvp_downloader.py && uv run python backend/scraper_indexer.py

run:
	uv run uvicorn backend.query_diagnostic:app --reload --port 8000

dev:
	uv run uvicorn backend.query_diagnostic:app --reload --port 8000 & \
	cd frontend && npm install && npm run dev

init-db:
	uv run python backend/init_db.py

# ── Docker ────────────────────────────────────────────────────────────────────
# DOCKER_BUILDKIT=0: necesario en volúmenes FAT/exFAT (USB Kingston)
# En disco interno APFS/ext4 puedes quitar esta variable y los builds
# serán más rápidos con BuildKit activado.

docker-up:
	DOCKER_BUILDKIT=0 docker compose up --build -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

docker-index:
	DOCKER_BUILDKIT=0 docker compose run --rm backend sh -c \
		"python -m backend.mvp_downloader && python -m backend.scraper_indexer"
