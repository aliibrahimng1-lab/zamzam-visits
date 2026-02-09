# Zamzam Visits - System Requirements (User Specification)

Document Version: 1.1
Date: February 4, 2026
Owner: Zamzam
Status: Draft

## 1. Purpose
This document defines the user-facing system requirements for Zamzam Visits, a web-based visit management system used by salespeople and admins.

## 2. System Type
Zamzam Visits is a web-based visit management system with role-based access control. It is optimized for mobile use by salespeople and provides full administrative oversight for admins.

## 3. Objectives
- Provide a fast, mobile-first workflow to submit customer visits.
- Ensure admins have full visibility and control of all visits.
- Enforce role-based access in the backend using RLS.
- Capture accurate GPS coordinates at the time of submission.

## 4. User Roles and Permissions
### 4.1 Admin
Admins have full control over the system. Admins can:
- View all visits created by any salesperson.
- Edit any visit.
- Delete any visit.
- View all users and their information.
- Filter visits by date, salesperson, and area.
- View detailed visit information including customer name, CR number, area, visit date, next visit date, and GPS coordinates.

### 4.2 Salesperson
Salespeople have limited access focused on their own visits. Salespeople can:
- Submit new visits.
- View only their own visits.
- Filter their visits by date and area.
- Cannot delete visits.
- Cannot edit other users' visits.

## 5. Core Functional Requirements
- FR-01: The system shall provide email and password authentication.
- FR-02: The system shall redirect users after login based on role.
- FR-03: The system shall provide a Sales Dashboard for visit submission and viewing own visits.
- FR-04: The system shall provide an Admin Dashboard for managing all visits and users.
- FR-05: Visits shall be saved immediately after submission.
- FR-06: Visit lists shall update in real time for authorized users.
- FR-07: A confirmation popup shall appear after successful submission.
- FR-08: The system shall not require Google Maps or display a map.

## 6. Visit Form Requirements
The visit submission form includes the fields below.

| Field | Required | Rules |
| --- | --- | --- |
| Customer Name | Yes | Text |
| Phone Number | Yes | Salesperson enters 8 digits; stored as +968XXXXXXXX |
| CR Number | No | Text |
| Area | Yes | Text |
| Visit Date | Yes | Date |
| Next Visit Date | No | Date |
| Have Zamzam | Yes | Yes or No |
| Latitude | Yes | Auto-captured at submission time |
| Longitude | Yes | Auto-captured at submission time |
| Salesperson ID | Yes | Auto-linked to logged-in user |

## 7. Location Handling
- The browser shall request location permission at the time of submission.
- The system shall capture current GPS coordinates only.
- The system shall request high-accuracy location where supported.
- The system shall block submission if location permission is denied.
- The system shall not display any map.

## 8. Security and Access Control
- Role-based access shall be enforced in the backend.
- Row Level Security (RLS) shall be enabled in the database.
- Admins shall have read, create, update, and delete access to visits.
- Salespeople shall have read and create access only to their own visits.
- Users shall only see data they are authorized to view.

## 9. Backend and Database
Backend: Supabase
Database tables:
- profiles (id, name, role)
- visits (visit data, salesperson_id, timestamps)

## 10. Pages and Navigation
- Login Page: Email and password authentication for all users.
- Sales Dashboard: Submit a new visit and view own visits.
- Admin Dashboard: View all visits, apply filters, view details, edit, and delete.
- Sidebar navigation shall be used for core sections.

## 11. UI and UX Requirements
- Professional, enterprise-style UI.
- Red and white theme aligned to Zamzam branding.
- Clean, non-flashy layout.
- Responsive design for desktop and mobile.
- Easy to use for non-technical users.

## 12. Non-Functional Requirements
- Fast load times on mobile networks.
- Real-time updates on visit lists.
- High availability and stability for daily sales use.
- Compatibility with modern mobile and desktop browsers.

## 13. Out of Scope
- Map display or route visualization.
- Advanced analytics or reporting.
- Offline mode.
