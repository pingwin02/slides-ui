#!/usr/bin/env bash

# Runs docker container. Image must be firstly build with build.sh script.

#######################################
# Script main function. Runs docker container. Image must be firstly build with build.sh script.
# Arguments:
#   None.
#######################################
function main() {
    version="$(grep -n "org.opencontainers.image.version" Dockerfile | cut -f2 -d "=" | xargs)"
    docker run \
        --name "slides-ui" --rm -it -p "8080:8080" \
        -v "$(pwd)/src/slides:/opt/slides-ui/public_html/slides" \
        -v "$(pwd)/src/css/slides:/opt/slides-ui/public_html/css/slides" \
        "kask.eti.pg.edu.pl/slides-ui:${version}"
}

main "$@"
