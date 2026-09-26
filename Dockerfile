FROM europe-north1-docker.pkg.dev/cgr-nav/pull-through/nav.no/node:24-slim@sha256:963a44f04fe2ffc2d3bb9a5483bca868cdd7bb437e7a93b28ae8d6e3c99f22f3

WORKDIR /usr/src/app
COPY dist dist/
COPY server/build server/
COPY server/node_modules server/node_modules/

WORKDIR /usr/src/app/server

CMD ["server.js"]
