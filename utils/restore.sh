#!/bin/bash

set -euo pipefail

if [ "$#" -ne 1 ]; then
    echo "Usage: npm run restore -- <path_to_zip_file>"
    exit 1
fi

ZIP_FILE="$1"

if [ ! -f "$ZIP_FILE" ]; then
    echo "Error: File '$ZIP_FILE' does not exist."
    exit 1
fi

echo "Restoring from '$ZIP_FILE'..."
unzip -o "$ZIP_FILE" -d .

echo "Restore successful!"