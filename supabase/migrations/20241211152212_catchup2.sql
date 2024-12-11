alter table "public"."workout_instance" drop constraint "workout_instance_user_id_fkey";

alter table "public"."workout_instance" drop constraint "workout_instance_pkey";

drop index if exists "public"."workout_instance_pkey";

drop table "public"."workout_instance";

create table "public"."workout_instances" (
    "created_at" timestamp with time zone not null default now(),
    "start_at" timestamp with time zone,
    "end_at" timestamp with time zone,
    "workout_id" uuid not null,
    "blocks" jsonb not null,
    "user_id" uuid not null,
    "id" uuid not null default gen_random_uuid(),
    "program_id" uuid not null
);


CREATE UNIQUE INDEX workout_instance_pkey ON public.workout_instances USING btree (id);

alter table "public"."workout_instances" add constraint "workout_instance_pkey" PRIMARY KEY using index "workout_instance_pkey";

alter table "public"."workout_instances" add constraint "workout_instance_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."workout_instances" validate constraint "workout_instance_user_id_fkey";

alter table "public"."workout_instances" add constraint "workout_instances_program_id_fkey" FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE not valid;

alter table "public"."workout_instances" validate constraint "workout_instances_program_id_fkey";

alter table "public"."workout_instances" add constraint "workout_instances_workout_id_fkey" FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE not valid;

alter table "public"."workout_instances" validate constraint "workout_instances_workout_id_fkey";

