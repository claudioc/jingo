# Dockerfile for Jingo

FROM node:0.10-onbuild
MAINTAINER Justin Long <crockpotveggies@users.noreply.github.com>

# Bundle the app
ADD . /src

# Install app dependencies
RUN cd /src; npm install

EXPOSE  80

RUN chmod +x /src/jingo
RUN mkdir /src/data

ENTRYPOINT /src/jingo -c /src/data/config.yaml