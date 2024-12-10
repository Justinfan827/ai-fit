create table "public"."programs" (
    "created_at" timestamp with time zone not null default now(),
    "user_id" uuid not null,
    "id" uuid not null default gen_random_uuid(),
    "name" text not null
);


create table "public"."workout_instance" (
    "created_at" timestamp with time zone not null default now(),
    "start_at" timestamp with time zone,
    "end_at" timestamp with time zone,
    "workout_id" uuid not null,
    "instance_json" jsonb not null,
    "user_id" uuid not null,
    "id" uuid not null default gen_random_uuid()
);


alter table "public"."workouts" drop column "version";

alter table "public"."workouts" add column "blocks" jsonb not null;

alter table "public"."workouts" add column "name" text not null;

alter table "public"."workouts" add column "program_id" uuid not null;

alter table "public"."workouts" add column "program_order" smallint not null;

alter table "public"."workouts" alter column "id" set default gen_random_uuid();

CREATE UNIQUE INDEX workout_instance_pkey ON public.workout_instance USING btree (id);

CREATE UNIQUE INDEX workout_plans_pkey1 ON public.programs USING btree (id);

CREATE UNIQUE INDEX workout_plans_uid_key ON public.programs USING btree (id);

CREATE UNIQUE INDEX workout_rows_pkey1 ON public.workout_rows USING btree (id);

CREATE UNIQUE INDEX workouts_pkey ON public.workouts USING btree (id);

alter table "public"."programs" add constraint "workout_plans_pkey1" PRIMARY KEY using index "workout_plans_pkey1";

alter table "public"."workout_instance" add constraint "workout_instance_pkey" PRIMARY KEY using index "workout_instance_pkey";

alter table "public"."workout_rows" add constraint "workout_rows_pkey1" PRIMARY KEY using index "workout_rows_pkey1";

alter table "public"."workouts" add constraint "workouts_pkey" PRIMARY KEY using index "workouts_pkey";

alter table "public"."programs" add constraint "workout_plans_uid_key" UNIQUE using index "workout_plans_uid_key";

alter table "public"."programs" add constraint "workout_plans_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."programs" validate constraint "workout_plans_user_id_fkey";

alter table "public"."workout_instance" add constraint "workout_instance_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."workout_instance" validate constraint "workout_instance_user_id_fkey";

alter table "public"."workouts" add constraint "workouts_program_id_fkey" FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE not valid;

alter table "public"."workouts" validate constraint "workouts_program_id_fkey";

