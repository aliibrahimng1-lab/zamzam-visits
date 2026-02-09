# Zamzam Visits - UI Wireframes and Page Flow

Document Version: 1.0
Date: February 4, 2026

## Page Flow
1. Login -> Sales Dashboard (role: salesperson)
2. Login -> Admin Dashboard (role: admin)
3. Sales Dashboard -> New Visit Form -> Confirmation -> Visit List
4. Admin Dashboard -> Visit Details -> Edit or Delete

## Wireframes

**Login**
```text
+---------------------------------------------------+
| Zamzam Visits                                     |
|                                                   |
| Email                                             |
| [__________________________________________]      |
| Password                                          |
| [__________________________________________]      |
|                                                   |
| [ Login ]                                         |
+---------------------------------------------------+
```

**Sales Dashboard**
```text
+-------------------+------------------------------+
| Sidebar           | Sales Dashboard              |
| - New Visit       | +--------------------------+ |
| - My Visits       | | New Visit Form           | |
| - Logout          | | Customer Name [____]     | |
|                   | | Phone (8 digits) [____]  | |
|                   | | CR Number [____]         | |
|                   | | Area [____]              | |
|                   | | Visit Date [____]        | |
|                   | | Next Visit [____]        | |
|                   | | Have Zamzam [Yes/No]     | |
|                   | | GPS: Auto-captured       | |
|                   | | [ Submit ]               | |
|                   | +--------------------------+ |
|                   | Filters: Date, Area         |
|                   | Visits List                 |
+-------------------+------------------------------+
```

**Admin Dashboard**
```text
+-------------------+------------------------------+
| Sidebar           | Admin Dashboard              |
| - All Visits      | Filters: Date, Salesperson,  |
| - Users           | Area                          |
| - Logout          |                                |
|                   | Visits Table                  |
|                   | - Customer | Area | Date | ...|
|                   | - Actions: View, Edit, Delete |
+-------------------+------------------------------+
```

**Visit Details (Admin)**
```text
+---------------------------------------------------+
| Visit Details                                     |
| Customer Name: ________                           |
| Phone: +968________                               |
| CR Number: ________                               |
| Area: ________                                    |
| Visit Date: ________                              |
| Next Visit Date: ________                         |
| Have Zamzam: Yes/No                               |
| GPS: Lat ___ , Lng ___                            |
|                                                   |
| [ Save Changes ]   [ Delete Visit ]               |
+---------------------------------------------------+
```

## UI Notes
- Red and white theme aligned to Zamzam branding.
- Clean, enterprise layout with strong contrast for readability.
- Mobile-first spacing with large tap targets.
