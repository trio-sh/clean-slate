-- Migration: Add application tables for laundry partners, drivers, and careers

-- Create table for driver applications
CREATE TABLE IF NOT EXISTS driver_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    vehicle_type VARCHAR(100),
    license_number VARCHAR(50),
    years_of_experience INTEGER DEFAULT 0,
    availability TEXT,
    message TEXT,
    resume_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for laundry partner applications
CREATE TABLE IF NOT EXISTS laundry_partner_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_name VARCHAR(200) NOT NULL,
    contact_person_first_name VARCHAR(100) NOT NULL,
    contact_person_last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    business_address TEXT,
    business_license VARCHAR(100),
    years_operating INTEGER DEFAULT 0,
    services_offered TEXT,
    capacity_per_day INTEGER,
    message TEXT,
    business_documents_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for career applications
CREATE TABLE IF NOT EXISTS career_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    position_applied VARCHAR(200) NOT NULL,
    cover_letter TEXT,
    resume_url TEXT,
    availability TEXT,
    salary_expectation DECIMAL(10, 2),
    applicant_references TEXT,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_driver_applications_status ON driver_applications(status);
CREATE INDEX IF NOT EXISTS idx_laundry_partner_applications_status ON laundry_partner_applications(status);
CREATE INDEX IF NOT EXISTS idx_career_applications_status ON career_applications(status);
CREATE INDEX IF NOT EXISTS idx_driver_applications_created_at ON driver_applications(created_at);
CREATE INDEX IF NOT EXISTS idx_laundry_partner_applications_created_at ON laundry_partner_applications(created_at);
CREATE INDEX IF NOT EXISTS idx_career_applications_created_at ON career_applications(created_at);

-- Create RLS policies for security
ALTER TABLE driver_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE laundry_partner_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_applications ENABLE ROW LEVEL SECURITY;

-- Create policies allowing admin and staff access
CREATE POLICY "Allow admin and staff read access to driver applications" ON driver_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE email = auth.jwt() ->> 'email' 
            AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'role' = 'staff')
        )
    );

CREATE POLICY "Allow admin and staff read access to laundry partner applications" ON laundry_partner_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE email = auth.jwt() ->> 'email' 
            AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'role' = 'staff')
        )
    );

CREATE POLICY "Allow admin and staff read access to career applications" ON career_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE email = auth.jwt() ->> 'email' 
            AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'role' = 'staff')
        )
    );

CREATE POLICY "Allow admin and staff update access to driver applications" ON driver_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE email = auth.jwt() ->> 'email' 
            AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'role' = 'staff')
        )
    );

CREATE POLICY "Allow admin and staff update access to laundry partner applications" ON laundry_partner_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE email = auth.jwt() ->> 'email' 
            AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'role' = 'staff')
        )
    );

CREATE POLICY "Allow admin and staff update access to career applications" ON career_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE email = auth.jwt() ->> 'email' 
            AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'role' = 'staff')
        )
    );

-- Policies for INSERT
CREATE POLICY "Allow admin and staff insert access to driver applications" ON driver_applications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE email = auth.jwt() ->> 'email' 
            AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'role' = 'staff')
        )
    );

CREATE POLICY "Allow admin and staff insert access to laundry partner applications" ON laundry_partner_applications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE email = auth.jwt() ->> 'email' 
            AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'role' = 'staff')
        )
    );

CREATE POLICY "Allow admin and staff insert access to career applications" ON career_applications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE email = auth.jwt() ->> 'email' 
            AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'role' = 'staff')
        )
    );

-- Policies for DELETE
CREATE POLICY "Allow admin and staff delete access to driver applications" ON driver_applications
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE email = auth.jwt() ->> 'email' 
            AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'role' = 'staff')
        )
    );

CREATE POLICY "Allow admin and staff delete access to laundry partner applications" ON laundry_partner_applications
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE email = auth.jwt() ->> 'email' 
            AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'role' = 'staff')
        )
    );

CREATE POLICY "Allow admin and staff delete access to career applications" ON career_applications
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE email = auth.jwt() ->> 'email' 
            AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'role' = 'staff')
        )
    );