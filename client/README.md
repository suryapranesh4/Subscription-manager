# Financial App - Authentication Demo

A React application with Supabase authentication using shadcn/ui components and Tailwind CSS.

## Features

- ✅ **Authentication Features:**
  - Login page using shadcn-style Form, Input, and Button components
  - Signup page with shadcn form components
  - Protected route wrapper component
  - User context/state management using Supabase auth.users
  - Logout functionality in header using shadcn Button
  - Landing page with shadcn Card components for features

- ✅ **Supabase Auth Integration:**
  - Uses Supabase auth.users table for user management (no custom users table)
  - Gets user ID from auth.user() for all database operations
  - Handles auth state changes and user sessions
  - Implements proper auth guards for protected routes

- ✅ **Styling:**
  - Light theme throughout using shadcn's light mode system
  - Inter font family
  - Uses shadcn's design tokens for consistent spacing and colors
  - Professional financial app aesthetic using shadcn components
  - Clean, modern light theme (white/gray-50 backgrounds, gray-900 text)
  - Responsive layout with mobile-first approach

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

3. Update `.env` with your values:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Enable Authentication in Supabase

1. Go to Authentication > Settings in your Supabase dashboard
2. Enable Email authentication
3. Configure your site URL (e.g., `http://localhost:5173` for development)

### 4. Start Development Server

```bash
npm run dev
```

## Project Structure

```
src/
├── components/
│   └── ProtectedRoute.jsx     # Route protection component
├── context/
│   └── AuthContext.jsx        # Authentication context
├── lib/
│   ├── supabase.js            # Supabase client configuration
│   └── utils.js               # Utility functions
├── pages/
│   ├── Dashboard.jsx          # Protected dashboard page
│   ├── Landing.jsx            # Public landing page
│   ├── Login.jsx              # Login page
│   └── Signup.jsx             # Signup page
├── App.jsx                    # Main app with routing
└── index.css                  # Tailwind styles and design tokens
```

## Pages

- **Landing (`/`)** - Public landing page with feature cards
- **Login (`/login`)** - Authentication login page
- **Signup (`/signup`)** - User registration page
- **Dashboard (`/dashboard`)** - Protected dashboard (requires login)

## Authentication Flow

1. **Signup**: Users create accounts which are stored in Supabase auth.users
2. **Login**: Users authenticate and receive a session
3. **Protected Routes**: Dashboard and other protected pages check for valid session
4. **Logout**: Clears session and redirects to login

## Demo Features

You can demo the complete signup/login/logout cycle:

1. Visit the landing page
2. Click "Get Started" to sign up
3. Create an account with email/password
4. Check your email for verification (if enabled)
5. Log in with your credentials
6. Access the protected dashboard
7. Log out using the header button

## Subscription Management Features

✅ **Complete CRUD Operations:**
- Add new subscriptions with detailed form
- Edit existing subscriptions
- Delete subscriptions with confirmation dialog
- View all subscriptions in card layout

✅ **Form Components:**
- Service name input with validation
- Monthly cost input with currency formatting
- Billing cycle select (Monthly, Yearly, Custom)
- Start date picker with calendar widget
- Category select (Entertainment, Productivity, Health, Finance, Education, Other)
- Logo upload with drag & drop functionality

✅ **Logo Upload System:**
- Drag & drop or click to upload
- Image preview before saving
- Support for JPG, PNG, WebP formats
- Fallback to service name initials if no logo
- File size validation (up to 10MB)

✅ **Professional UI Components:**
- Shadcn Dialog for modals
- Shadcn Form components with validation
- Shadcn Card layout for subscriptions
- Shadcn Badge for categories and billing cycles
- Shadcn AlertDialog for delete confirmation
- Loading states and error handling

✅ **Data Integration:**
- User ID from Supabase auth for all operations
- RESTful API calls to backend server
- Form validation using Zod schema
- React Hook Form for form management

## Tech Stack

- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **Authentication**: Supabase Auth
- **Routing**: React Router v6
- **State Management**: React Context API
- **Form Management**: React Hook Form + Zod validation
- **Date Handling**: date-fns
- **Icons**: Lucide React
- **Font**: Inter font family
