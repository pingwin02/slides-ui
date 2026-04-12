# Slides UI

Web application for serving presentation slides prepared in Markdown format. Used for lectures conducted at the Faculty
of Electronics, Telecommunications and Informatics of Gdańsk University of Technology.

Forked from [Slides UI](https://git.pg.edu.pl/p650304/slides-ui) by Michał Wójcik.

[![MIT licensed][shield-mit]](LICENSE)

## Requirements

The list of tools required to run the project:

- npm
- Node
- zip (for backups)
- unzip (for restoring backups)

run:

```bash
npm install
```

to install all required dependencies.

## Running

Before starting server run:

```bash
npm run init -- [course_name]
```

to generate initial markdown files.

To remove generated course files, use:

```bash
npm run delete -- [course_name]
```

In order to start a server use:

```bash
npm start
```

Optional port number can be provided as an argument:

```bash
npm start -- [port_number]
```

To stop server, use `CTRL` + `C`.

## Title Slide Control Tags

Optional title-slide HTML comments can enable automatic presentation features:

- `<!-- agenda -->` enables automatic agenda with sections and slide titles,
- `<!-- agenda-sections -->` enables automatic agenda with sections only,
- `<!-- dynamic-text -->` enables dynamic typography, compact text/list spacing, and vertical centering for suitable text/table/image/mermaid slides.

## PDF printing

For PDF printing use:

```bash
npm run print
```

To use a custom port (must match the running server):

```bash
npm run print -- --port [port_number]
```

To print slides only for selected course use:

```bash
npm run print -- [course_name]
```

To print only selected slide or range of slides use:

```bash
npm run print -- [course_name] [slide_range]
```

Both options can be combined:

```bash
npm run print -- [course_name] [slide_range] --port [port_number]
```

Value for `course_name` should be the same as label in `Materials.md` list.

## Backup and Restore

To create a backup of a specific course, run:

```bash
npm run backup -- [course_name]
```

To create a backup of all courses, use:

```bash
npm run backup -- all
```

Backups are saved as ZIP archives in the `backups` directory.

To restore a backup from a ZIP archive, run:

```bash
npm run restore -- [path_to_zip_file]
```

## License

Project is licensed under the [MIT](LICENSE) license.

The jQuery, Mermaid and remark libraries shipped with this project are licensed under the [MIT](LICENSE) license.

The Lato font is licensed under [Open Font License](src/fonts/Lato/OFL.txt).

The Ubuntu Mono font is licensed under [Ubuntu Font License](src/fonts/Ubuntu_Mono/UFL.txt).

The [PG logo horizontal color](src/img/pg_logo_horizontal_color.svg) and [PG logo white](src/img/pg_logo_white.svg)
files are property of Gdańsk University of Technology and are not shared under the project license.

## Author

Copyright &copy; 2020 - 2024, Michał (psysiu) Wójcik

[![][gravatar-psysiu]]()

[shield-mit]: https://img.shields.io/badge/license-MIT-blue.svg
[gravatar-psysiu]: https://s.gravatar.com/avatar/b61b36a5b97ca33e9d11d122c143b9f0
