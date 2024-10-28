#!/usr/bin/env bash

# Generates PDF files from presentations rendered in HTML by remark.js.

#######################################
# Generate PDF files from presentations rendered in HTML by remark.js. Firstly, it fetches slides from a base URL
# containing a list of all courses. For each course, it generates a PDF file with slides.
# Arguments:
#   Base URL
#   Output directory, must be inside the current directory
#   Optional course full name, the same as the label used in the list.
#######################################
function generate_pdf() {
    base_url="$1"
    output_dir="$2"
    selected_course_name="$3"

    url_pattern="s/.*(<\([^)]*\)>)/\1/p" # Used to extract URL to course from markdown list.
    name_pattern="s/^\* \[\([^]]*\)\](.*)/\1/p" # Used to extract name of the course from markdown list.
    list_item_pattern="^\*" # Used to match markdown enumeration entries from text.
    markdown_accept_header="Accept: text/markdown" # Accept header for fetching slides in markdown format.
    slides_root_dir="/slides" # Directory inside container used as binding mount.
    slides_resource="slides" # Name of the relative (to base URL) resource where slides in markdown format are available.
    materials_resource="Materials.md" # Name of the relative (to slides resource) resources with courses list.
    slides_extension="pdf" # Extension for output files with slides.

    # Ensure output directory exists
    mkdir -p "${output_dir}"

    # Fetch courses list
    courses=$(curl -s -H "${markdown_accept_header}" "${base_url}/${slides_resource}/${materials_resource}")

    # Loop through each course in the list
    echo "${courses}" | grep "${list_item_pattern}" | while IFS= read -r course; do
        course_url="${base_url}/${slides_resource}/$(echo "${course}" | sed -n "${url_pattern}")"
        course_url="${course_url// /%20}"
        course_name="$(echo "${course}" | sed -n "${name_pattern}")"
        course_file="${output_dir}/${course_name}.${slides_extension}"

        # Check if the course matches the selected course name, if provided
        if [ -z "${selected_course_name}" ] || [ "${course_name}" = "${selected_course_name}" ]; then
            echo "Generating PDF for course: ${course_name}"

            # Run Decktape to generate the PDF, with Windows-compatible path conversion
            docker run --rm -t \
                -u "$(id -u):$(id -g)" \
                -v "/$(pwd | sed 's|^C:/|c/|;s|\\|/|g'):${slides_root_dir}" \
                astefanutti/decktape \
                "${course_url}" \
                "${course_file}"
        fi
    done
}

#######################################
# Script main function. Generates PDF files from presentations rendered in HTML by remark.js.
# Arguments:
#   Optional course full name, the same as the label used in the list.
#######################################
function main() {
    generate_pdf "http://host.docker.internal:8080" "dist" "$1"
}

main "$@"
