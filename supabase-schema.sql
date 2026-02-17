-- ============================================
-- AMANI'S CLEANERS - COMPLETE DATABASE SCHEMA
-- ============================================
-- Run this SQL in your Supabase SQL Editor to set up the database
-- Version: 1.0.0
-- Last Updated: 2025

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE user_role AS ENUM ('customer', 'driver', 'staff', 'admin');
CREATE TYPE order_status AS ENUM (
  'pending_pickup', 
  'picked_up', 
  'processing', 
  'ready', 
  'out_for_delivery', 
  'delivered', 
  'cancelled'
);
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded', 'failed');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'online', 'subscription');
CREATE TYPE service_type AS ENUM ('wash_fold', 'dry_clean', 'hang_dry', 'specialty');
CREATE TYPE subscription_type AS ENUM ('student_monthly', 'student_semester', 'student_year', 'silver', 'gold');
CREATE TYPE depot_status AS ENUM ('active', 'inactive');
CREATE TYPE shift_status AS ENUM ('scheduled', 'active', 'completed', 'cancelled');

-- ============================================
-- USERS TABLE
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(64), -- SHA-256 hash for phone-based login (not Supabase Auth)
  role user_role DEFAULT 'customer',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  referral_code VARCHAR(20) UNIQUE,
  referred_by UUID REFERENCES users(id),
  first_order_discount_used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for user lookup
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- CUSTOMER ADDRESSES
-- ============================================

CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(50) DEFAULT 'Home',
  street VARCHAR(255) NOT NULL,
  unit VARCHAR(50),
  city VARCHAR(100) NOT NULL,
  province VARCHAR(50) DEFAULT 'ON',
  postal_code VARCHAR(10) NOT NULL,
  country VARCHAR(50) DEFAULT 'Canada',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_default BOOLEAN DEFAULT false,
  delivery_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_addresses_user ON addresses(user_id);

-- ============================================
-- SERVICE AREAS (Regions we serve)
-- ============================================

CREATE TABLE service_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  region VARCHAR(100),
  postal_code_prefix VARCHAR(10),
  is_active BOOLEAN DEFAULT true,
  extra_delivery_fee DECIMAL(10, 2) DEFAULT 0,
  min_order_amount DECIMAL(10, 2) DEFAULT 64.01,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert service areas
INSERT INTO service_areas (name, region, postal_code_prefix, is_active) VALUES
('Toronto', 'Toronto', 'M', true),
('North York', 'Toronto', 'M', true),
('Etobicoke', 'Toronto', 'M', true),
('Scarborough', 'Toronto', 'M', true),
('Brampton', 'Peel', 'L', true),
('Mississauga', 'Peel', 'L', true),
('Caledon', 'Peel', 'L', true),
('Vaughan', 'York', 'L', true),
('Richmond Hill', 'York', 'L', true),
('Markham', 'York', 'L', true),
('Aurora', 'York', 'L', true),
('King', 'York', 'L', true),
('Stouffville', 'York', 'L', true),
('Halton Hills', 'Halton', 'L', true),
('Milton', 'Halton', 'L', true),
('Oakville', 'Halton', 'L', true),
('Burlington', 'Halton', 'L', true);

-- ============================================
-- DEPOTS (Partner Locations)
-- ============================================

CREATE TABLE depots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(10) UNIQUE NOT NULL,
  street_address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  postal_code VARCHAR(10) NOT NULL,
  phone VARCHAR(20),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  status depot_status DEFAULT 'active',
  operating_hours JSONB,
  manager_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert depot locations
INSERT INTO depots (name, code, street_address, city, postal_code) VALUES
('Amani Main - Weston', 'AMN-WEST1', '325 Weston Road, Unit 5D', 'Toronto', 'M6N 3P1'),
('Amani North York', 'AMN-NORK', '3455 Weston Road', 'North York', 'M9M 0G4'),
('A&M Executive Cleaners', 'DEP-AMEX', 'Partner Location', 'Toronto', 'M'),
('Sun Drycleaners', 'DEP-SUND', 'Partner Location', 'Toronto', 'M'),
('La Rosa Dry Cleaners', 'DEP-LARO', 'Partner Location', 'Toronto', 'M'),
('Kembass Cleaners', 'DEP-KEMB', 'Partner Location', 'Toronto', 'M'),
('Nu-Brit Cleaners', 'DEP-NUBR', 'Partner Location', 'Toronto', 'M'),
('Trendy Laundromat & Drycleaners', 'DEP-TREN', 'Partner Location', 'Toronto', 'M'),
('Plaza Coin Laundry & Dry Cleaners', 'DEP-PLAZ', 'Partner Location', 'Toronto', 'M'),
('Cadillac Drycleaners', 'DEP-CADI', 'Partner Location', 'Toronto', 'M');

-- ============================================
-- SERVICE CATEGORIES
-- ============================================

CREATE TABLE service_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert categories
INSERT INTO service_categories (name, slug, description, icon, display_order) VALUES
('Laundry', 'laundry', 'Wash & Fold services', 'washing-machine', 1),
('Shirts & Blouses', 'shirts-blouses', 'Professional shirt cleaning', 'shirt', 2),
('Pants & Shorts', 'pants-shorts', 'All types of bottoms', 'pants', 3),
('Skirts', 'skirts', 'Skirts of all lengths', 'skirt', 4),
('Dresses', 'dresses', 'From casual to formal', 'dress', 5),
('Jackets', 'jackets', 'Blazers, coats, and more', 'jacket', 6),
('Sweaters', 'sweaters', 'Delicate knit care', 'sweater', 7),
('Wedding & Formal', 'wedding-formal', 'Special occasion attire', 'wedding', 8),
('Suits', 'suits', 'Professional suit cleaning', 'suit', 9),
('Ties & Scarves', 'ties-scarves', 'Accessories', 'tie', 10),
('Coats & Winter Wear', 'coats-winter', 'Heavy outerwear', 'coat', 11),
('Bedding', 'bedding', 'Blankets, comforters, duvets', 'bed', 12),
('Culinary Linen', 'culinary-linen', 'Restaurant & kitchen linens', 'utensils', 13);

-- ============================================
-- SERVICES (Price List Items)
-- ============================================

CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES service_categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  base_price DECIMAL(10, 2) NOT NULL,
  price_type VARCHAR(20) DEFAULT 'fixed', -- 'fixed', 'per_lb', 'starting_from'
  service_type service_type DEFAULT 'dry_clean',
  processing_days INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert all services from the price list
INSERT INTO services (category_id, name, base_price, price_type, service_type, display_order) VALUES
-- Laundry
((SELECT id FROM service_categories WHERE slug = 'laundry'), 'Wash & Fold (Regular)', 2.39, 'per_lb', 'wash_fold', 1),
((SELECT id FROM service_categories WHERE slug = 'laundry'), 'Wash & Fold (Commercial)', 2.25, 'per_lb', 'wash_fold', 2),

-- Shirts & Blouses
((SELECT id FROM service_categories WHERE slug = 'shirts-blouses'), 'Shirts - Laundered On Hanger', 6.50, 'fixed', 'wash_fold', 1),
((SELECT id FROM service_categories WHERE slug = 'shirts-blouses'), 'Shirts - Dryclean On Hanger', 8.50, 'fixed', 'dry_clean', 2),
((SELECT id FROM service_categories WHERE slug = 'shirts-blouses'), 'Shirts - Dryclean Folded', 9.50, 'fixed', 'dry_clean', 3),
((SELECT id FROM service_categories WHERE slug = 'shirts-blouses'), 'Shirts - Polo/Golf', 8.50, 'fixed', 'dry_clean', 4),
((SELECT id FROM service_categories WHERE slug = 'shirts-blouses'), 'Blouse', 12.00, 'fixed', 'dry_clean', 5),
((SELECT id FROM service_categories WHERE slug = 'shirts-blouses'), 'Blouse - Silk or Linen', 15.00, 'fixed', 'dry_clean', 6),
((SELECT id FROM service_categories WHERE slug = 'shirts-blouses'), 'Blouse - Sequined or Beaded', 15.00, 'fixed', 'dry_clean', 7),

-- Pants & Shorts
((SELECT id FROM service_categories WHERE slug = 'pants-shorts'), 'Pants - Regular Poly-Blend', 9.50, 'fixed', 'dry_clean', 1),
((SELECT id FROM service_categories WHERE slug = 'pants-shorts'), 'Pants - Cotton', 11.00, 'fixed', 'dry_clean', 2),
((SELECT id FROM service_categories WHERE slug = 'pants-shorts'), 'Pants - Linen', 17.00, 'fixed', 'dry_clean', 3),
((SELECT id FROM service_categories WHERE slug = 'pants-shorts'), 'Pants - Silk', 17.00, 'fixed', 'dry_clean', 4),
((SELECT id FROM service_categories WHERE slug = 'pants-shorts'), 'Pants - Velvet', 16.00, 'fixed', 'dry_clean', 5),
((SELECT id FROM service_categories WHERE slug = 'pants-shorts'), 'Shorts', 8.00, 'fixed', 'dry_clean', 6),

-- Skirts
((SELECT id FROM service_categories WHERE slug = 'skirts'), 'Skirts - Regular Plain', 9.00, 'fixed', 'dry_clean', 1),
((SELECT id FROM service_categories WHERE slug = 'skirts'), 'Skirts - Long Plain or Cotton', 14.00, 'fixed', 'dry_clean', 2),
((SELECT id FROM service_categories WHERE slug = 'skirts'), 'Skirts - Silk', 19.00, 'fixed', 'dry_clean', 3),
((SELECT id FROM service_categories WHERE slug = 'skirts'), 'Skirts - Lined or Linen', 19.00, 'fixed', 'dry_clean', 4),

-- Dresses
((SELECT id FROM service_categories WHERE slug = 'dresses'), 'Dress - Regular', 18.00, 'fixed', 'dry_clean', 1),
((SELECT id FROM service_categories WHERE slug = 'dresses'), 'Dress - Pleated/Long', 20.00, 'fixed', 'dry_clean', 2),
((SELECT id FROM service_categories WHERE slug = 'dresses'), 'Dress - Cocktail/Fancy', 28.00, 'fixed', 'dry_clean', 3),
((SELECT id FROM service_categories WHERE slug = 'dresses'), 'Dress - Silk', 32.00, 'fixed', 'dry_clean', 4),
((SELECT id FROM service_categories WHERE slug = 'dresses'), 'Dress - Linen, Velvet, Lined', 35.00, 'fixed', 'dry_clean', 5),
((SELECT id FROM service_categories WHERE slug = 'dresses'), 'Dress - Beads & Sequins', 35.00, 'fixed', 'dry_clean', 6),

-- Jackets
((SELECT id FROM service_categories WHERE slug = 'jackets'), 'Blazer/Suit Jacket', 14.00, 'fixed', 'dry_clean', 1),
((SELECT id FROM service_categories WHERE slug = 'jackets'), 'Heavy Jacket', 26.00, 'fixed', 'dry_clean', 2),
((SELECT id FROM service_categories WHERE slug = 'jackets'), 'Jean Jacket', 14.00, 'fixed', 'dry_clean', 3),
((SELECT id FROM service_categories WHERE slug = 'jackets'), '3/4 Length Jacket', 27.00, 'fixed', 'dry_clean', 4),
((SELECT id FROM service_categories WHERE slug = 'jackets'), 'Full Length Jacket', 32.00, 'fixed', 'dry_clean', 5),
((SELECT id FROM service_categories WHERE slug = 'jackets'), 'Faux Fur Coat', 40.00, 'starting_from', 'dry_clean', 6),
((SELECT id FROM service_categories WHERE slug = 'jackets'), 'Leather Trim Jacket', 42.00, 'starting_from', 'dry_clean', 7),
((SELECT id FROM service_categories WHERE slug = 'jackets'), 'Vest', 12.00, 'fixed', 'dry_clean', 8),
((SELECT id FROM service_categories WHERE slug = 'jackets'), 'Jacket with Attached Hood', 27.00, 'fixed', 'dry_clean', 9),

-- Sweaters
((SELECT id FROM service_categories WHERE slug = 'sweaters'), 'Sweater', 10.00, 'fixed', 'dry_clean', 1),
((SELECT id FROM service_categories WHERE slug = 'sweaters'), 'Sweater Bulky/Silk', 12.00, 'fixed', 'dry_clean', 2),
((SELECT id FROM service_categories WHERE slug = 'sweaters'), 'Sweater Dress', 17.00, 'fixed', 'dry_clean', 3),
((SELECT id FROM service_categories WHERE slug = 'sweaters'), 'Sweater Sequins or Beaded', 19.00, 'fixed', 'dry_clean', 4),
((SELECT id FROM service_categories WHERE slug = 'sweaters'), 'Sweater Cashmere', 19.00, 'fixed', 'dry_clean', 5),

-- Wedding & Formal
((SELECT id FROM service_categories WHERE slug = 'wedding-formal'), 'Wedding Gowns Preserved and Boxed', 210.00, 'starting_from', 'specialty', 1),
((SELECT id FROM service_categories WHERE slug = 'wedding-formal'), 'Bridal Veil', 50.00, 'starting_from', 'specialty', 2),
((SELECT id FROM service_categories WHERE slug = 'wedding-formal'), 'Prom Dress', 28.00, 'starting_from', 'dry_clean', 3),
((SELECT id FROM service_categories WHERE slug = 'wedding-formal'), 'Tuxedo 2 piece', 27.00, 'fixed', 'dry_clean', 4),
((SELECT id FROM service_categories WHERE slug = 'wedding-formal'), 'Tuxedo 3 piece', 33.00, 'fixed', 'dry_clean', 5),
((SELECT id FROM service_categories WHERE slug = 'wedding-formal'), 'Formal Shirt - French Cuff or Ruffled', 11.00, 'fixed', 'dry_clean', 6),

-- Suits
((SELECT id FROM service_categories WHERE slug = 'suits'), 'Men''s or Women''s 2 piece suit', 24.00, 'starting_from', 'dry_clean', 1),
((SELECT id FROM service_categories WHERE slug = 'suits'), 'Men''s or Women''s 3 piece suit', 29.00, 'starting_from', 'dry_clean', 2),
((SELECT id FROM service_categories WHERE slug = 'suits'), 'Child 2 pc Suit', 15.00, 'starting_from', 'dry_clean', 3),
((SELECT id FROM service_categories WHERE slug = 'suits'), 'Child 3 pc Suit', 18.00, 'starting_from', 'dry_clean', 4),

-- Ties & Scarves
((SELECT id FROM service_categories WHERE slug = 'ties-scarves'), 'Tie', 6.00, 'fixed', 'dry_clean', 1),
((SELECT id FROM service_categories WHERE slug = 'ties-scarves'), 'Pocket Square', 6.00, 'fixed', 'dry_clean', 2),
((SELECT id FROM service_categories WHERE slug = 'ties-scarves'), 'Scarf', 7.00, 'starting_from', 'dry_clean', 3),

-- Coats & Winter Wear
((SELECT id FROM service_categories WHERE slug = 'coats-winter'), 'Ski Pants', 18.00, 'starting_from', 'dry_clean', 1),
((SELECT id FROM service_categories WHERE slug = 'coats-winter'), 'Ski Jacket', 21.00, 'starting_from', 'dry_clean', 2),
((SELECT id FROM service_categories WHERE slug = 'coats-winter'), 'Ski Suit 2 pieces', 30.00, 'starting_from', 'dry_clean', 3),
((SELECT id FROM service_categories WHERE slug = 'coats-winter'), 'Ski Suit 2 pieces - Down Filled', 89.00, 'starting_from', 'dry_clean', 4),
((SELECT id FROM service_categories WHERE slug = 'coats-winter'), '3/4 Length Car Coat', 35.00, 'starting_from', 'dry_clean', 5),
((SELECT id FROM service_categories WHERE slug = 'coats-winter'), 'Full Length Coat', 40.00, 'starting_from', 'dry_clean', 6),
((SELECT id FROM service_categories WHERE slug = 'coats-winter'), 'Raincoat, Spring Jacket, Windbreaker', 26.00, 'starting_from', 'dry_clean', 7),
((SELECT id FROM service_categories WHERE slug = 'coats-winter'), 'Winter Jacket Men or Women', 26.00, 'starting_from', 'dry_clean', 8),
((SELECT id FROM service_categories WHERE slug = 'coats-winter'), 'Down Filled Jacket', 50.00, 'starting_from', 'dry_clean', 9),
((SELECT id FROM service_categories WHERE slug = 'coats-winter'), 'Wool Coat', 50.00, 'starting_from', 'dry_clean', 10),
((SELECT id FROM service_categories WHERE slug = 'coats-winter'), 'Canada Goose Jackets', 60.00, 'starting_from', 'dry_clean', 11),
((SELECT id FROM service_categories WHERE slug = 'coats-winter'), 'Laundered - Winter Coat', 22.00, 'fixed', 'wash_fold', 12),

-- Bedding
((SELECT id FROM service_categories WHERE slug = 'bedding'), 'Blanket - Twin or Full', 25.00, 'fixed', 'wash_fold', 1),
((SELECT id FROM service_categories WHERE slug = 'bedding'), 'Blanket - Queen or King', 35.00, 'fixed', 'wash_fold', 2),
((SELECT id FROM service_categories WHERE slug = 'bedding'), 'Comforter - Twin or Full', 35.00, 'fixed', 'wash_fold', 3),
((SELECT id FROM service_categories WHERE slug = 'bedding'), 'Comforter - Queen or King', 45.00, 'fixed', 'wash_fold', 4),
((SELECT id FROM service_categories WHERE slug = 'bedding'), 'Comforter - Down Twin or Full', 50.00, 'fixed', 'dry_clean', 5),
((SELECT id FROM service_categories WHERE slug = 'bedding'), 'Comforter - Down Queen or King', 66.00, 'fixed', 'dry_clean', 6),
((SELECT id FROM service_categories WHERE slug = 'bedding'), 'Duvet', 45.00, 'starting_from', 'dry_clean', 7),
((SELECT id FROM service_categories WHERE slug = 'bedding'), 'Duvet Cover', 22.00, 'starting_from', 'wash_fold', 8),

-- Culinary Linen
((SELECT id FROM service_categories WHERE slug = 'culinary-linen'), 'Table Cloths 90" x 90"', 27.00, 'fixed', 'dry_clean', 1),
((SELECT id FROM service_categories WHERE slug = 'culinary-linen'), 'Table Cloths 120" x 72"', 30.00, 'fixed', 'dry_clean', 2),
((SELECT id FROM service_categories WHERE slug = 'culinary-linen'), 'Table Cloths 120" Round', 22.00, 'fixed', 'dry_clean', 3),
((SELECT id FROM service_categories WHERE slug = 'culinary-linen'), 'Chef Coats/Jackets', 16.00, 'fixed', 'dry_clean', 4),
((SELECT id FROM service_categories WHERE slug = 'culinary-linen'), 'Aprons', 9.75, 'fixed', 'wash_fold', 5),
((SELECT id FROM service_categories WHERE slug = 'culinary-linen'), 'Dinner Napkin', 5.00, 'fixed', 'wash_fold', 6);

-- ============================================
-- SUBSCRIPTION PLANS
-- ============================================

CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  type subscription_type NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  features JSONB,
  pounds_included INT,
  validity_days INT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO subscription_plans (name, slug, type, price, description, pounds_included, validity_days) VALUES
('Student Monthly', 'student-monthly', 'student_monthly', 235.00, 'Perfect for students - Monthly plan', 100, 30),
('Student 1 Semester', 'student-semester', 'student_semester', 575.00, 'Best value for a semester', 250, 120),
('Student 2 Semester (Popular)', 'student-year', 'student_year', 1080.00, 'Full academic year coverage', 500, 240),
('Silver - For Professionals', 'silver', 'silver', 275.00, 'Ideal for working professionals', 120, 30),
('Gold - Ideal for Couples', 'gold', 'gold', 420.50, 'Perfect for households', 200, 30);

-- ============================================
-- CUSTOMER SUBSCRIPTIONS
-- ============================================

CREATE TABLE customer_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  pounds_remaining INT,
  status VARCHAR(20) DEFAULT 'active',
  auto_renew BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ORDERS
-- ============================================

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_code VARCHAR(7) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id),
  customer_id UUID REFERENCES users(id),
  depot_id UUID REFERENCES depots(id),
  
  -- Customer info (denormalized for easy access)
  customer_name VARCHAR(200) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255),
  is_guest_order BOOLEAN DEFAULT false,
  
  -- Address (foreign keys)
  pickup_address_id UUID REFERENCES addresses(id),
  delivery_address_id UUID REFERENCES addresses(id),
  
  -- Address (text for easy display)
  pickup_address TEXT,
  delivery_address TEXT,
  
  -- Order type
  order_type VARCHAR(20) DEFAULT 'pickup', -- 'pickup' or 'drop-off'
  
  -- Status
  status order_status DEFAULT 'pending_pickup',
  
  -- Pricing
  subtotal DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  discount_code VARCHAR(50),
  tax DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  delivery_fee DECIMAL(10, 2) DEFAULT 0,
  same_day_fee DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) DEFAULT 0,
  
  -- Payment
  payment_status payment_status DEFAULT 'pending',
  payment_method payment_method,
  
  -- Scheduling
  pickup_date DATE,
  pickup_time_slot VARCHAR(50), -- '7am-11am' or '6pm-10pm'
  delivery_date DATE,
  delivery_time_slot VARCHAR(50),
  is_same_day BOOLEAN DEFAULT false,
  
  -- Weight (for laundry)
  estimated_weight DECIMAL(10, 2),
  actual_weight DECIMAL(10, 2),
  
  -- Notes
  customer_notes TEXT,
  reference_notes TEXT,
  staff_notes TEXT,
  driver_notes TEXT,
  delivery_instructions TEXT,
  manual_reference_notes TEXT,
  
  -- Assignment
  pickup_driver_id UUID REFERENCES users(id),
  delivery_driver_id UUID REFERENCES users(id),
  processed_by_staff_id UUID REFERENCES users(id),
  
  -- Timestamps
  confirmed_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  processing_started_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  out_for_delivery_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_reference ON orders(reference_code);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_pickup_date ON orders(pickup_date);
CREATE INDEX idx_orders_delivery_date ON orders(delivery_date);

-- ============================================
-- ORDER ITEMS
-- ============================================

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL, -- Nullable for custom items like laundry
  service_name VARCHAR(255), -- Denormalized for easy display
  name VARCHAR(255), -- Alternative name field
  quantity DECIMAL(10, 2) DEFAULT 1, -- DECIMAL to support per-pound items like laundry
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ============================================
-- DISCOUNT CODES
-- ============================================

CREATE TABLE discount_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) DEFAULT 'percentage', -- 'percentage', 'fixed'
  discount_value DECIMAL(10, 2) NOT NULL,
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  max_uses INT,
  uses_count INT DEFAULT 0,
  valid_from DATE,
  valid_until DATE,
  is_active BOOLEAN DEFAULT true,
  first_order_only BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default codes
INSERT INTO discount_codes (code, description, discount_type, discount_value, first_order_only) VALUES
('WELCOME15', '15% off first order for new app signups', 'percentage', 15, true),
('FIRST20', '$20 off first laundry order', 'fixed', 20, true),
('SENIOR10', '10% senior discount (in-store)', 'percentage', 10, false);

-- ============================================
-- DRIVER ASSIGNMENTS & ROUTES
-- ============================================

CREATE TABLE driver_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES users(id),
  route_date DATE NOT NULL,
  route_type VARCHAR(20) DEFAULT 'mixed', -- 'pickup', 'delivery', 'mixed'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'active', 'completed'
  start_location JSONB,
  end_location JSONB,
  total_stops INT DEFAULT 0,
  completed_stops INT DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE route_stops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID REFERENCES driver_routes(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  stop_type VARCHAR(20) NOT NULL, -- 'pickup', 'delivery'
  sequence_number INT NOT NULL,
  address JSONB NOT NULL,
  scheduled_time VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'arrived', 'completed', 'failed'
  arrived_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  photo_url TEXT,
  signature_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STAFF SHIFTS
-- ============================================

CREATE TABLE staff_shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES users(id),
  depot_id UUID REFERENCES depots(id),
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status shift_status DEFAULT 'scheduled',
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ORDER STATUS HISTORY
-- ============================================

CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status order_status NOT NULL,
  changed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CHECK-INS (Staff/Driver attendance tracking)
-- ============================================

CREATE TABLE checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- 'check_in' or 'check_out'
  check_date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_time TIMESTAMPTZ DEFAULT NOW(),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_address TEXT,
  notes TEXT,
  device_info TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_checkins_user ON checkins(user_id);
CREATE INDEX idx_checkins_date ON checkins(check_date);
CREATE INDEX idx_checkins_type ON checkins(type);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info', -- 'info', 'order', 'alert', 'promo', 'reminder', 'message'
  is_read BOOLEAN DEFAULT false,
  link TEXT, -- Internal link for navigation
  action_url TEXT, -- Alternative field for backwards compatibility
  metadata JSONB, -- Additional data (order_id, etc.)
  sent_by UUID REFERENCES users(id), -- Admin who sent the notification
  broadcast_id VARCHAR(50), -- Group notifications from same broadcast
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ============================================
-- REVIEWS
-- ============================================

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id),
  user_id UUID REFERENCES users(id),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  reply TEXT,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SETTINGS
-- ============================================

CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO settings (key, value, description) VALUES
('business_info', '{"name": "Amani''s Cleaners", "slogan": "Proudly Canadian Owned since 2013", "phone": ["437-215-6321", "647-764-5658"], "email": "amaniscleaners@gmail.com", "website": "amanicleaners.com"}', 'Business information'),
('operating_hours', '{"pickup": ["7:00 AM - 11:00 AM", "6:00 PM - 10:00 PM"], "delivery": ["7:00 AM - 11:00 AM", "6:00 PM - 10:00 PM"]}', 'Operating hours'),
('pricing_rules', '{"min_order_weight": 23, "min_order_amount": 64.01, "same_day_fee_range": [20, 35], "tax_rate": 0.13}', 'Pricing rules'),
('discounts', '{"first_order_percent": 15, "senior_percent": 10}', 'Discount settings'),
('app_mode', '{"mode": "live", "demo_enabled": false}', 'Application mode settings - controls demo/live mode');

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to generate unique 7-digit reference code
CREATE OR REPLACE FUNCTION generate_reference_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := LPAD(FLOOR(RANDOM() * 10000000)::TEXT, 7, '0');
    SELECT EXISTS(SELECT 1 FROM orders WHERE reference_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate reference code
CREATE OR REPLACE FUNCTION set_reference_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reference_code IS NULL THEN
    NEW.reference_code := generate_reference_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_reference_code
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_reference_code();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_addresses_updated_at BEFORE UPDATE ON addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_depots_updated_at BEFORE UPDATE ON depots FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to record order status changes
CREATE OR REPLACE FUNCTION record_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (order_id, status, changed_by)
    VALUES (NEW.id, NEW.status, NEW.processed_by_staff_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_order_status_history
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION record_order_status_change();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Note: This app uses custom authentication (not Supabase Auth)
-- RLS policies are permissive to allow the app to function
-- Security is enforced at the application level

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users table - allow all operations (auth enforced in app)
CREATE POLICY "Allow all user operations" ON users FOR ALL USING (true) WITH CHECK (true);

-- Addresses - allow all operations
CREATE POLICY "Allow all address operations" ON addresses FOR ALL USING (true) WITH CHECK (true);

-- Orders - allow all operations
CREATE POLICY "Allow all order operations" ON orders FOR ALL USING (true) WITH CHECK (true);

-- Order items - allow all operations
CREATE POLICY "Allow all order item operations" ON order_items FOR ALL USING (true) WITH CHECK (true);

-- Notifications - allow all operations
CREATE POLICY "Allow all notification operations" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- Reviews - allow all operations
CREATE POLICY "Allow all review operations" ON reviews FOR ALL USING (true) WITH CHECK (true);

-- Customer subscriptions - allow all operations
CREATE POLICY "Allow all subscription operations" ON customer_subscriptions FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- VIEWS
-- ============================================

-- Dashboard statistics view
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURRENT_DATE) as orders_today,
  (SELECT COUNT(*) FROM orders WHERE status = 'pending_pickup') as pending_orders,
  (SELECT COUNT(*) FROM orders WHERE status = 'processing') as processing_orders,
  (SELECT COUNT(*) FROM orders WHERE status = 'out_for_delivery') as out_for_delivery,
  (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE DATE(created_at) = CURRENT_DATE AND payment_status = 'paid') as revenue_today,
  (SELECT COUNT(*) FROM users WHERE role = 'customer' AND DATE(created_at) = CURRENT_DATE) as new_customers_today;

-- Order details view with customer info
CREATE OR REPLACE VIEW order_details AS
SELECT 
  o.*,
  u.first_name as user_first_name,
  u.last_name as user_last_name,
  pa.street as pickup_street,
  pa.city as pickup_city,
  pa.postal_code as pickup_postal,
  da.street as delivery_street,
  da.city as delivery_city,
  da.postal_code as delivery_postal,
  d.name as depot_name
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN addresses pa ON o.pickup_address_id = pa.id
LEFT JOIN addresses da ON o.delivery_address_id = da.id
LEFT JOIN depots d ON o.depot_id = d.id;

-- ============================================
-- SEED DEMO DATA
-- ============================================

-- Create demo admin user (password should be set via Supabase Auth)
-- For phone login, password_hash is SHA-256 of 'demo123': d3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791
INSERT INTO users (id, email, phone, first_name, last_name, role, is_verified, password_hash) VALUES
('00000000-0000-0000-0000-000000000001', 'admin@amanicleaners.com', '14372156321', 'Admin', 'Amani', 'admin', true, 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791'),
('00000000-0000-0000-0000-000000000002', 'driver@amanicleaners.com', '16475550001', 'Demo', 'Driver', 'driver', true, 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791'),
('00000000-0000-0000-0000-000000000003', 'staff@amanicleaners.com', '16475550002', 'Demo', 'Staff', 'staff', true, 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791'),
('00000000-0000-0000-0000-000000000004', 'customer@example.com', '16475550003', 'Demo', 'Customer', 'customer', true, 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791');

COMMENT ON TABLE orders IS 'Main orders table - every online or in-App order generates a unique 7-digit serial reference code';
COMMENT ON COLUMN orders.reference_code IS 'Unique 7-digit serial reference code for online/app orders';
COMMENT ON COLUMN orders.manual_reference_notes IS 'Column for manual reference number notes';
COMMENT ON COLUMN orders.customer_notes IS 'Customer interface extra note column within App for self order';
