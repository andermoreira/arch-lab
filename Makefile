.PHONY: setup test test-arch test-unit lint build docker-up docker-down docker-test clean help

help:
	@echo "Comandos disponíveis no arch-lab:"
	@echo "  make setup        - Instala dependências do projeto"
	@echo "  make test         - Executa todos os testes unitários e de arquitetura"
	@echo "  make test-arch    - Executa apenas as Fitness Functions de arquitetura"
	@echo "  make test-unit    - Executa os testes de domínio, CQRS, Sagas e resiliência"
	@echo "  make lint         - Valida tipos estáticos via TypeScript compiler"
	@echo "  make build        - Compila os laboratórios para dist/"
	@echo "  make docker-up    - Sobe o ambiente completo com Postgres 16 e Redis 7"
	@echo "  make docker-down  - Encerra os contêineres e limpa recursos"
	@echo "  make docker-test  - Executa a suíte de testes dentro do contêiner Docker"
	@echo "  make clean        - Remove dist/ e relatórios de cobertura"

setup:
	npm install

test:
	npm test

test-arch:
	npm run test:arch

test-unit:
	npm run test:unit

lint:
	npm run lint

build:
	npm run build

docker-up:
	docker compose up -d

docker-down:
	docker compose down -v

docker-test:
	docker compose run --rm app npm test

clean:
	npm run clean
