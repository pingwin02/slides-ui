#!/bin/bash

set -euo pipefail

BACKUP_DIR="backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d")

if [ "$#" -eq 0 ]; then
    echo "Usage: npm run backup -- <course_name | all>"
    exit 1
fi

TARGET="$1"

if [ "$TARGET" = "all" ]; then
    ZIP_NAME="$BACKUP_DIR/all_courses_$TIMESTAMP.zip"
    echo "Backing up all courses to $ZIP_NAME..."
    
    FILES_TO_ZIP=("src/slides/" "src/css/slides/")
    if [ -d "dist" ]; then
        FILES_TO_ZIP+=("dist/")
    fi
    
    zip -r "$ZIP_NAME" "${FILES_TO_ZIP[@]}"
else
    COURSE_NAME="$TARGET"
    ZIP_NAME="$BACKUP_DIR/${COURSE_NAME}_$TIMESTAMP.zip"
    
    if [ ! -d "src/slides/$COURSE_NAME" ]; then
        echo "Error: Course '$COURSE_NAME' does not exist."
        exit 1
    fi
    
    echo "Backing up course '$COURSE_NAME' to $ZIP_NAME..."
    
    FILES_TO_ZIP=("src/slides/$COURSE_NAME/" "src/css/slides/$COURSE_NAME/")
    
    if ls dist/${COURSE_NAME}*.pdf 1> /dev/null 2>&1; then
        for pdf_file in dist/${COURSE_NAME}*.pdf; do
            FILES_TO_ZIP+=("$pdf_file")
        done
    fi
    
    zip -r "$ZIP_NAME" "${FILES_TO_ZIP[@]}"
fi

echo "Backup successful: $ZIP_NAME"