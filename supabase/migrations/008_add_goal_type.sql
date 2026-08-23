-- Migration 008: Add goal_type to goals
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS goal_type TEXT NOT NULL DEFAULT 'budget' CHECK (goal_type IN ('budget', 'savings'));

