# Slides UI

Web application for serving presentation slides prepared in Markdown format. Used for lectures conducted at the Faculty
of Electronics, Telecommunications and Informatics of Gdańsk University of Technology.

Forked from [Slides UI](https://git.pg.edu.pl/p650304/slides-ui) by Michał Wójcik.

[![MIT licensed][shield-mit]](LICENSE)

## Requirements

The list of tools required to run the project:

- npm
- Node

run:

```bash
npm install
```

to install all required dependencies.

The list of tools required for PDF printing:

- Docker

## Running

Before starting server run:

```bash
npm run init -- [course_name]
```

or

```bash
./create.sh [course_name]
```

to generate initial markdown files.

In order to start a server use:

```bash
npm run serve
```

or:

```bash
bash scan.sh && node server.js --port 8080 --src ./src
```

To stop server, use `CTRL` + `C`.

## PDF printing

For PDF printing use provided script:

```bash
./generate_pdf.sh
```

In order to print slides only for selected course use:

```bash
./generate_pdf.sh [course_name]
```

Value for `course_name` should be the same as label in `Materials.md` list. For example:

```bash
./generate_pdf.sh "My course"
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
