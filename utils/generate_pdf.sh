#!/usr/bin/env bash

# Generates PDF files from presentations rendered in HTML by remark.js.

# Trap SIGINT (Ctrl+C) and SIGTERM to stop the script immediately
trap "exit 1" SIGINT SIGTERM

#######################################
# Generate PDF files from presentations rendered in HTML by remark.js. Firstly, it fetches slides from a base URL
# containing a list of all courses. For each course, it generates a PDF file with slides.
# Arguments:
#   Base URL
#   Output directory, must be inside the current directory
#   Optional course full name, the same as the label used in the list.
#   Optional slide number to print only that slide.
#######################################
function generate_pdf() {
    base_url="$1"
    output_dir="$2"
    selected_course_name="$3"
    selected_slide_number="$4"

    url_pattern="s/.*(\([^)]*\))/\1/p" # Used to extract URL to course from markdown list.
    name_pattern="s/^\- \[\([^]]*\)\](.*)/\1/p" # Used to extract name of the course from markdown list.
    list_item_pattern="^\- \[" # Used to match markdown enumeration entries from text.
    markdown_accept_header="Accept: text/markdown" # Accept header for fetching slides in markdown format.
    slides_root_dir="/slides" # Directory inside container used as binding mount.
    slides_resource="slides" # Name of the relative (to base URL) resource where slides in markdown format are available.
    materials_resource="Materials.md" # Name of the relative (to slides resource) resources with courses list.
    slides_extension="pdf" # Extension for output files with slides.
    uname_s="$(uname -s)"
    chrome_args=()

    case "${uname_s}" in
        MINGW*|MSYS*|CYGWIN*)
            ;;
        *)
            chrome_path="${CHROME_PATH}"
            if [ -z "${chrome_path}" ]; then
                chrome_path="$(command -v chromium-browser || command -v chromium || command -v google-chrome || command -v google-chrome-stable || command -v chrome)"
            fi

            if [ -z "${chrome_path}" ]; then
                echo "Error: Chrome/Chromium executable not found. Set CHROME_PATH or install chromium-browser."
                exit 1
            fi

            chrome_args=(--chrome-path "${chrome_path}")
            ;;
    esac

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

        # Add slide number suffix if specific slide is selected
        if [ -n "${selected_slide_number}" ]; then
            course_file="${output_dir}/${course_name}_slide${selected_slide_number}.${slides_extension}"
        fi

        # Check if the course matches the selected course name, if provided
        if [ -z "${selected_course_name}" ] || [ "${course_name}" = "${selected_course_name}" ]; then
            echo "Generating PDF for course: ${course_name}"
            
            # Add slide range parameter if specific slide is selected
            decktape_args=("${chrome_args[@]}")
            if [ -n "${selected_slide_number}" ]; then
                echo "Printing only slide #${selected_slide_number}"
                decktape_args+=(--slides "${selected_slide_number}")
            fi

            npx decktape \
                "${decktape_args[@]}" \
                "${course_url}" \
                "${course_file}"
            
            # Check if decktape finished successfully or was interrupted
            if [ $? -ne 0 ]; then
                echo "Generation error or interrupted (Ctrl+C). Exiting script."
                exit 1
            fi

            node utils/fix_pdf_agenda_links.js "${course_file}"
            if [ $? -ne 0 ]; then
                echo "Error during PDF agenda links conversion. Exiting script."
                exit 1
            fi
        fi
    done
}

#######################################
# Script main function. Generates PDF files from presentations rendered in HTML by remark.js.
# Arguments:
#   --port: Optional port number (default: 3000).
#   Optional course full name, the same as the label used in the list.
#   Optional slide number to print only that slide.
#######################################

DEFAULT_PORT=3000

function main() {
    local port="${DEFAULT_PORT}"
    local args=()

    while [ $# -gt 0 ]; do
        case "$1" in
            --port)
                port="$2"
                shift 2
                ;;
            *)
                args+=("$1")
                shift
                ;;
        esac
    done

    local base_url="http://localhost:${port}"

    curl -s --head "${base_url}" | head -n 1 | grep "200 OK" > /dev/null
    if [ $? -ne 0 ]; then
        echo "Error: ${base_url} is not running. Please start the server (npm run serve) before generating PDFs."
        exit 1
    fi

    generate_pdf "${base_url}" "dist" "${args[0]}" "${args[1]}"
}

main "$@"