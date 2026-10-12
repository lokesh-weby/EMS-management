-- Supabase PostgreSQL Database DDL Script for EMS Management Portal
-- Run this in your Supabase SQL Editor to set up all tables and RLS security policies.

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Enums
CREATE TYPE user_role AS ENUM ('admin', 'coordinator');
CREATE TYPE user_status AS ENUM ('active', 'inactive');
CREATE TYPE event_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE registration_status AS ENUM ('pending', 'approved', 'rejected');

-- 3. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_uid VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) NOT NULL,
    role user_role NOT NULL DEFAULT 'coordinator',
    status user_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Events Table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    banner_url TEXT,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    registration_deadline DATE NOT NULL,
    venue VARCHAR(255) NOT NULL,
    registration_fee NUMERIC(10,2) DEFAULT 0.00,
    max_team_size INT DEFAULT 1,
    whatsapp_group_link TEXT,
    upi_id VARCHAR(100),
    account_holder_name VARCHAR(255),
    upi_qr_url TEXT,
    status event_status DEFAULT 'draft',
    created_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create Event Organizers Table
CREATE TABLE IF NOT EXISTS public.event_organizers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    register_number VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create Registrations Table
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    coordinator_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    team_leader_name VARCHAR(255) NOT NULL,
    team_leader_email VARCHAR(255) NOT NULL,
    team_leader_phone VARCHAR(50) NOT NULL,
    college VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    team_size INT DEFAULT 1,
    payment_screenshot_url TEXT NOT NULL,
    status registration_status DEFAULT 'pending',
    remarks TEXT,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Create Registration Members Table
CREATE TABLE IF NOT EXISTS public.registration_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    register_number VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_members ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE firebase_uid = auth.uid()::text LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Admin Policy: Full Access to all tables
CREATE POLICY "Admins have full access to users" ON public.users FOR ALL USING (public.get_current_user_role() = 'admin');
CREATE POLICY "Admins have full access to events" ON public.events FOR ALL USING (public.get_current_user_role() = 'admin');
CREATE POLICY "Admins have full access to event_organizers" ON public.event_organizers FOR ALL USING (public.get_current_user_role() = 'admin');
CREATE POLICY "Admins have full access to registrations" ON public.registrations FOR ALL USING (public.get_current_user_role() = 'admin');
CREATE POLICY "Admins have full access to registration_members" ON public.registration_members FOR ALL USING (public.get_current_user_role() = 'admin');

-- Coordinator Policy: Filtered Access
-- Coordinators can view their own profile
CREATE POLICY "Coordinators view own profile" ON public.users FOR SELECT USING (firebase_uid = auth.uid()::text);

-- Coordinators can manage events where created_by matches their user id
CREATE POLICY "Coordinators manage own events" ON public.events FOR ALL USING (
    created_by IN (SELECT id FROM public.users WHERE firebase_uid = auth.uid()::text)
);

-- Coordinators can manage organizers for their events
CREATE POLICY "Coordinators manage own event organizers" ON public.event_organizers FOR ALL USING (
    event_id IN (SELECT id FROM public.events WHERE created_by IN (SELECT id FROM public.users WHERE firebase_uid = auth.uid()::text))
);

-- Coordinators can manage registrations for their events
CREATE POLICY "Coordinators manage own event registrations" ON public.registrations FOR ALL USING (
    event_id IN (SELECT id FROM public.events WHERE created_by IN (SELECT id FROM public.users WHERE firebase_uid = auth.uid()::text))
);

-- Coordinators can view members for registrations on their events
CREATE POLICY "Coordinators manage own registration members" ON public.registration_members FOR ALL USING (
    registration_id IN (
        SELECT id FROM public.registrations WHERE event_id IN (
            SELECT id FROM public.events WHERE created_by IN (SELECT id FROM public.users WHERE firebase_uid = auth.uid()::text)
        )
    )
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON public.registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_organizers_event_id ON public.event_organizers(event_id);
