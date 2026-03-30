FROM europe-north1-docker.pkg.dev/cgr-nav/pull-through/nav.no/node:24-slim@sha256:8364585e7b3deac23683c324c89cd9e729c659c6a6a5179876af736de3ea4646

WORKDIR /usr/src/app
COPY dist dist/
COPY server/build server/
COPY server/node_modules server/node_modules/

WORKDIR /usr/src/app/server

CMD ["server.js"]
