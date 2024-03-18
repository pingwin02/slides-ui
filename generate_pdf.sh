#!/usr/bin/env bash

# Generates PDF files from presentations rendered in HTML by remark.js.

#######################################
# Generate PDF files from presentations rendered in HTML by remark.js. Firstly it fetches slides from base URL containing
# list of all courses. Then for each course fetches list of all topics. Then for each topic it generates PDF file with
# slides.
# Arguments:
#   Base URL
#   Output directory, must be inside current directory
#   Optional course full name, same as label used in list.
#   Optional topic full name, as as label used in list.
#######################################
function generate_pdf() {
    base_url="$1"
    output_dir="$2"
    selected_course_name="$3"
    selected_topic_name="$4"

    url_pattern="s/.*(<\([^)]*\)>)/\1/p" # Used to extract URL to course or topic from markdown list.
    name_pattern="s/^\* \[\([^]]*\)\](.*)/\1/p" # Used to extract name of the course or topic from markdown list.
    list_item_pattern="^\*" # Used to markdown enumeration entries from text.
    markdown_accept_header="Accept: text/markdown" # Accept header for fetching slides in markdown format.
    slides_engine="remark" # JS engine used for slides rendering.
    slides_root_dir="/slides" # Directory inside container used as binding mount.
    slides_resource="slides" # Name of the relative (to base URL) resource where slides in markdown format are available.
    materials_resource="Materials.md" # Name of the relative (to slides resource) resources with courses list.
    slides_extension="pdf" # Extension for output files with slides.

    mkdir -p "${output_dir}"

    courses=$(curl -s -H "${markdown_accept_header}" "${base_url}/${slides_resource}/${materials_resource}")

    echo "${courses}" | grep "${list_item_pattern}" | while IFS= read -r course; do
        course_url="${base_url}/${slides_resource}/$(echo "${course}" | sed -n "${url_pattern}")"
        course_url="${course_url// /%20}"
        course_name="$(echo "${course}" | sed -n "${name_pattern}")"
        course_dir="${output_dir}/${course_name}"

        if [ -z "${selected_course_name}" ] || [ "${course_name}" = "${selected_course_name}" ]; then
            echo "Course: ${course_name}"

            mkdir "${course_dir}"

            topics=$(curl -s -H "${markdown_accept_header}" "${course_url}")

            echo "${topics}" | grep "${list_item_pattern}" | while IFS= read -r topic; do
                topic_url="${base_url}/${slides_resource}/${course_name}/$(echo "${topic}" | sed -n "${url_pattern}")"
                topic_url="${topic_url// /%20}"
                topic_name="$(echo "${topic}" | sed -n "${name_pattern}")"
                topic_file="${course_dir}/${topic_name}.${slides_extension}"

                if [ -z "${selected_topic_name}" ] || [ "${topic_name}" = "${selected_topic_name}" ]; then
                    echo "Topic: ${topic_name}"

                    docker run --rm -t \
                        -u "$(id -u):$(id -g)" \
                        -v "$(pwd):${slides_root_dir}" \
                        astefanutti/decktape \
                        "${slides_engine}" \
                        "${topic_url}" \
                        "${topic_file}"
                fi
            done
        fi
    done
}

#######################################
# Script main function. Generates PDF files from presentations rendered in HTML by remark.js.
# Arguments:
#   Optional course full name, same as label used in list.
#   Optional topic full name, as as label used in list.
#######################################
function main() {
    generate_pdf "http://$(hostname -I | awk '{print $1}'):8080" "dist" "$1" "$2"
}

main "$@"
