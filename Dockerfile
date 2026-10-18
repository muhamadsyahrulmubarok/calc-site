# calc.syahrul.web.id — static site for Coolify
FROM nginx:1.27-alpine
COPY public/ /usr/share/nginx/html/
COPY deploy/nginx-docker.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
