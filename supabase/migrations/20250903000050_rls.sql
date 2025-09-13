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

-- Simplified: All authenticated users have full access
CREATE POLICY "users_authenticated_policy" ON public.users
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- EXERCISES TABLE POLICIES
-- ============================================================================

-- Simplified: All authenticated users have full access
CREATE POLICY "exercises_authenticated_policy" ON public.exercises
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- CATEGORIES TABLE POLICIES
-- ============================================================================

-- Simplified: All authenticated users have full access
CREATE POLICY "categories_authenticated_policy" ON public.categories
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- CATEGORY VALUES TABLE POLICIES
-- ============================================================================

-- Simplified: All authenticated users have full access
CREATE POLICY "category_values_authenticated_policy" ON public.category_values
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- CATEGORY ASSIGNMENTS TABLE POLICIES
-- ============================================================================

-- Simplified: All authenticated users have full access
CREATE POLICY "category_assignments_authenticated_policy" ON public.category_assignments
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- PROGRAMS TABLE POLICIES
-- ============================================================================

-- Simplified: All authenticated users have full access
CREATE POLICY "programs_authenticated_policy" ON public.programs
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- WORKOUTS TABLE POLICIES
-- ============================================================================

-- Simplified: All authenticated users have full access
CREATE POLICY "workouts_authenticated_policy" ON public.workouts
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- TRAINER ASSIGNED PROGRAMS TABLE POLICIES
-- ============================================================================

-- Simplified: All authenticated users have full access
CREATE POLICY "trainer_assigned_programs_authenticated_policy" ON public.trainer_assigned_programs
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);



-- ============================================================================
-- DEBUG LOG TABLE POLICIES
-- ============================================================================

-- Simplified: All authenticated users have full access
CREATE POLICY "debug_log_authenticated_policy" ON public.debug_log
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);


-- ============================================================================
-- TRAINER CLIENT NOTES TABLE RLS POLICIES
-- ============================================================================

-- Simplified: All authenticated users have full access
CREATE POLICY "trainer_client_notes_authenticated_policy" ON public.trainer_client_notes
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- CHAT TABLES RLS POLICIES
-- ============================================================================

-- ============================================================================
-- CHATS TABLE POLICIES
-- ============================================================================

-- Simplified: All authenticated users have full access
CREATE POLICY "chats_authenticated_policy" ON public.chats
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- CHAT MESSAGES TABLE POLICIES
-- ============================================================================

-- Simplified: All authenticated users have full access
CREATE POLICY "chat_messages_authenticated_policy" ON public.chat_messages
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- PROGRAM CHATS TABLE POLICIES
-- ============================================================================

-- Simplified: All authenticated users have full access
CREATE POLICY "program_chats_authenticated_policy" ON public.program_chats
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);