FROM europe-north1-docker.pkg.dev/cgr-nav/pull-through/nav.no/node:24-slim@sha256:ebd2a106cd8a20da79b7e779040f725f2ddb62ede5beac78bcc7bc065146840f

WORKDIR /usr/src/app
COPY dist dist/
COPY server/build server/
COPY server/node_modules server/node_modules/

WORKDIR /usr/src/app/server

CMD ["server.js"]
