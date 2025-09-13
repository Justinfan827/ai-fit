-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL PUBLIC TABLES
-- ============================================================================

-- Enable RLS on all public tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_assigned_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debug_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_client_notes ENABLE ROW LEVEL SECURITY;
-- Enable RLS on chat tables
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_chats ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Users can view their own profile and profiles of users they train
CREATE POLICY "users_select_policy" ON public.users
    FOR SELECT
    TO authenticated
    USING (
        (SELECT auth.uid()) = id 
        OR 
        (SELECT auth.uid()) = trainer_id
    );

-- Users can update their own profile
CREATE POLICY "users_update_policy" ON public.users
    FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = id)
    WITH CHECK ((SELECT auth.uid()) = id);

-- ============================================================================
-- EXERCISES TABLE POLICIES
-- ============================================================================

-- Users can view platform exercises (owner_id IS NULL) and their own custom exercises
CREATE POLICY "exercises_select_policy" ON public.exercises
    FOR SELECT
    TO authenticated
    USING (
        owner_id IS NULL 
        OR 
        (SELECT auth.uid()) = owner_id
    );

-- Users can insert their own custom exercises
CREATE POLICY "exercises_insert_policy" ON public.exercises
    FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = owner_id);

-- Users can update their own custom exercises
CREATE POLICY "exercises_update_policy" ON public.exercises
    FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = owner_id)
    WITH CHECK ((SELECT auth.uid()) = owner_id);

-- Users can delete their own custom exercises
CREATE POLICY "exercises_delete_policy" ON public.exercises
    FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = owner_id);

-- ============================================================================
-- CATEGORIES TABLE POLICIES
-- ============================================================================

-- Users can view their own categories
CREATE POLICY "categories_select_policy" ON public.categories
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- Users can insert their own categories
CREATE POLICY "categories_insert_policy" ON public.categories
    FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can update their own categories
CREATE POLICY "categories_update_policy" ON public.categories
    FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can delete (soft delete) their own categories
CREATE POLICY "categories_delete_policy" ON public.categories
    FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- CATEGORY VALUES TABLE POLICIES
-- ============================================================================

-- Users can view category values for their own categories
CREATE POLICY "category_values_select_policy" ON public.category_values
    FOR SELECT
    TO authenticated
    USING (
        category_id IN (
            SELECT id 
            FROM public.categories 
            WHERE user_id = (SELECT auth.uid())
        )
    );

-- Users can insert category values for their own categories
CREATE POLICY "category_values_insert_policy" ON public.category_values
    FOR INSERT
    TO authenticated
    WITH CHECK (
        category_id IN (
            SELECT id 
            FROM public.categories 
            WHERE user_id = (SELECT auth.uid())
        )
    );

-- Users can update category values for their own categories
CREATE POLICY "category_values_update_policy" ON public.category_values
    FOR UPDATE
    TO authenticated
    USING (
        category_id IN (
            SELECT id 
            FROM public.categories 
            WHERE user_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        category_id IN (
            SELECT id 
            FROM public.categories 
            WHERE user_id = (SELECT auth.uid())
        )
    );

-- Users can delete category values for their own categories
CREATE POLICY "category_values_delete_policy" ON public.category_values
    FOR DELETE
    TO authenticated
    USING (
        category_id IN (
            SELECT id 
            FROM public.categories 
            WHERE user_id = (SELECT auth.uid())
        )
    );

-- ============================================================================
-- CATEGORY ASSIGNMENTS TABLE POLICIES
-- ============================================================================

-- Users can view category assignments for exercises they can access
CREATE POLICY "category_assignments_select_policy" ON public.category_assignments
    FOR SELECT
    TO authenticated
    USING (
        exercise_id IN (
            SELECT id 
            FROM public.exercises 
            WHERE owner_id IS NULL OR owner_id = (SELECT auth.uid())
        )
    );

-- Users can assign their category values to exercises they own
CREATE POLICY "category_assignments_insert_policy" ON public.category_assignments
    FOR INSERT
    TO authenticated
    WITH CHECK (
        exercise_id IN (
            SELECT id 
            FROM public.exercises 
            WHERE owner_id = (SELECT auth.uid())
        )
    );

-- Users can update category assignments for exercises they own
CREATE POLICY "category_assignments_update_policy" ON public.category_assignments
    FOR UPDATE
    TO authenticated
    USING (
        exercise_id IN (
            SELECT id 
            FROM public.exercises 
            WHERE owner_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        exercise_id IN (
            SELECT id 
            FROM public.exercises 
            WHERE owner_id = (SELECT auth.uid())
        )
    );

-- Users can delete category assignments for exercises they own
CREATE POLICY "category_assignments_delete_policy" ON public.category_assignments
    FOR DELETE
    TO authenticated
    USING (
        exercise_id IN (
            SELECT id 
            FROM public.exercises 
            WHERE owner_id = (SELECT auth.uid())
        )
    );

-- ============================================================================
-- PROGRAMS TABLE POLICIES
-- ============================================================================

-- Users can view their own programs and programs assigned to them by trainers
CREATE POLICY "programs_select_policy" ON public.programs
    FOR SELECT
    TO authenticated
    USING (
        (SELECT auth.uid()) = user_id
        OR
        id IN (
            SELECT program_id 
            FROM public.trainer_assigned_programs 
            WHERE client_id = (SELECT auth.uid())
        )
        OR
        -- Trainers can view programs owned by their clients
        user_id IN (
            SELECT id
            FROM public.users
            WHERE trainer_id = (SELECT auth.uid())
        )
    );

-- Users can insert their own programs
CREATE POLICY "programs_insert_policy" ON public.programs
    FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- Trainers can insert programs for their clients
CREATE POLICY "programs_insert_trainer_clients_policy" ON public.programs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id IN (
            SELECT id
            FROM public.users
            WHERE trainer_id = (SELECT auth.uid())
        )
    );

-- Users can update their own programs
CREATE POLICY "programs_update_policy" ON public.programs
    FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- Trainers can update programs for their clients
CREATE POLICY "programs_update_trainer_clients_policy" ON public.programs
    FOR UPDATE
    TO authenticated
    USING (
        user_id IN (
            SELECT id
            FROM public.users
            WHERE trainer_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        user_id IN (
            SELECT id
            FROM public.users
            WHERE trainer_id = (SELECT auth.uid())
        )
    );

-- Users can delete their own programs
CREATE POLICY "programs_delete_policy" ON public.programs
    FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- WORKOUTS TABLE POLICIES
-- ============================================================================

-- Users can view workouts from programs they have access to
CREATE POLICY "workouts_select_policy" ON public.workouts
    FOR SELECT
    TO authenticated
    USING (
        (SELECT auth.uid()) = user_id
        OR
        -- Trainers can view workouts for their clients
        user_id IN (
            SELECT id
            FROM public.users
            WHERE trainer_id = (SELECT auth.uid())
        )
    );

-- Users can insert workouts for programs they own
CREATE POLICY "workouts_insert_policy" ON public.workouts
    FOR INSERT
    TO authenticated
    WITH CHECK (
        (SELECT auth.uid()) = user_id
    );


-- Trainers can insert workouts for their clients
CREATE POLICY "workouts_insert_trainer_clients_policy" ON public.workouts
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id IN (
            SELECT id
            FROM public.users
            WHERE trainer_id = (SELECT auth.uid())
        )
    );

-- Users can update workouts for programs they own
CREATE POLICY "workouts_update_policy" ON public.workouts
    FOR UPDATE
    TO authenticated
    USING (
        (SELECT auth.uid()) = user_id
        OR
        -- Trainers can update workouts for their clients
        user_id IN (
            SELECT id
            FROM public.users
            WHERE trainer_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        (SELECT auth.uid()) = user_id
        OR
        -- Trainers can update workouts for their clients
        user_id IN (
            SELECT id
            FROM public.users
            WHERE trainer_id = (SELECT auth.uid())
        )
    );

-- Users can delete workouts for programs they own
CREATE POLICY "workouts_delete_policy" ON public.workouts
    FOR DELETE
    TO authenticated
    USING (
        (SELECT auth.uid()) = user_id
        OR
        -- Trainers can delete workouts for their clients
        user_id IN (
            SELECT id
            FROM public.users
            WHERE trainer_id = (SELECT auth.uid())
        )
    );

-- ============================================================================
-- TRAINER ASSIGNED PROGRAMS TABLE POLICIES
-- ============================================================================

-- Trainers can view assignments they made, clients can view assignments made to them
CREATE POLICY "trainer_assigned_programs_select_policy" ON public.trainer_assigned_programs
    FOR SELECT
    TO authenticated
    USING (
        (SELECT auth.uid()) = trainer_id
        OR
        (SELECT auth.uid()) = client_id
    );

-- Only trainers can assign programs to their clients
CREATE POLICY "trainer_assigned_programs_insert_policy" ON public.trainer_assigned_programs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        (SELECT auth.uid()) = trainer_id
        AND
        client_id IN (
            SELECT id 
            FROM public.users 
            WHERE trainer_id = (SELECT auth.uid())
        )
    );

-- Only trainers can update their assignments
CREATE POLICY "trainer_assigned_programs_update_policy" ON public.trainer_assigned_programs
    FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = trainer_id)
    WITH CHECK (
        (SELECT auth.uid()) = trainer_id
        AND
        client_id IN (
            SELECT id 
            FROM public.users 
            WHERE trainer_id = (SELECT auth.uid())
        )
    );

-- Only trainers can delete their assignments
CREATE POLICY "trainer_assigned_programs_delete_policy" ON public.trainer_assigned_programs
    FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = trainer_id);



-- ============================================================================
-- DEBUG LOG TABLE POLICIES
-- ============================================================================
-- Only users with email justinfan827@gmail.com can access debug logs

-- Only admin user can read debug logs
CREATE POLICY "debug_log_select_policy" ON public.debug_log
    FOR SELECT
    TO authenticated
    USING (
        (SELECT email FROM auth.users WHERE id = auth.uid()) = 'justinfan827@gmail.com'
    );

-- All authenticated users can insert debug logs (for debugging purposes)
CREATE POLICY "debug_log_insert_policy" ON public.debug_log
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Only admin user can update debug logs
CREATE POLICY "debug_log_update_policy" ON public.debug_log
    FOR UPDATE
    TO authenticated
    USING (
        (SELECT email FROM auth.users WHERE id = auth.uid()) = 'justinfan827@gmail.com'
    )
    WITH CHECK (
        (SELECT email FROM auth.users WHERE id = auth.uid()) = 'justinfan827@gmail.com'
    );

-- Only admin user can delete debug logs
CREATE POLICY "debug_log_delete_policy" ON public.debug_log
    FOR DELETE
    TO authenticated
    USING (
        (SELECT email FROM auth.users WHERE id = auth.uid()) = 'justinfan827@gmail.com'
    );


-- ============================================================================
-- TRAINER CLIENT NOTES TABLE RLS POLICIES
-- ============================================================================
-- Missing RLS policies for the trainer_client_notes table
-- This table stores notes that trainers create about their clients

-- Trainers can view notes they created, clients can view notes about themselves
CREATE POLICY "trainer_client_notes_select_policy" ON public.trainer_client_notes
    FOR SELECT
    TO authenticated
    USING (
        (SELECT auth.uid()) = trainer_id
        OR
        (SELECT auth.uid()) = client_id
    );

-- Only trainers can create notes about their clients
CREATE POLICY "trainer_client_notes_insert_policy" ON public.trainer_client_notes
    FOR INSERT
    TO authenticated
    WITH CHECK (
        (SELECT auth.uid()) = trainer_id
    );

-- Only trainers can update their own notes
CREATE POLICY "trainer_client_notes_update_policy" ON public.trainer_client_notes
    FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = trainer_id)
    WITH CHECK (
        (SELECT auth.uid()) = trainer_id
    );

-- Only trainers can delete their own notes
CREATE POLICY "trainer_client_notes_delete_policy" ON public.trainer_client_notes
    FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = trainer_id);

-- ============================================================================
-- CHAT TABLES RLS POLICIES
-- ============================================================================
-- Comprehensive security for chat persistence tables
-- Supports coach/client access patterns and program ownership

-- ============================================================================
-- CHATS TABLE POLICIES
-- ============================================================================

-- Users can access chats they own or chats for programs they have access to
CREATE POLICY "chats_select_policy" ON public.chats
    FOR SELECT
    TO authenticated
    USING (
        -- User owns the chat
        (SELECT auth.uid()) = user_id
        OR
        -- User has access to programs linked to this chat
        EXISTS (
            SELECT 1 FROM public.program_chats pc
            JOIN public.programs p ON pc.program_id = p.id
            WHERE pc.chat_id = chats.id
            AND (
                -- User owns the program
                p.user_id = (SELECT auth.uid())
                OR
                -- User is a trainer who assigned this program to a client
                EXISTS (
                    SELECT 1 FROM public.trainer_assigned_programs tap
                    WHERE tap.program_id = p.id
                    AND tap.trainer_id = (SELECT auth.uid())
                )
            )
        )
    );

-- Users can create their own chats
CREATE POLICY "chats_insert_policy" ON public.chats
    FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can update chats they have access to
CREATE POLICY "chats_update_policy" ON public.chats
    FOR UPDATE
    TO authenticated
    USING (
        -- User owns the chat
        (SELECT auth.uid()) = user_id
        OR
        -- User has access to programs linked to this chat
        EXISTS (
            SELECT 1 FROM public.program_chats pc
            JOIN public.programs p ON pc.program_id = p.id
            WHERE pc.chat_id = chats.id
            AND (
                -- User owns the program
                p.user_id = (SELECT auth.uid())
                OR
                -- User is a trainer who assigned this program to a client
                EXISTS (
                    SELECT 1 FROM public.trainer_assigned_programs tap
                    WHERE tap.program_id = p.id
                    AND tap.trainer_id = (SELECT auth.uid())
                )
            )
        )
    )
    WITH CHECK (
        -- User owns the chat
        (SELECT auth.uid()) = user_id
        OR
        -- User has access to programs linked to this chat
        EXISTS (
            SELECT 1 FROM public.program_chats pc
            JOIN public.programs p ON pc.program_id = p.id
            WHERE pc.chat_id = chats.id
            AND (
                -- User owns the program
                p.user_id = (SELECT auth.uid())
                OR
                -- User is a trainer who assigned this program to a client
                EXISTS (
                    SELECT 1 FROM public.trainer_assigned_programs tap
                    WHERE tap.program_id = p.id
                    AND tap.trainer_id = (SELECT auth.uid())
                )
            )
        )
    );

-- Users can delete chats they have access to
CREATE POLICY "chats_delete_policy" ON public.chats
    FOR DELETE
    TO authenticated
    USING (
        -- User owns the chat
        (SELECT auth.uid()) = user_id
        OR
        -- User has access to programs linked to this chat
        EXISTS (
            SELECT 1 FROM public.program_chats pc
            JOIN public.programs p ON pc.program_id = p.id
            WHERE pc.chat_id = chats.id
            AND (
                -- User owns the program
                p.user_id = (SELECT auth.uid())
                OR
                -- User is a trainer who assigned this program to a client
                EXISTS (
                    SELECT 1 FROM public.trainer_assigned_programs tap
                    WHERE tap.program_id = p.id
                    AND tap.trainer_id = (SELECT auth.uid())
                )
            )
        )
    );

-- ============================================================================
-- CHAT MESSAGES TABLE POLICIES
-- ============================================================================

-- Users can access messages for chats they have access to
CREATE POLICY "chat_messages_select_policy" ON public.chat_messages
    FOR SELECT
    TO authenticated
    USING (
        chat_id IN (
            SELECT id FROM public.chats WHERE
            -- User owns the chat
            user_id = (SELECT auth.uid())
            OR
            -- User has access to programs linked to this chat
            EXISTS (
                SELECT 1 FROM public.program_chats pc
                JOIN public.programs p ON pc.program_id = p.id
                WHERE pc.chat_id = chats.id
                AND (
                    -- User owns the program
                    p.user_id = (SELECT auth.uid())
                    OR
                    -- User is a trainer who assigned this program to a client
                    EXISTS (
                        SELECT 1 FROM public.trainer_assigned_programs tap
                        WHERE tap.program_id = p.id
                        AND tap.trainer_id = (SELECT auth.uid())
                    )
                )
            )
        )
    );

-- Users can insert messages into chats they have access to
CREATE POLICY "chat_messages_insert_policy" ON public.chat_messages
    FOR INSERT
    TO authenticated
    WITH CHECK (
        chat_id IN (
            SELECT id FROM public.chats WHERE
            -- User owns the chat
            user_id = (SELECT auth.uid())
            OR
            -- User has access to programs linked to this chat
            EXISTS (
                SELECT 1 FROM public.program_chats pc
                JOIN public.programs p ON pc.program_id = p.id
                WHERE pc.chat_id = chats.id
                AND (
                    -- User owns the program
                    p.user_id = (SELECT auth.uid())
                    OR
                    -- User is a trainer who assigned this program to a client
                    EXISTS (
                        SELECT 1 FROM public.trainer_assigned_programs tap
                        WHERE tap.program_id = p.id
                        AND tap.trainer_id = (SELECT auth.uid())
                    )
                )
            )
        )
    );

-- Users can update messages in chats they have access to
CREATE POLICY "chat_messages_update_policy" ON public.chat_messages
    FOR UPDATE
    TO authenticated
    USING (
        chat_id IN (
            SELECT id FROM public.chats WHERE
            -- User owns the chat
            user_id = (SELECT auth.uid())
            OR
            -- User has access to programs linked to this chat
            EXISTS (
                SELECT 1 FROM public.program_chats pc
                JOIN public.programs p ON pc.program_id = p.id
                WHERE pc.chat_id = chats.id
                AND (
                    -- User owns the program
                    p.user_id = (SELECT auth.uid())
                    OR
                    -- User is a trainer who assigned this program to a client
                    EXISTS (
                        SELECT 1 FROM public.trainer_assigned_programs tap
                        WHERE tap.program_id = p.id
                        AND tap.trainer_id = (SELECT auth.uid())
                    )
                )
            )
        )
    )
    WITH CHECK (
        chat_id IN (
            SELECT id FROM public.chats WHERE
            -- User owns the chat
            user_id = (SELECT auth.uid())
            OR
            -- User has access to programs linked to this chat
            EXISTS (
                SELECT 1 FROM public.program_chats pc
                JOIN public.programs p ON pc.program_id = p.id
                WHERE pc.chat_id = chats.id
                AND (
                    -- User owns the program
                    p.user_id = (SELECT auth.uid())
                    OR
                    -- User is a trainer who assigned this program to a client
                    EXISTS (
                        SELECT 1 FROM public.trainer_assigned_programs tap
                        WHERE tap.program_id = p.id
                        AND tap.trainer_id = (SELECT auth.uid())
                    )
                )
            )
        )
    );

-- Users can delete messages from chats they have access to
CREATE POLICY "chat_messages_delete_policy" ON public.chat_messages
    FOR DELETE
    TO authenticated
    USING (
        chat_id IN (
            SELECT id FROM public.chats WHERE
            -- User owns the chat
            user_id = (SELECT auth.uid())
            OR
            -- User has access to programs linked to this chat
            EXISTS (
                SELECT 1 FROM public.program_chats pc
                JOIN public.programs p ON pc.program_id = p.id
                WHERE pc.chat_id = chats.id
                AND (
                    -- User owns the program
                    p.user_id = (SELECT auth.uid())
                    OR
                    -- User is a trainer who assigned this program to a client
                    EXISTS (
                        SELECT 1 FROM public.trainer_assigned_programs tap
                        WHERE tap.program_id = p.id
                        AND tap.trainer_id = (SELECT auth.uid())
                    )
                )
            )
        )
    );

-- ============================================================================
-- PROGRAM CHATS TABLE POLICIES
-- ============================================================================

-- Users can access program-chat links for programs they have access to
CREATE POLICY "program_chats_select_policy" ON public.program_chats
    FOR SELECT
    TO authenticated
    USING (
        -- User owns the program
        program_id IN (
            SELECT id FROM public.programs WHERE user_id = (SELECT auth.uid())
        )
        OR
        -- User assigned the program to a client (trainer)
        program_id IN (
            SELECT program_id FROM public.trainer_assigned_programs
            WHERE trainer_id = (SELECT auth.uid())
        )
        OR
        -- Program was assigned to the user (client)
        program_id IN (
            SELECT program_id FROM public.trainer_assigned_programs
            WHERE client_id = (SELECT auth.uid())
        )
    );

-- Users can link chats to programs they have access to
CREATE POLICY "program_chats_insert_policy" ON public.program_chats
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- User owns the program
        program_id IN (
            SELECT id FROM public.programs WHERE user_id = (SELECT auth.uid())
        )
        OR
        -- User assigned the program to a client (trainer)
        program_id IN (
            SELECT program_id FROM public.trainer_assigned_programs
            WHERE trainer_id = (SELECT auth.uid())
        )
        OR
        -- Program was assigned to the user (client)
        program_id IN (
            SELECT program_id FROM public.trainer_assigned_programs
            WHERE client_id = (SELECT auth.uid())
        )
    );

-- Users can update program-chat links for programs they have access to
CREATE POLICY "program_chats_update_policy" ON public.program_chats
    FOR UPDATE
    TO authenticated
    USING (
        -- User owns the program
        program_id IN (
            SELECT id FROM public.programs WHERE user_id = (SELECT auth.uid())
        )
        OR
        -- User assigned the program to a client (trainer)
        program_id IN (
            SELECT program_id FROM public.trainer_assigned_programs
            WHERE trainer_id = (SELECT auth.uid())
        )
        OR
        -- Program was assigned to the user (client)
        program_id IN (
            SELECT program_id FROM public.trainer_assigned_programs
            WHERE client_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        -- User owns the program
        program_id IN (
            SELECT id FROM public.programs WHERE user_id = (SELECT auth.uid())
        )
        OR
        -- User assigned the program to a client (trainer)
        program_id IN (
            SELECT program_id FROM public.trainer_assigned_programs
            WHERE trainer_id = (SELECT auth.uid())
        )
        OR
        -- Program was assigned to the user (client)
        program_id IN (
            SELECT program_id FROM public.trainer_assigned_programs
            WHERE client_id = (SELECT auth.uid())
        )
    );

-- Users can delete program-chat links for programs they have access to
CREATE POLICY "program_chats_delete_policy" ON public.program_chats
    FOR DELETE
    TO authenticated
    USING (
        -- User owns the program
        program_id IN (
            SELECT id FROM public.programs WHERE user_id = (SELECT auth.uid())
        )
        OR
        -- User assigned the program to a client (trainer)
        program_id IN (
            SELECT program_id FROM public.trainer_assigned_programs
            WHERE trainer_id = (SELECT auth.uid())
        )
        OR
        -- Program was assigned to the user (client)
        program_id IN (
            SELECT program_id FROM public.trainer_assigned_programs
            WHERE client_id = (SELECT auth.uid())
        )
    );