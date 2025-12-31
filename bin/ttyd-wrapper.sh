#!/bin/bash
# ttyd wrapper script that accepts working directory as parameter
# Usage: ttyd-wrapper.sh [working_directory]

WORKING_DIR="${1:-/opt/kms}"

# Ensure directory exists
if [ ! -d "$WORKING_DIR" ]; then
    echo "Error: Directory $WORKING_DIR does not exist" >&2
    exit 1
fi

# Start bash with cd to working directory
exec /usr/bin/ttyd \
    --port 7681 \
    --interface 127.0.0.1 \
    --writable \
    -w "$WORKING_DIR" \
    bash
