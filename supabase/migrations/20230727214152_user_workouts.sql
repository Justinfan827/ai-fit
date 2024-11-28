BEGIN;

CREATE TABLE IF NOT EXISTS public.users (
    id uuid NOT NULL PRIMARY KEY, -- UUID from auth.users
    created_at timestamp with time zone DEFAULT now(),
    email text,
    first_name text,
    last_name text
);
-- FUNCTION
CREATE OR REPLACE FUNCTION public.handle_new_user ()
    RETURNS TRIGGER
    AS $$
BEGIN
    INSERT INTO public.users (id, email)
        VALUES (NEW.id, NEW.email);
    RETURN new;
END;
$$
LANGUAGE plpgsql
SECURITY DEFINER;
CREATE OR REPLACE FUNCTION public.handle_delete_user ()
    RETURNS TRIGGER
    AS $$
BEGIN
    DELETE FROM public.users
    WHERE id = OLD.id;
    RETURN old;
END;
$$
LANGUAGE plpgsql
SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_new_user ();
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;

CREATE TRIGGER on_auth_user_deleted
    AFTER DELETE ON auth.users
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_delete_user ();
COMMIT;


create table "public"."workout_plans" (
    "id" uuid not null,
    "created_at" timestamp with time zone default now(),
    "version" text not null,
    "workout_plan_json" jsonb not null,
-- can support guest flow
    "user_id" uuid references public.users(id) 
);


CREATE UNIQUE INDEX workout_plans_pkey ON public.workout_plans USING btree (id);

alter table "public"."workout_plans" add constraint "workout_plans_pkey" PRIMARY KEY using index "workout_plans_pkey";

COMMIT;

