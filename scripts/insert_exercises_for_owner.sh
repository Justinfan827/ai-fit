#! /bin/bash
 
# make sure we are at the git root of the project
if [ "$(git rev-parse --show-toplevel)" != "$(pwd)" ]; then
  echo "Error: This script must be run from the root of the project"
  exit 1
fi


# take owner id from command line
OWNER_ID=$1

# take postgrest url from command line
POSTGRES_URL=$2

# path to the exercises file
EXERCISES_FILE="./supabase/seed/02_seed_exercises.sql"

# TODO: this script
# replace the 5th column (owner_id) NULL with the owner id passed in as an arg
# e.g.
# INSERT INTO public.exercises (id, created_at, name, skill_requirement, owner_id, primary_trained_colloquial, primary_benefit) VALUES ('5d362f4e-95c9-4271-aeb7-f414d9f972ba', '2025-01-26 23:07:49.436436+00', 'Dumbbell Hammer Curl', NULL, NULL, 'Biceps', NULL);
# turns into
# INSERT INTO public.exercises (id, created_at, name, skill_requirement, owner_id, primary_trained_colloquial, primary_benefit) VALUES ('5d362f4e-95c9-4271-aeb7-f414d9f972ba', '2025-01-26 23:07:49.436436+00', 'Dumbbell Hammer Curl', NULL, '5d362f4e-95c9-4271-aeb7-f414d9f972ba', 'Biceps', NULL);

