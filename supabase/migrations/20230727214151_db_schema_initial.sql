CREATE FUNCTION public.delete_claim (uid uuid, claim text)
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    IF NOT is_claims_admin () THEN
        RETURN 'error: access denied';
    ELSE
        UPDATE
            auth.users
        SET
            raw_app_meta_data = raw_app_meta_data - claim
        WHERE
            id = uid;
        RETURN 'OK';
    END IF;
END;
$$;

CREATE FUNCTION public.get_claim (uid uuid, claim text)
    RETURNS jsonb
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    retval jsonb;
BEGIN
    IF NOT is_claims_admin () THEN
        RETURN '{"error":"access denied"}'::jsonb;
    ELSE
        SELECT
            coalesce(raw_app_meta_data -> claim, NULL)
        FROM
            auth.users INTO retval
        WHERE
            id = uid::uuid;
        RETURN retval;
    END IF;
END;
$$;

CREATE FUNCTION public.get_claims (uid uuid)
    RETURNS jsonb
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    retval jsonb;
BEGIN
    IF NOT is_claims_admin () THEN
        RETURN '{"error":"access denied"}'::jsonb;
    ELSE
        SELECT
            raw_app_meta_data
        FROM
            auth.users INTO retval
        WHERE
            id = uid::uuid;
        RETURN retval;
    END IF;
END;
$$;

CREATE FUNCTION public.get_my_claim (claim text)
    RETURNS jsonb
    LANGUAGE sql
    STABLE
    AS $$
    SELECT
        coalesce(nullif (current_setting('request.jwt.claims', TRUE), '')::jsonb -> 'app_metadata' -> claim, NULL)
$$;

CREATE FUNCTION public.get_my_claims ()
    RETURNS jsonb
    LANGUAGE sql
    STABLE
    AS $$
    SELECT
        coalesce(nullif (current_setting('request.jwt.claims', TRUE), '')::jsonb -> 'app_metadata', '{}'::jsonb)::jsonb
$$;

CREATE FUNCTION public.handle_delete_user ()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
BEGIN
    DELETE FROM public.users
    WHERE id = OLD.id;
    RETURN old;
END;
$$;

CREATE FUNCTION public.handle_new_user ()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO public.users (id, email)
        VALUES (NEW.id, NEW.email);
    RETURN new;
END;
$$;

-- trigger the function every time a user is created
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_new_user ();

-- trigger the function every time a user is deleted
CREATE TRIGGER on_auth_user_deleted
    AFTER DELETE ON auth.users
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_delete_user ();

CREATE FUNCTION public.is_claims_admin ()
    RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF SESSION_USER = 'authenticator' THEN
        --------------------------------------------
        -- To disallow any authenticated app users
        -- from editing claims, delete the following
        -- block of code and replace it with:
        -- RETURN FALSE;
        --------------------------------------------
        IF extract(epoch FROM now()) > coalesce((current_setting('request.jwt.claims', TRUE)::jsonb) ->> 'exp', '0')::numeric THEN
            RETURN FALSE;
            -- jwt expired
        END IF;
        IF current_setting('request.jwt.claims', TRUE)::jsonb ->> 'role' = 'service_role' THEN
            RETURN TRUE;
            -- service role users have admin rights
        END IF;
        IF coalesce((current_setting('request.jwt.claims', TRUE)::jsonb) -> 'app_metadata' -> 'claims_admin', 'false')::bool THEN
            RETURN TRUE;
            -- user has claims_admin set to true
        ELSE
            RETURN FALSE;
            -- user does NOT have claims_admin set to true
        END IF;
        --------------------------------------------
        -- End of block
        --------------------------------------------
    ELSE
        -- not a user session, probably being called from a trigger or something
        RETURN TRUE;
    END IF;
END;
$$;

-- CREATE FUNCTION public.search_exercises_by_name(exercise_name text, threshold double precision) RETURNS TABLE(id uuid, created_at timestamp with time zone, name text, target_muscles jsonb, skill text, range_of_motion text, body_region text, owner_id uuid, modifiers jsonb, sim_score double precision)
--     LANGUAGE plpgsql
--     AS $$
-- BEGIN
--     RETURN QUERY
--     SELECT e.id, e.created_at, e.name, e.target_muscles, e.skill, e.range_of_motion, e.body_region, e.owner_id, e.modifiers,
--            similarity(
--                LOWER(REGEXP_REPLACE(e.name, '[^a-zA-Z]', '', 'g')),
--                LOWER(REGEXP_REPLACE(exercise_name, '[^a-zA-Z]', '', 'g'))
--            )::double precision AS sim_score
--     FROM exercises e
--     WHERE similarity(
--               LOWER(REGEXP_REPLACE(e.name, '[^a-zA-Z]', '', 'g')),
--               LOWER(REGEXP_REPLACE(exercise_name, '[^a-zA-Z]', '', 'g'))
--           ) > threshold
--     ORDER BY sim_score DESC;
-- END;
-- $$;
CREATE FUNCTION public.set_claim (uid uuid, claim text, value jsonb)
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    IF NOT is_claims_admin () THEN
        RETURN 'error: access denied';
    ELSE
        UPDATE
            auth.users
        SET
            raw_app_meta_data = raw_app_meta_data || json_build_object(claim, value)::jsonb
        WHERE
            id = uid;
        RETURN 'OK';
    END IF;
END;
$$;

CREATE TABLE public.users (
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    email text,
    first_name text,
    last_name text,
    metadata jsonb,
    trainer_id uuid
);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_trainer_id_fkey FOREIGN KEY (trainer_id) REFERENCES public.users (id) NOT VALID;

CREATE TABLE public.exercises (
    id uuid DEFAULT gen_random_uuid () NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    owner_id uuid,
    primary_trained_colloquial text,
    skill_requirement text,
    primary_benefit text
);

-- CREATE INDEX idx_exercises_name_trgm ON public.exercises USING gist (name public.gist_trgm_ops);
COMMENT ON COLUMN public.exercises.primary_trained_colloquial IS 'Primary muscles trained, in their colloquial terms';

ALTER TABLE ONLY public.exercises
    ADD CONSTRAINT exercises_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.exercises
    ADD CONSTRAINT exercises_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users (id) ON DELETE CASCADE NOT VALID;

CREATE TABLE public.programs (
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid () NOT NULL,
    name text NOT NULL,
    is_template boolean NOT NULL,
    template_id uuid,
    type text NOT NULL
);

ALTER TABLE ONLY public.programs
    ADD CONSTRAINT workout_plans_pkey1 PRIMARY KEY (id);

ALTER TABLE ONLY public.programs
    ADD CONSTRAINT programs_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.programs (id) NOT VALID;

ALTER TABLE ONLY public.programs
    ADD CONSTRAINT programs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE NOT VALID;

ALTER TABLE ONLY public.programs
    ADD CONSTRAINT workout_plans_uid_key UNIQUE (id);

COMMENT ON COLUMN public.programs.type IS 'program type (splits or weekly)';

CREATE TABLE public.workouts (
    id uuid DEFAULT gen_random_uuid () NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    user_id uuid NOT NULL,
    blocks jsonb NOT NULL,
    name text NOT NULL,
    program_id uuid NOT NULL,
    program_order smallint NOT NULL,
    week smallint
);

COMMENT ON COLUMN public.workouts.week IS 'Week this workout goes in in a program';

ALTER TABLE ONLY public.workouts
    ADD CONSTRAINT workouts_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.workouts
    ADD CONSTRAINT workouts_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs (id) ON DELETE CASCADE;

CREATE UNIQUE INDEX workout_plans_pkey ON public.workouts USING btree (id);

CREATE TABLE public.trainer_assigned_programs (
    id uuid DEFAULT gen_random_uuid () NOT NULL,
    client_id uuid DEFAULT gen_random_uuid () NOT NULL,
    trainer_id uuid DEFAULT gen_random_uuid () NOT NULL,
    program_id uuid DEFAULT gen_random_uuid () NOT NULL
);

ALTER TABLE ONLY public.trainer_assigned_programs
    ADD CONSTRAINT trainer_assigned_programs_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.trainer_assigned_programs
    ADD CONSTRAINT trainer_assigned_programs_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users (id) ON DELETE CASCADE NOT VALID;

ALTER TABLE ONLY public.trainer_assigned_programs
    ADD CONSTRAINT trainer_assigned_programs_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs (id) ON DELETE CASCADE NOT VALID;

ALTER TABLE ONLY public.trainer_assigned_programs
    ADD CONSTRAINT trainer_assigned_programs_trainer_id_fkey FOREIGN KEY (trainer_id) REFERENCES public.users (id) ON DELETE SET NULL NOT VALID;

CREATE TABLE public.workout_instances (
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    start_at timestamp with time zone,
    end_at timestamp with time zone,
    workout_id uuid NOT NULL,
    blocks jsonb NOT NULL,
    user_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid () NOT NULL,
    program_id uuid NOT NULL
);

ALTER TABLE ONLY public.workout_instances
    ADD CONSTRAINT workout_instance_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.workout_instances
    ADD CONSTRAINT workout_instance_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;

ALTER TABLE ONLY public.workout_instances
    ADD CONSTRAINT workout_instances_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs (id) ON DELETE CASCADE;

ALTER TABLE ONLY public.workout_instances
    ADD CONSTRAINT workout_instances_workout_id_fkey FOREIGN KEY (workout_id) REFERENCES public.workouts (id) ON DELETE CASCADE;

CREATE TABLE public.workout_rows (
    workout_id uuid,
    row_data jsonb,
    id uuid DEFAULT gen_random_uuid () NOT NULL
);

ALTER TABLE ONLY public.workout_rows
    ADD CONSTRAINT workout_rows_pkey PRIMARY KEY (id);

