# puppet-catalog-graph-viewer

## General

basicly a copy of <https://gist.github.com/Sharpie/784266373d3f3232054a> bundled into a container.

## Build

```shell
docker build -t puppet-catalog-graph-viewer .
```

## Run

```shell
# run with demo data
docker run -it --rm -p 8080:80 puppet-catalog-graph-viewer
# or mount path with dot files
# file has to be named `catalog.json`
docker run -it --rm -p 8080:80 -v $(pwd):/usr/share/nginx/html/data puppet-catalog-graph-viewer
```
