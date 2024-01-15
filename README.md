# Slides UI

Web application for serving presentation slides prepared in Markdown format. Used for lectures conducted at the Faculty
of Electronics, Telecommunications and Informatics of Gdańsk University of Technology.

[![MIT licensed][shield-mit]](LICENSE)

## Requirements

The list of tools required to build and run the project:

* npm 8
* Node 16

## Building

In order to build Docker image use provided script:

```bash
./build.sh
```

## Running

In order to run use:

```bash
npm run serve
```

or:

```bash
node server.js --port 8080 --src ./src
```

In order to run using Docker use:

```bash
docker run --name "slides-ui" --rm -it --init -p "8080:8080" \
           -v "$(pwd)/src/slides:/opt/slides-ui/public_html/slides" \
           -v "$(pwd)/src/css/slides:/opt/slides-ui/public_html/css/slides" \
           "kask.eti.pg.edu.pl/slides-ui:0.0.1-SNAPSHOT"
```

Please be aware that if `src/slides` contains symbolic links (e.g. to store slides in different repository) those will
not work inside docker container. They must be mounted separately.

## PDF printing

For PDF printing use provided script:

```bash
./generate_pdf.sh
```

## License

Project is licensed under the [MIT](LICENSE) license.

The jQuery, Mermaid and remark libraries shipped with this project ale licenses under the [MIT](LICENSE) license.

The Lato font is licenses under [Open Font License](src/fonts/Lato/OFL.txt).

The Ubuntu Mono font is licenses under [Ubuntu Font License](src/fonts/Ubuntu_Mono/UFL.txt).

The [PG logo horizontal color](src/img/pg_logo_horizontal_color.svg) and [PG logo white](src/img/pg_logo_white.svg)
files are property of Gdańsk University of Technology and are not shared under the project license.

## Author

Copyright &copy; 2020 - 2024, Michał (psysiu) Wójcik

[![][gravatar-psysiu]]()

[shield-mit]: https://img.shields.io/badge/license-MIT-blue.svg

[gravatar-psysiu]: https://s.gravatar.com/avatar/b61b36a5b97ca33e9d11d122c143b9f0
