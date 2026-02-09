# Zamzam Visits - Software Requirements Specification (SRS)

Document Version: 1.0
Date: February 4, 2026
Owner: Zamzam

## 1. Introduction
### 1.1 Purpose
This document defines the software requirements for Zamzam Visits, a web-based visit management system for salespeople and admins.

### 1.2 Scope
Zamzam Visits supports visit submission, role-based access, admin oversight, and GPS capture. It is optimized for mobile browser usage and enforces access control in the backend.

### 1.3 Definitions, Acronyms, and Abbreviations
- Admin: A user with full access to all visits and users.
- Salesperson: A user who can create and view only their own visits.
- Visit: A recorded customer interaction captured through the visit form.
- RLS: Row Level Security, enforced by the database.
- GPS: Global Positioning System for location coordinates.

### 1.4 References
- Zamzam Visits - System Requirements (User Specification)

## 2. Overall Description
### 2.1 Product Perspective
Zamzam Visits is a standalone web application backed by Supabase. It uses role-based access and real-time data updates.

### 2.2 User Classes and Characteristics
- Admins manage all visits and users.
- Salespeople submit visits and review their own records.

### 2.3 Operating Environment
- Modern desktop and mobile browsers.
- Mobile devices with GPS capability.
- HTTPS network connectivity.

### 2.4 Constraints
- Backend and database must be Supabase.
- No map display or Google Maps integration.
- Oman phone format must be enforced.
- RLS must enforce access control.

### 2.5 Assumptions and Dependencies
- Supabase Auth provides authentication and user IDs.
- The system runs in the Oman timezone for date interpretation.
- Browser geolocation permissions are available on sales devices.

## 3. System Features
### 3.1 Authentication and Role Routing
- SF-01: The system shall provide email and password authentication.
- SF-02: The system shall redirect users after login based on their role.

### 3.2 Visit Submission
- SF-03: Salespeople shall submit visits using a visit form.
- SF-04: Customer Name shall be required.
- SF-05: Phone Number shall accept 8 digits and be stored as +968XXXXXXXX.
- SF-06: The system shall auto-link the visit to the logged-in salesperson ID.
- SF-07: GPS latitude and longitude shall be captured automatically at submission.
- SF-08: A confirmation popup shall appear after successful submission.

### 3.3 Visit Viewing and Filtering
- SF-09: Salespeople shall view only their own visits.
- SF-10: Salespeople shall filter their visits by date and area.
- SF-11: Admins shall view all visits.
- SF-12: Admins shall filter visits by date, salesperson, and area.
- SF-13: Admins shall view detailed visit information.

### 3.4 Visit Management
- SF-14: Admins shall edit any visit.
- SF-15: Admins shall delete any visit.
- SF-16: Salespeople shall not edit visits.
- SF-17: Salespeople shall not delete visits.

### 3.5 Location Handling
- SF-18: The browser shall request location permission when capturing GPS.
- SF-19: The system shall attempt high-accuracy location when supported.
- SF-20: The system shall block submission if location permission is denied.

### 3.6 Real-Time Updates
- SF-21: Visit lists shall update in real time for authorized users.

## 4. External Interface Requirements
### 4.1 User Interfaces
- The Login page shall provide email and password login.
- The Sales Dashboard shall provide visit submission and a list of own visits.
- The Admin Dashboard shall provide visit management, filters, and user viewing.
- Sidebar navigation shall be used for core sections.

### 4.2 Hardware Interfaces
- Mobile GPS hardware is required for accurate location capture.

### 4.3 Software Interfaces
- Supabase database and authentication services.

### 4.4 Communications Interfaces
- HTTPS is required for all client-server communication.

## 5. Data Requirements
### 5.1 profiles
- id: UUID, primary key, linked to auth user.
- name: Text.
- role: Text, admin or salesperson.
- created_at: Timestamp.
- updated_at: Timestamp.

### 5.2 visits
- id: UUID, primary key.
- customer_name: Text.
- phone_number: Text in +968XXXXXXXX format.
- cr_number: Text, optional.
- area: Text.
- visit_date: Date.
- next_visit_date: Date, optional.
- have_zamzam: Boolean.
- latitude: Numeric.
- longitude: Numeric.
- salesperson_id: UUID, foreign key to profiles.
- created_at: Timestamp.
- updated_at: Timestamp.

## 6. Security Requirements
- SEC-01: RLS shall be enabled on all tables.
- SEC-02: Admins shall have full CRUD permissions on visits.
- SEC-03: Salespeople shall have read and create access only to their own visits.
- SEC-04: Users shall only see data they are authorized to view.

## 7. Non-Functional Requirements
- NFR-01: The system shall be responsive for desktop and mobile.
- NFR-02: Core screens shall load quickly on mobile networks.
- NFR-03: Data shall be validated in the backend and database.
- NFR-04: The system shall be stable for daily sales operations.

## 8. Acceptance Criteria
- AC-01: A salesperson can submit a visit and see it immediately in their list.
- AC-02: A salesperson cannot view or edit another salesperson's visits.
- AC-03: An admin can view, edit, and delete any visit.
- AC-04: Visit submissions without GPS permission are blocked with a clear error.
- AC-05: Phone numbers are stored as +968XXXXXXXX.
- AC-06: Visits can be filtered by date and area, and admins can filter by salesperson.
