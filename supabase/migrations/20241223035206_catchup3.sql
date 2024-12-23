create extension if not exists "pg_trgm" with schema "public" version '1.6';

alter table "public"."programs" drop constraint "workout_plans_user_id_fkey";

alter table "public"."workout_rows" drop constraint "workout_rows_pkey1";

drop index if exists "public"."workout_rows_pkey1";

drop index if exists "public"."workout_rows_pkey";

create table "public"."exercises" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "name" text not null,
    "target_muscles" jsonb,
    "skill" text,
    "range_of_motion" text,
    "body_region" text,
    "owner_id" uuid,
    "modifiers" jsonb
);


create table "public"."trainer_assigned_programs" (
    "id" uuid not null default gen_random_uuid(),
    "client_id" uuid not null default gen_random_uuid(),
    "trainer_id" uuid not null default gen_random_uuid(),
    "program_id" uuid not null default gen_random_uuid()
);


alter table "public"."programs" add column "is_template" boolean not null;

alter table "public"."programs" add column "template_id" uuid;

alter table "public"."users" add column "metadata" jsonb;

alter table "public"."users" add column "trainer_id" uuid;

ALTER TABLE "public"."workout_rows" ADD COLUMN "uuid_id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "public"."workout_rows" ADD CONSTRAINT "workout_rows_pkey" PRIMARY KEY ("uuid_id");
ALTER TABLE "public"."workout_rows" DROP COLUMN "id";
ALTER TABLE "public"."workout_rows" RENAME COLUMN "uuid_id" TO "id";

CREATE UNIQUE INDEX exercises_pkey ON public.exercises USING btree (id);

CREATE INDEX idx_exercises_name_trgm ON public.exercises USING gist (name gist_trgm_ops);

CREATE UNIQUE INDEX trainer_assigned_programs_pkey ON public.trainer_assigned_programs USING btree (id);


alter table "public"."exercises" add constraint "exercises_pkey" PRIMARY KEY using index "exercises_pkey";
alter table "public"."trainer_assigned_programs" add constraint "trainer_assigned_programs_pkey" PRIMARY KEY using index "trainer_assigned_programs_pkey";
alter table "public"."exercises" add constraint "exercises_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE not valid;
alter table "public"."programs" add constraint "programs_template_id_fkey" FOREIGN KEY (template_id) REFERENCES programs(id) not valid;
alter table "public"."programs" add constraint "programs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;
alter table "public"."trainer_assigned_programs" add constraint "trainer_assigned_programs_client_id_fkey" FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE not valid;
alter table "public"."trainer_assigned_programs" add constraint "trainer_assigned_programs_program_id_fkey" FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE not valid;
alter table "public"."trainer_assigned_programs" add constraint "trainer_assigned_programs_trainer_id_fkey" FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE SET NULL not valid;
alter table "public"."users" add constraint "users_trainer_id_fkey" FOREIGN KEY (trainer_id) REFERENCES users(id) not valid;


CREATE OR REPLACE FUNCTION public.search_exercises_by_name(exercise_name text, threshold double precision)
 RETURNS TABLE(id uuid, created_at timestamp with time zone, name text, target_muscles jsonb, skill text, range_of_motion text, body_region text, owner_id uuid, modifiers jsonb, sim_score double precision)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT e.id, e.created_at, e.name, e.target_muscles, e.skill, e.range_of_motion, e.body_region, e.owner_id, e.modifiers,
           similarity(
               LOWER(REGEXP_REPLACE(e.name, '[^a-zA-Z]', '', 'g')),
               LOWER(REGEXP_REPLACE(exercise_name, '[^a-zA-Z]', '', 'g'))
           )::double precision AS sim_score
    FROM exercises e
    WHERE similarity(
              LOWER(REGEXP_REPLACE(e.name, '[^a-zA-Z]', '', 'g')),
              LOWER(REGEXP_REPLACE(exercise_name, '[^a-zA-Z]', '', 'g'))
          ) > threshold
    ORDER BY sim_score DESC;
END;
$function$
;
