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

# use environment variables to set git credentials
ENTRYPOINT echo "machine $GITMACHINE \n login $GITLOGIN \n password $GITPASS" >> ~/.netrc && git config --global user.email "$GITEMAIL" &&  git config --global user.name "$GITNAME" && /src/jingo -c /src/data/config.yaml