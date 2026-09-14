FROM europe-north1-docker.pkg.dev/cgr-nav/pull-through/nav.no/node:24-slim@sha256:1b4aec4aec42db8db308682ecb16c5e71da77225ea9635395b7b28bcdb938afa

WORKDIR /usr/src/app
COPY dist dist/
COPY server/build server/
COPY server/node_modules server/node_modules/

WORKDIR /usr/src/app/server

CMD ["server.js"]
