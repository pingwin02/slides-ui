#!/bin/bash
slides_dir="src/slides"

index_file="$slides_dir/Materials.md"
echo "# Materials" > $index_file
echo "" >> $index_file
echo "## Courses menu on second slide" >> $index_file
echo "" >> $index_file
echo "---" >> $index_file
echo "" >> $index_file
echo "## Courses" >> $index_file
echo "" >> $index_file
echo "Courses:" >> $index_file
echo "" >> $index_file

for dir in "$slides_dir"/*/; do
    if [ -d "$dir" ]; then
        dir_name=$(basename "$dir")
        md_file=$(find "$dir" -maxdepth 1 -name "*.md" | head -n 1)
        if [ -n "$md_file" ]; then
            md_file_name=$(basename "$md_file")
            echo "* [$dir_name](<$dir_name/$md_file_name>)" >> $index_file
        fi
    fi
done