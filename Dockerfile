# Dockerfile for Jingo

FROM node:0.10
MAINTAINER Justin Long <crockpotveggies@users.noreply.github.com>

# Bundle the app
ADD . /src

# Install app dependencies
RUN cd /src; npm install

EXPOSE  80

RUN chmod +x /src/jingo
RUN mkdir /src/data

# use environment variables to set git credentials

RUN echo 'echo "machine $GITMACHINE \n login $GITLOGIN \n password $GITPASS" >> /root/.netrc' >> /script.sh
RUN echo 'git config --global user.email "$GITEMAIL"' >> /script.sh
RUN echo 'git config --global user.name "$GITNAME"' >> /script.sh
RUN chmod +x script.sh

ENTRYPOINT /script.sh && /src/jingo -c /src/data/config.yaml