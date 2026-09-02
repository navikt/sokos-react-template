FROM europe-north1-docker.pkg.dev/cgr-nav/pull-through/nav.no/node:24-slim@sha256:08165a24ea553e523a5bca1c69820126a068f4d6630a5d5bbbf8f8ffc6e83042

WORKDIR /usr/src/app
COPY dist dist/
COPY server/build server/
COPY server/node_modules server/node_modules/

WORKDIR /usr/src/app/server

CMD ["server.js"]
