# Database Schema Synchronization Guide

This document ensures that the Supabase (live mode) and IndexedDB (demo mode) schemas are synchronized.

## Tables Comparison

| Table | IndexedDB | Supabase | Status |
|-------|-----------|----------|--------|
| users | ✅ | ✅ | Synced |
| addresses | ✅ | ✅ | Synced |
| service_categories | ✅ | ✅ | Synced |
| services | ✅ | ✅ | Synced |
| orders | ✅ | ✅ | Synced |
| order_items | ✅ | ✅ | Synced |
| depots | ✅ | ✅ | Synced |
| subscription_plans | ✅ | ✅ | Synced |
| customer_subscriptions | ✅ | ✅ | Synced |
| driver_routes | ✅ | ✅ | Synced |
| route_stops | ✅ | ✅ | Synced |
| notifications | ✅ | ✅ | Synced |
| settings | ✅ | ✅ | Synced |
| discount_codes | ✅ | ✅ | Synced |
| staff_shifts | ✅ | ✅ | Synced |
| service_areas | ✅ | ✅ | Synced |
| checkins | ✅ | ✅ | Synced |
| reviews | ✅ | ✅ | Synced |
| order_status_history | ✅ | ✅ | Synced |

## Field Name Mapping

All field names are synchronized between IndexedDB and Supabase. Key fields:

### addresses table
- `street` (not `street_address`)
- `unit` (not `unit_number`)
- `postal_code`
- `city`
- `province`
- `is_default`
- `delivery_instructions`

### notifications table
- `user_id`
- `title`
- `message`
- `type` - 'info', 'order', 'alert', 'promo', 'reminder', 'message'
- `is_read`
- `link` - Internal navigation link
- `action_url` - Alternative link field
- `metadata` - JSON data (order_id, etc.)
- `sent_by` - Admin who sent
- `broadcast_id` - Group notifications from same broadcast
- `created_at`

### order_items table
- `order_id`
- `service_id`
- `service_name` - Denormalized name
- `name` - Alternative name field
- `quantity`
- `unit_price`
- `total_price`
- `notes`

### checkins table
- `user_id`
- `type` - 'check_in' or 'check_out'
- `check_date`
- `check_time`
- `latitude`
- `longitude`
- `location_address`
- `notes`
- `device_info`
- `ip_address`

## Migration Scripts

If you need to update an existing Supabase database:

```sql
-- Add missing columns to notifications
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS link TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB,
ADD COLUMN IF NOT EXISTS sent_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS broadcast_id VARCHAR(50);

-- Rename address columns if they exist with old names
ALTER TABLE addresses RENAME COLUMN street_address TO street;
ALTER TABLE addresses RENAME COLUMN unit_number TO unit;

-- Add missing columns to order_items
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS service_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Create checkins table if not exists
CREATE TABLE IF NOT EXISTS checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_checkins_user ON checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_date ON checkins(check_date);
CREATE INDEX IF NOT EXISTS idx_checkins_type ON checkins(type);
```

## Notification System

### Sending Notifications

```javascript
import { notificationService, notificationTemplates } from './lib/utils';

// Send to one user
await notificationService.sendToUser(userId, {
  title: 'Hello!',
  message: 'This is a notification',
  type: 'info',
  link: '/account'
});

// Broadcast to all customers
await notificationService.broadcastToRole('customer', notification);

// Broadcast to all users
await notificationService.broadcastToAll(notification);

// Use templates
const notification = notificationTemplates.orderConfirmed(order);
await notificationService.sendToUser(order.customer_id, notification);
```

### Available Templates

- `orderConfirmed(order)` - Order confirmation
- `orderPickedUp(order)` - Items picked up
- `orderReady(order)` - Order ready for delivery
- `orderOutForDelivery(order)` - Driver on the way
- `orderDelivered(order)` - Order delivered
- `newPickupAssigned(order)` - For drivers
- `newDeliveryAssigned(order)` - For drivers
- `orderNeedsProcessing(order)` - For staff
- `welcomeCustomer(user)` - Welcome message
- `loyaltyReward(points)` - Loyalty points notification
- `pickupReminder(order)` - Reminder
- `deliveryReminder(order)` - Reminder

### Automatic Notifications

The system automatically sends notifications when:

1. **Order Created** - Customer gets confirmation, staff/admin get processing alert
2. **Status Changes** - Customer gets notified at each stage:
   - `picked_up` → "Items Picked Up"
   - `ready` → "Order Ready"
   - `out_for_delivery` → "Out for Delivery"
   - `delivered` → "Delivered"

## IndexedDB Version

Current version: **2**

When adding new stores or indexes, increment the version number in `src/lib/db.js`.
