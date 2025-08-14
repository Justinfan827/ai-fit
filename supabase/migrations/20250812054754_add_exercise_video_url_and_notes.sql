-- Add video_url and notes fields to exercises table
ALTER TABLE public.exercises 
ADD COLUMN video_url text,
ADD COLUMN notes text;

-- Add comment for the video_url column
COMMENT ON COLUMN public.exercises.video_url IS 'YouTube or other video URL for exercise demonstration';
COMMENT ON COLUMN public.exercises.notes IS 'Exercise notes and instructions';
