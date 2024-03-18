# Slides UI

Web application for serving presentation slides prepared in Markdown format. Used for lectures conducted at the Faculty
of Electronics, Telecommunications and Informatics of Gdańsk University of Technology.

[![MIT licensed][shield-mit]](LICENSE)

## Requirements

The list of tools required to run the project without using containerization:

* npm 8
* Node 16

The list of tools required to run the project using containerization:

* Docker 24

The list of tools required for PDF printing:

* Docker 24

## Building

In order to build Docker image use provided script:

```bash
./build.sh
```

## Running

In order to run without using containerization use:

```bash
npm run serve
```

or:

```bash
node server.js --port 8080 --src ./src
```

In order to run using containerization use:

```bash
docker run --name "slides-ui" --rm -it -p "8080:8080" \
           -v "$(pwd)/src/slides:/opt/slides-ui/public_html/slides" \
           -v "$(pwd)/src/css/slides:/opt/slides-ui/public_html/css/slides" \
           "kask.eti.pg.edu.pl/slides-ui:0.0.1-SNAPSHOT"
```

or:

```bash
bash run.sh
```

To stop server, use `CTRL` + `C`.

Please be aware that if `src/slides` contains symbolic links (e.g. to store slides in different repository) those will
not work inside docker container. They must be mounted separately.

## PDF printing

For PDF printing use provided script:

```bash
bash generate_pdf.sh
```

In order to print slides only for selected course use:

```bash
bash generate_pdf.sh [course_name]
```

Value for `course_name` should be the same as label in `Materials.md` list. For example:

```bash
bash generate_pdf.sh "Examples"
```

In order to print slides only for selected topic use:

```bash
bash generate_pdf.sh [course_name [topic_name]]
```

Value for `course_name` should be the same as label in `Materials.md` list. Value for `topic_name` should be the same
as label in course list. For example:

```bash
bash generate_pdf.sh "Examples" "Slides Example"
```

## License

Project is licensed under the [MIT](LICENSE) license.

The jQuery, Mermaid and remark libraries shipped with this project ale licensed under the [MIT](LICENSE) license.

The Lato font is licenses under [Open Font License](src/fonts/Lato/OFL.txt).

The Ubuntu Mono font is licenses under [Ubuntu Font License](src/fonts/Ubuntu_Mono/UFL.txt).

The [PG logo horizontal color](src/img/pg_logo_horizontal_color.svg) and [PG logo white](src/img/pg_logo_white.svg)
files are property of Gdańsk University of Technology and are not shared under the project license.

## Author

Copyright &copy; 2020 - 2024, Michał (psysiu) Wójcik

[![][gravatar-psysiu]]()

[shield-mit]: https://img.shields.io/badge/license-MIT-blue.svg

[gravatar-psysiu]: https://s.gravatar.com/avatar/b61b36a5b97ca33e9d11d122c143b9f0
