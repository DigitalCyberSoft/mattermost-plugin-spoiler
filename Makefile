PLUGIN_ID = com.github.mattermost-plugin-spoiler
PLUGIN_VERSION = 1.0.0
GO ?= $(shell command -v go 2>/dev/null)
NPM ?= $(shell command -v npm 2>/dev/null)

.PHONY: all server webapp bundle deploy clean

all: server webapp bundle

server:
	cd server && GOOS=linux GOARCH=amd64 CGO_ENABLED=0 $(GO) build -o dist/plugin-linux-amd64 .

webapp:
	cd webapp && $(NPM) install && $(NPM) run build

bundle:
	rm -rf dist
	mkdir -p dist/$(PLUGIN_ID)
	cp plugin.json dist/$(PLUGIN_ID)/
	mkdir -p dist/$(PLUGIN_ID)/server/dist
	cp server/dist/plugin-linux-amd64 dist/$(PLUGIN_ID)/server/dist/
	mkdir -p dist/$(PLUGIN_ID)/webapp/dist
	cp webapp/dist/main.js dist/$(PLUGIN_ID)/webapp/dist/
	cd dist && tar -czf $(PLUGIN_ID)-$(PLUGIN_VERSION).tar.gz $(PLUGIN_ID)

deploy:
	cp -r dist/$(PLUGIN_ID) /opt/mattermost/plugins/
	mkdir -p /opt/mattermost/client/plugins/$(PLUGIN_ID)
	cp webapp/dist/main.js /opt/mattermost/client/plugins/$(PLUGIN_ID)/

clean:
	rm -rf dist
	rm -rf server/dist
	rm -rf webapp/dist
	rm -rf webapp/node_modules
