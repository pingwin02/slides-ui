FROM node:16.20.2

LABEL org.opencontainers.image.authors="Michał (psysiu) Wójcik"
LABEL org.opencontainers.image.source="https://git.pg.edu.pl/p650304/slides-ui"
LABEL org.opencontainers.image.url="https://git.pg.edu.pl/p650304/slides-ui"
LABEL org.opencontainers.image.vendor="Michał (psysiu) Wójcik"
LABEL org.opencontainers.image.version="0.0.1-SNAPSHOT"
LABEL org.opencontainers.image.description="Web application for serving presentation slides prepared in Markdown format. \
Used for lectures conducted at the Faculty of Electronics, Telecommunications and Informatics of Gdańsk University of Technology."
LABEL org.opencontainers.image.licenses="MIT"

LABEL build_version=""
LABEL maintainer=""

ENV VERSION="0.0.1-SNAPSHOT"

RUN mkdir -p /opt/slides-ui/public_html/css

ADD src/css/main.css /opt/slides-ui/public_html/css/
ADD src/fonts /opt/slides-ui/public_html/fonts
ADD src/img /opt/slides-ui/public_html/img
ADD src/js /opt/slides-ui/public_html/js
ADD src/md /opt/slides-ui/public_html/md
ADD src/index.html /opt/slides-ui/public_html/
ADD server.js /opt/slides-ui/

VOLUME /opt/slides-ui/public_html/slides
VOLUME /opt/slides-ui/public_html/css/slides

EXPOSE 8080

CMD ["/opt/slides-ui/server.js", "--port", "8080", "--src", "/opt/slides-ui/public_html"]
