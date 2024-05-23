FROM nginx:latest

LABEL org.opencontainers.image.authors="info@betadots.de"

COPY entrypoint.sh /
COPY files/ /usr/share/nginx/html/
COPY files/data /usr/share/nginx/html/data

ENTRYPOINT [ "/entrypoint.sh" ]
