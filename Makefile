# VentaSV — Expo / React Native
# Uso: make <comando>

.PHONY: dev clean android ios build-android build-preview update logs

# ── Desarrollo ──────────────────────────────────────────
dev:
	npx expo start

dev-clear:
	npx expo start --clear

tunnel:
	npx expo start --tunnel

# ── Dispositivos ────────────────────────────────────────
android:
	npx expo start --android

ios:
	npx expo start --ios

# ── Builds EAS ──────────────────────────────────────────
build-preview:
	eas build -p android --profile preview

build-prod:
	eas build -p android --profile production

build-ios:
	eas build -p ios --profile production

# ── OTA Updates ─────────────────────────────────────────
update:
	eas update --branch production --message "$(m)"

update-preview:
	eas update --branch preview --message "$(m)"

# ── Mantenimiento ───────────────────────────────────────
clean:
	rm -rf node_modules/.cache .expo
	npx expo start --clear

install:
	npm install

logs-android:
	npx react-native log-android

# ── Info ────────────────────────────────────────────────
help:
	@echo ""
	@echo "  make dev             Iniciar Expo"
	@echo "  make dev-clear       Iniciar limpiando caché"
	@echo "  make tunnel          Expo con túnel (redes restrictivas)"
	@echo "  make android         Abrir en Android"
	@echo "  make build-preview   APK de prueba vía EAS"
	@echo "  make build-prod      Build de producción Android"
	@echo "  make update m='msg'  OTA update a producción"
	@echo "  make clean           Limpiar caché"
	@echo ""