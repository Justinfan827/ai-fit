#!/bin/bash

# Default output file path if none is provided
DEFAULT_OUTPUT_FILE="./supabase/seeds/01_seed_exercises.sql"
OUTPUT_FILE=${1:-$DEFAULT_OUTPUT_FILE}

# Ensure the output directory exists
mkdir -p "$(dirname "$OUTPUT_FILE")"

# Run pg_dump, filter out only INSERT statements, and write directly to the output file
pg_dump -U postgres -h 127.0.0.1 -p 54322 -d postgres --no-owner -t exercises --data-only --column-inserts | grep -E '^INSERT INTO' > "$OUTPUT_FILE"

# Check if the command succeeded
if [ $? -ne 0 ]; then
  echo "Dump failed!"
  exit 1
fi

echo "Dump successful! INSERT statements saved to: $OUTPUT_FILE"
