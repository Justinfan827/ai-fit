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

-- id
-- name
-- owner_id (optional fk to user id, for custom exercises)
-- primary_muscles_trained (platform specific tags, multi-select)
-- secondary_muscles_trained (other muscle groups used, (custom tags, comma separated))
-- tags (structured tags for context to the AI? e.g. rehab, compound, isolated, unilateral movement (custom tags, comma separated))
-- notes (custom notes to feed the AI e.g. commonly used for…, staple in … kinds of programs etc.)
-- image_url (display image / thumbnail?)
-- video_url (display video, youtube link?)
CREATE TABLE public.exercises (
    id uuid DEFAULT gen_random_uuid () NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    owner_id uuid,
    -- Custom tags attached to the exercise. Comma separated list of tags.
    -- Characterizes the properties of the exercise e.g.
    -- "rehab", "compound", "isolated", "unilateral" etc.
    tags text,
    -- Custom notes attached to the exercise.
    notes text,
    -- Video URL for the exercise.
    video_url text
);

ALTER TABLE ONLY public.exercises
    ADD CONSTRAINT exercises_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.exercises
    ADD CONSTRAINT exercises_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users (id) ON DELETE CASCADE NOT VALID;

-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================
-- Represents the category types that users can create (e.g., "Muscle Groups", "Equipment", "Difficulty Level")
CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    description text,
    -- The user who created this category
    user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    -- Soft delete flag
    deleted_at timestamp with time zone DEFAULT NULL
);

-- Unique constraint: no duplicate categories per user (only for non-deleted records)
CREATE UNIQUE INDEX categories_name_user_unique ON public.categories (name, user_id) WHERE deleted_at IS NULL;

-- ============================================================================
-- CATEGORY VALUES TABLE
-- ============================================================================
-- Represents the actual values/tags within each category (e.g., "Chest", "Shoulders" under "Muscle Groups")
CREATE TABLE public.category_values (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    category_id uuid NOT NULL REFERENCES public.categories (id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    -- Soft delete flag
    deleted_at timestamp with time zone DEFAULT NULL
);

-- Unique constraint: no duplicate values per category (only for non-deleted records)
CREATE UNIQUE INDEX category_values_name_category_unique ON public.category_values (name, category_id) WHERE deleted_at IS NULL;

-- ============================================================================
-- EXERCISE CATEGORY ASSIGNMENTS TABLE
-- ============================================================================
-- Junction table that assigns category values to exercises
CREATE TABLE public.category_assignments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    exercise_id uuid NOT NULL REFERENCES public.exercises (id) ON DELETE CASCADE,
    category_value_id uuid NOT NULL REFERENCES public.category_values (id) ON DELETE CASCADE
);

-- Unique constraint: for each category, a category value can only be assigned once to an exercise
ALTER TABLE ONLY public.category_assignments
    ADD CONSTRAINT category_assignments_exercise_id_category_value_id_unique 
    UNIQUE (exercise_id, category_value_id);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX idx_categories_user_id ON public.categories (user_id);
CREATE INDEX idx_category_values_category_id ON public.category_values (category_id);
CREATE INDEX idx_category_assignments_exercise_id ON public.category_assignments (exercise_id);
CREATE INDEX idx_category_assignments_category_value_id ON public.category_assignments (category_value_id);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON public.categories 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_category_values_updated_at 
    BEFORE UPDATE ON public.category_values 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- QUERIES THAT WILL BE USED
-- ============================================================================

-- Get all categories for a user as well as the values for each category
SELECT c.name AS category_name, cv.name AS value_name
FROM public.categories c
LEFT JOIN public.category_values cv ON c.id = cv.category_id
WHERE c.user_id = '<USER_ID>';

-- For an exercise, get all categories and values assigned to it
SELECT c.name AS category_name, cv.name AS value_name
FROM public.categories c
LEFT JOIN public.category_values cv ON c.id = cv.category_id
LEFT JOIN public.category_assignments ca ON cv.id = ca.category_value_id
WHERE ca.exercise_id = '<EXERCISE_ID>' AND c.user_id = '<USER_ID>';

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

