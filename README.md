# puppet-dot-file-viewer

## General

basicly a copy of <https://gist.github.com/Sharpie/784266373d3f3232054a> bundled into a container.

## Build

```shell
docker build -t puppet-dot-file-viewer .
```

## Run

```shell
# run with demo data
docker run --rm -p 8080:80 puppet-dot-file-viewer
# or mount path with dot files
# file has to be named `catalog.dot`
docker run --rm -p 8080:80 -v $(pwd):/usr/share/nginx/html/data puppet-dot-file-viewer
```
