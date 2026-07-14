# Dev Docker Container
FROM dhi.io/uv:0-debian-dev

RUN apt-get update \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /server

EXPOSE 8080

CMD ["uv", "run", "-m" "bankapi.main"]