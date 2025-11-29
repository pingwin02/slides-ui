#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: $0 <course-name>"
    exit 1
fi

ARG="$1"

mkdir -p "src/css/slides/$ARG"
mkdir -p "src/slides/$ARG/assets"

touch "src/css/slides/$ARG/styles.css"

cat <<EOL > "src/slides/$ARG/$ARG.md"
# $ARG

---

## Use src/css/slides/$ARG/styles.css for custom styling
EOL

echo "Files and directories for '$ARG' have been created."