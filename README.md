# Stokk — Smart Inventory & Profit Management

> Know what you have. Know what you made.

Stokk is a web-based inventory and profit management system built exclusively for **HOPEX COMMS**, a Nigerian phone and accessories retailer. It replaces notebooks, spreadsheets, and guesswork with a single real-time dashboard that gives complete visibility into stock levels, sales activity, and profitability.

---

## Live App

**[stokkco.com](https://stokkco.com)**

---

## Features

### Dashboard
- Real-time revenue, profit, and today's sales
- Revenue chart for the current month
- Low stock alerts with restock shortcuts
- Stock by brand summary
- Monthly P&L (gross revenue, cost of goods, expenses, net profit)
- Top selling products this month

### Inventory
- Brand → Model drill-down navigation
- Add, edit, and delete products
- Product image upload
- Low stock threshold alerts
- Toggle between serialized (IMEI) and non-serialized (quantity) tracking
- Filter by All / Low Stock / Out of Stock

### IMEI Tracker
- Register serialized units individually with IMEI, variant, cost price
- Bulk registration — add multiple units at once
- Unit photo upload (box or receipt photo)
- Search any unit by IMEI number
- Full unit history — purchase date, sale date, profit
- Unit statuses: In Stock, Sold, Faulty, Returned

### Sales
- Record sales with product, IMEI unit, selling price, customer name
- Profit calculated automatically at point of sale
- Cost price snapshotted at time of sale — never changes
- Edit and delete sales with automatic stock restoration
- Receipt/invoice generation per sale (printable)
- FAB quick sale button accessible from any screen

### Expenses
- Log operating costs by category (Rent, Electricity, Staff, Internet etc.)
- Edit and delete expenses
- Category breakdown with visual bar chart
- Monthly totals feed directly into net profit calculation

### Reports & Analytics
- Overview tab — KPIs, weekly revenue chart, product performance
- Sales tab with CSV export
- IMEI report tab with CSV export
- Expenses tab with CSV export

### Customers
- Auto-created from sales with customer names
- Total spend, purchase count, last purchase date per customer
- Full purchase history with receipt links

### Suppliers
- Add and manage suppliers with name, phone, address, notes
- Purchase history per supplier
- Total spend per supplier
- Autocomplete in stock purchase forms

### Stock Management
- Add stock for non-serialized products with full purchase history
- Supplier autocomplete
- Total cost calculation per purchase and overall
- Stock adjustments for damaged, stolen, or miscounted items

### Team Management
- Add sales attendants via Admin API (no email confirmation needed)
- Role-based access — attendants cannot see cost prices or financial data
- Remove team members instantly
- Separate sidebar navigation per role

### Settings
- Change password
- Dark mode toggle
- Daily summary email (sales, profit, low stock report)
- Profile information display

### Notifications
- Bell icon with live low stock count badge
- Dropdown showing all low stock items with restock links

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.7 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 |
| Components | ShadCN UI |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Email | Resend |
| Deployment | Vercel |
| Font | Inter via @fontsource/inter |

---

## Database Schema

| Table | Description |
|-------|-------------|
| `profiles` | User profiles with role (owner/attendant) |
| `brands` | Product brands |
| `products` | Products with serialized/non-serialized flag |
| `stock_items` | Individual serialized units with IMEI |
| `stock_purchases` | Stock restock history |
| `sales` | Sales transactions with profit snapshot |
| `expenses` | Operating expenses |
| `stock_adjustments` | Manual stock corrections |
| `suppliers` | Supplier directory |

All tables have Row Level Security (RLS) enabled. Financial data (cost prices, profit, expenses) is inaccessible to attendants at the database level.

---

## Role-Based Access

| Feature | Owner | Attendant |
|---------|-------|-----------|
| Full dashboard & P&L | ✅ | ❌ |
| Record sales | ✅ | ✅ |
| Check stock | ✅ | ✅ |
| See cost prices | ✅ | ❌ |
| View IMEI details | ✅ | ✅ |
| Track expenses | ✅ | ❌ |
| View financial reports | ✅ | ❌ |
| Add/edit products | ✅ | ❌ |
| Manage team | ✅ | ❌ |

---

## Environment Variables

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_SITE_URL=https://stokkco.com
```

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/Debque/stokk.git
cd stokk

# Install dependencies
npm install

# Add environment variables
cp .env.example .env.local
# Fill in your Supabase and Resend credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deployment

The app is deployed on **Vercel** with automatic deployments on every push to `main`.

**Live URL:** [stokkco.com](https://stokkco.com)

---

## Key Engineering Notes

- **Next.js 16** — middleware file is `src/proxy.ts` with named export `proxy`
- **React 19** — `setState` in `useEffect` must be wrapped in `setTimeout(..., 0)`
- **Tailwind v4** — arbitrary hex values in `className` are unreliable, use inline `style={{}}` 
- **Supabase SSR** — uses `@supabase/ssr` with cookie-based sessions
- **Team members** — created via Supabase Admin API to bypass email confirmation
- **Profit column** — `GENERATED ALWAYS AS (selling_price - cost_price_at_sale) STORED`
- **Soft deletes** — products use `deleted_at` timestamp instead of hard delete

---

## Project Structure

src/

├── app/

│   ├── api/

│   │   ├── team/route.ts          # Add/remove team members via Admin API

│   │   └── summary/route.ts       # Daily summary email endpoint

│   ├── auth/

│   │   ├── callback/page.tsx      # Email confirmation handler

│   │   ├── reset/page.tsx         # Password reset page

│   │   └── signout/route.ts       # Sign out handler

│   ├── customers/                 # Customer management

│   ├── dashboard/                 # Main dashboard

│   ├── expenses/                  # Expense tracking

│   ├── imei/                      # IMEI tracker

│   ├── inventory/

│   │   └── stock/                 # Add stock for non-serialized products

│   ├── login/                     # Authentication

│   ├── onboarding/                # Owner registration

│   ├── receipt/                   # Sale receipt generation

│   ├── reports/                   # Analytics and CSV export

│   ├── sales/                     # Sales recording

│   ├── settings/                  # App settings

│   ├── suppliers/                 # Supplier management

│   └── team/                      # Team management

├── components/

│   ├── MobileMenuButton.tsx       # Hamburger menu trigger

│   ├── NotificationBell.tsx       # Low stock notification bell

│   └── Sidebar.tsx                # Collapsible role-based sidebar

└── lib/

├── supabase.ts                # Browser Supabase client

├── supabase-server.ts         # Server Supabase client

└── supabase-middleware.ts     # Session management middleware


---

## Built For

**HOPEX COMMS** · June 2026

---

## Roadmap

### v3 — Coming Soon
- [ ] Barcode/QR scanner for IMEI registration
- [ ] Multi-store support (SaaS)
- [ ] PDF export for reports
- [ ] Bulk inventory import via CSV
- [ ] Push notifications (mobile)
- [ ] Paystack subscription billing
- [ ] Native iOS/Android app



*Stokk is a private application built exclusively for HOPEX COMMS. Not open for public use.*