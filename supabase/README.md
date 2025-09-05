# Real Estate Platform Database Setup

This directory contains the complete database schema and setup for the refined real estate platform.

## 🚀 Quick Start

To set up the database from scratch on a fresh Supabase instance:

1. **Run the main schema migration:**
   ```sql
   -- Copy and paste the contents of 0011_complete_database_schema.sql
   -- into your Supabase SQL editor
   ```

2. **Run the seed data migration:**
   ```sql
   -- Copy and paste the contents of 0012_seed_data_and_setup.sql
   -- into your Supabase SQL editor
   ```

## 📁 Migration Files

### `0011_complete_database_schema.sql`
**Main database schema creation**
- Creates all enums (FUB stages, timeline phases, action types, etc.)
- Creates all tables (organizations, persons, properties, timelines, etc.)
- Sets up proper indexes for performance
- Creates triggers for automatic timestamp updates
- Implements Row Level Security (RLS) policies
- Inserts default step templates

### `0012_seed_data_and_setup.sql`
**Sample data and additional setup**
- Creates sample organization (Sunset Real Estate Group)
- Creates sample agents and buyers
- Creates sample properties with photos
- Establishes buyer-property relationships
- Creates sample timelines and action items
- Sets up sample chatbot conversations
- Adds default system settings

## 🏗️ Database Architecture

### Core Tables
- **`organizations`** - Multi-tenant organization structure
- **`persons`** - Unified table for agents and buyers
- **`buyer_profiles`** - Buyer-specific financial and preference data
- **`properties`** - Property listings with comprehensive details
- **`buyer_properties`** - Junction table linking buyers to properties
- **`timelines`** - Transaction progress tracking
- **`timeline_steps`** - Individual steps within timelines
- **`action_items`** - Task management for agents and buyers

### Advanced Features
- **`step_templates`** - Customizable workflow templates
- **`documents`** - Document management with AI processing
- **`net_sheets`** - Financial calculations and transparency
- **`conversations`** & **`messages`** - AI chatbot system
- **`gmail_integrations`** & **`email_messages`** - Email sync
- **`fub_sync_log`** - CRM integration logging

## 🔐 Security Features

- **Row Level Security (RLS)** enabled on all tables
- **Organization isolation** - users can only see their organization's data
- **Role-based access** - different permissions for agents vs buyers
- **Secure authentication** integration with Supabase Auth

## 📊 Sample Data Included

The seed data includes:
- **1 organization** with realistic business information
- **2 agents** with license details
- **3 buyers** with different profiles and needs
- **3 properties** in different LA neighborhoods
- **Complete timelines** showing different stages of the buying process
- **Action items** demonstrating task management
- **Chatbot conversations** with realistic Q&A
- **Financial data** including net sheets and documents

## 🛠️ Customization

### Adding New Organizations
1. Insert into `organizations` table
2. Create step templates specific to the organization
3. Add persons (agents/buyers) with the organization_id

### Customizing Workflows
1. Modify `step_templates` for your organization
2. Update `business_rules` JSON for automation logic
3. Customize `action_item_type` enum if needed

### Extending the Schema
- Use the `custom_data` JSONB fields for organization-specific data
- Add new tables following the established patterns
- Ensure proper RLS policies for new tables

## 🔍 Testing the Setup

After running both migrations, you should be able to:

1. **Query sample data:**
   ```sql
   -- View all organizations
   SELECT * FROM organizations;
   
   -- View agents and buyers
   SELECT * FROM persons WHERE primary_role = 'agent';
   SELECT * FROM persons WHERE primary_role = 'buyer';
   
   -- View properties with photos
   SELECT p.*, pp.url as photo_url 
   FROM properties p 
   JOIN property_photos pp ON p.id = pp.property_id;
   
   -- View buyer timelines
   SELECT bp.*, t.current_phase, t.current_fub_stage
   FROM buyer_properties bp
   JOIN timelines t ON bp.id = t.buyer_property_id;
   ```

2. **Test RLS policies:**
   - Create a test user in Supabase Auth
   - Insert a person record for that user
   - Verify they can only see their organization's data

## 📚 Key Features

### Multi-Tenant Architecture
- Each organization has completely isolated data
- Scalable for multiple real estate companies
- Proper data segregation and security

### Flexible Timeline System
- Customizable step templates per organization
- Property-specific timeline customization
- Comprehensive progress tracking

### Role-Based Task Management
- Clear separation of agent vs buyer responsibilities
- Priority and status tracking
- Due date management

### AI Chatbot Integration
- Built-in conversation tracking
- Source citation and metadata
- Multi-tenant support

### Financial Transparency
- Net sheet calculations
- Monthly payment breakdowns
- Closing cost estimates

## 🚨 Important Notes

1. **Run migrations in order** - schema first, then seed data
2. **Test RLS policies** before going to production
3. **Customize step templates** for your organization's workflow
4. **Update organization settings** in `system_settings` table
5. **Configure FUB integration** if using Follow Up Boss CRM

## 🆘 Troubleshooting

### Common Issues

**"Function auth.get_user_organization_id() does not exist"**
- Ensure you're running the migrations in the correct order
- Check that the function was created in step 11

**"RLS policy violation"**
- Verify the user has a corresponding record in the `persons` table
- Check that the `organization_id` matches between user and data

**"Foreign key constraint violation"**
- Ensure all referenced IDs exist before creating relationships
- Check the order of data insertion in the seed migration

### Getting Help

If you encounter issues:
1. Check the Supabase logs for detailed error messages
2. Verify all migrations completed successfully
3. Test with the sample data queries above
4. Ensure your Supabase instance supports all PostgreSQL features used

## 🔄 Future Updates

This schema is designed to be extensible. Future migrations can:
- Add new enum values
- Create additional tables
- Modify existing structures
- Add new integrations

Always test migrations on a development instance before applying to production.
