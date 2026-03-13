#!/bin/bash

set -euo pipefail

usage() {
    echo "Usage: $0 [--delete] <course-name>"
}

DELETE_MODE=false
COURSE_NAME=""

for arg in "$@"; do
    case "$arg" in
        --delete)
            DELETE_MODE=true
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        *)
            if [ -z "$COURSE_NAME" ]; then
                COURSE_NAME="$arg"
            else
                echo "Error: too many arguments."
                usage
                exit 1
            fi
            ;;
    esac
done

if [ -z "$COURSE_NAME" ]; then
    usage
    exit 1
fi

CSS_DIR="src/css/slides/$COURSE_NAME"
SLIDES_DIR="src/slides/$COURSE_NAME"
PDF_FILE="dist/${COURSE_NAME}.pdf"
MARKDOWN_FILE="$SLIDES_DIR/$COURSE_NAME.md"

if [ "$DELETE_MODE" = true ]; then
    if [ "$COURSE_NAME" = "." ] || [ "$COURSE_NAME" = ".." ] || [ "$COURSE_NAME" = "/" ]; then
        echo "Error: invalid course name '$COURSE_NAME'."
        exit 1
    fi

    if [ -d "$CSS_DIR" ]; then
        rm -rf "$CSS_DIR"
    fi

    if [ -d "$SLIDES_DIR" ]; then
        rm -rf "$SLIDES_DIR"
    fi

    if [ -f "$PDF_FILE" ]; then
        rm -f "$PDF_FILE"
    fi

    echo "Files and directories for '$COURSE_NAME' have been removed."
    exit 0
fi

mkdir -p "$CSS_DIR"
mkdir -p "$SLIDES_DIR/assets"

touch "$CSS_DIR/styles.css"

cat <<EOL > "$MARKDOWN_FILE"
# $COURSE_NAME

## Use src/css/slides/$COURSE_NAME/styles.css for custom styling

Author: **[Your Name]**

---

## Section 1

---

### Title Slide 1

Lorem ipsum dolor sit amet, consectetur adipiscing elit.

---

## Section 2

---

### Title Slide 2

Aliquam ipsum nunc, tempus in nulla vel, euismod maximus est.

---

Praesent quam neque, condimentum eget quam et, dignissim porta justo.

EOL

echo "Files and directories for '$COURSE_NAME' have been created."