# EduHub LMS Portal - Project Documentation

## 📋 Project Overview

**Project Name:** EduHub LMS Portal (Learning Management System)  
**Project Type:** Full-Stack Web Application  
**Duration:** 4 Weeks  
**Repository:** [https://github.com/govindsah22/LMS](https://github.com/govindsah22/LMS)

---

## 🎯 Original Project Requirements

### Problem Statement
Design and develop a comprehensive Learning Management System (LMS) Portal that enables educational institutions to manage courses, lessons, assignments, and student progress effectively. The system should support role-based access for Instructors and Students with distinct functionalities for each role.

### Objectives
1. Build a user-friendly web interface for course management
2. Implement role-based authentication (Instructor/Student)
3. Enable instructors to create courses, lessons, and assignments
4. Allow students to enroll in courses and submit assignments
5. Provide analytics and progress tracking for both roles
6. Support file uploads for lessons and assignment submissions
7. Implement a grading system for instructors

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| TypeScript | Type-safe JavaScript |
| Vite | Build Tool & Dev Server |
| TailwindCSS | Styling Framework |
| shadcn/ui | UI Component Library |
| React Query | Server State Management |
| React Hook Form | Form Handling |
| Zod | Schema Validation |
| Wouter | Client-side Routing |
| Lucide React | Icons |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime Environment |
| Express.js | Web Framework |
| TypeScript | Type-safe JavaScript |
| PostgreSQL | Database |
| Drizzle ORM | Database ORM |
| Passport.js | Authentication |
| Multer | File Upload Handling |
| Express Session | Session Management |

---

## ✨ Features Implemented

### 🔐 Authentication & Authorization
- User registration with role selection (Instructor/Student)
- Secure login/logout with session management
- Role-based access control for routes and features
- Password hashing with scrypt

### 👨‍🏫 Instructor Features
- **Dashboard:** Overview with total courses, students, and upcoming assignments
- **Course Management:** Create, edit, and delete courses with descriptions
- **Lesson Management:** Add lessons with content, video URLs, and file attachments
- **Assignment Management:** Create assignments with due dates
- **View Submissions:** Review student submissions with file downloads
- **Grading System:** Assign grades (0-100) and provide feedback
- **Analytics:** View enrolled students, completion rates, and grade distributions

### 👨‍🎓 Student Features
- **Dashboard:** Overview with enrolled courses, average grade, and upcoming assignments
- **Course Enrollment:** Browse and enroll in available courses
- **Lesson Access:** View lessons, watch videos, and download materials
- **Assignment Submission:** Submit assignments via text or file upload
- **Grades View:** Track grades and feedback for submitted assignments
- **Progress Tracking:** View completion status for enrolled courses

### 📊 Analytics Module
- Course completion rate calculation
- Average grade tracking
- Student enrollment statistics
- Assignment submission tracking

### 📁 File Upload System
- Lesson material uploads (PDFs, documents)
- Assignment file submissions
- Secure file storage and retrieval
- File type validation

---

## 📅 4-Week Development Timeline

### Week 1: Project Setup & Core Backend
**Duration:** Days 1-7

| Day | Tasks Completed |
|-----|-----------------|
| 1-2 | Project initialization, folder structure setup, dependency installation |
| 3-4 | Database schema design with Drizzle ORM (users, courses, lessons, assignments, submissions, enrollments tables) |
| 5-6 | Authentication system implementation (Passport.js, session management, password hashing) |
| 7 | Basic API routes for users, courses, and authentication |

**Deliverables:**
- Project structure established
- PostgreSQL database connected
- User authentication working
- Core database schema implemented

---

### Week 2: API Development & Frontend Foundation
**Duration:** Days 8-14

| Day | Tasks Completed |
|-----|-----------------|
| 8-9 | Complete CRUD APIs for courses, lessons, and assignments |
| 10-11 | Enrollment and submission API endpoints |
| 12-13 | React frontend setup with Vite, TailwindCSS, and shadcn/ui |
| 14 | Authentication pages (Login, Register) with form validation |

**Deliverables:**
- All backend API endpoints functional
- Frontend project initialized
- Authentication UI completed
- API integration with React Query

---

### Week 3: Frontend Development & Integration
**Duration:** Days 15-21

| Day | Tasks Completed |
|-----|-----------------|
| 15-16 | Dashboard pages for both Instructor and Student roles |
| 17-18 | Course listing and detail pages with enrollment functionality |
| 19-20 | Lesson viewer with video playback and material downloads |
| 21 | Assignment submission interface with form handling |

**Deliverables:**
- Complete dashboard for both roles
- Course management UI
- Lesson viewing functionality
- Assignment submission working

---

### Week 4: Advanced Features & Deployment
**Duration:** Days 22-28

| Day | Tasks Completed |
|-----|-----------------|
| 22-23 | File upload system for lessons and assignments |
| 24-25 | Instructor analytics page with charts and statistics |
| 26 | Grading system implementation with feedback |
| 27 | Bug fixes, testing, and UI polish |
| 28 | Production build, Railway deployment setup |

**Deliverables:**
- File upload system complete
- Analytics dashboard functional
- Grading system working
- Application deployed to production

---

## 🗄️ Database Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATABASE SCHEMA                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   USERS     │     │   COURSES   │     │   LESSONS   │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id (PK)     │◄────│ instructorId│     │ id (PK)     │
│ username    │     │ id (PK)     │◄────│ courseId    │
│ password    │     │ title       │     │ title       │
│ name        │     │ description │     │ content     │
│ role        │     │ category    │     │ videoUrl    │
│ createdAt   │     │ createdAt   │     │ fileUrl     │
└─────────────┘     └─────────────┘     │ orderIndex  │
       │                   │            │ createdAt   │
       │                   │            └─────────────┘
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ ENROLLMENTS │     │ ASSIGNMENTS │     │ SUBMISSIONS │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id (PK)     │     │ id (PK)     │◄────│assignmentId │
│ studentId   │────►│ courseId    │     │ id (PK)     │
│ courseId    │────►│ title       │     │ studentId   │
│ enrolledAt  │     │ description │     │ content     │
└─────────────┘     │ dueDate     │     │ fileUrl     │
                    │ createdAt   │     │ grade       │
                    └─────────────┘     │ feedback    │
                                        │ submittedAt │
                                        └─────────────┘
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Register new user |
| POST | `/api/login` | User login |
| POST | `/api/logout` | User logout |
| GET | `/api/user` | Get current user |

### Courses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses` | List all courses |
| GET | `/api/courses/:id` | Get course details |
| POST | `/api/courses` | Create course (Instructor) |
| DELETE | `/api/courses/:id` | Delete course (Instructor) |

### Lessons
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses/:id/lessons` | Get course lessons |
| POST | `/api/courses/:id/lessons` | Create lesson (Instructor) |
| DELETE | `/api/lessons/:id` | Delete lesson (Instructor) |

### Assignments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses/:id/assignments` | Get course assignments |
| POST | `/api/courses/:id/assignments` | Create assignment |
| GET | `/api/assignments/:id/submissions` | Get submissions |

### Submissions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/assignments/:id/submit` | Submit text answer |
| POST | `/api/assignments/:id/submit-file` | Submit file |
| POST | `/api/submissions/:id/grade` | Grade submission |

### Enrollments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/enrollments` | Get user enrollments |
| POST | `/api/courses/:id/enroll` | Enroll in course |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses/:id/analytics` | Get course analytics |
| GET | `/api/instructor/stats` | Get instructor stats |
| GET | `/api/student/stats` | Get student stats |

---

## 📂 Project Structure

```
Edu-Hub-Portal/
├── client/                    # Frontend React Application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── ui/            # shadcn/ui components
│   │   │   └── layout-shell.tsx
│   │   ├── hooks/             # Custom React hooks
│   │   │   ├── use-auth.ts
│   │   │   ├── use-courses.ts
│   │   │   ├── use-enrollments.ts
│   │   │   ├── use-stats.ts
│   │   │   └── use-submissions.ts
│   │   ├── pages/             # Page components
│   │   │   ├── auth-page.tsx
│   │   │   ├── dashboard.tsx
│   │   │   ├── courses-list.tsx
│   │   │   ├── course-detail.tsx
│   │   │   ├── grades.tsx
│   │   │   └── instructor-analytics.tsx
│   │   ├── lib/               # Utility functions
│   │   ├── App.tsx            # Main app component
│   │   └── main.tsx           # Entry point
│   └── index.html
├── server/                    # Backend Express Application
│   ├── auth.ts                # Authentication logic
│   ├── db.ts                  # Database connection
│   ├── index.ts               # Server entry point
│   ├── routes.ts              # API routes
│   ├── storage.ts             # Database operations
│   ├── static.ts              # Static file serving
│   ├── upload.ts              # File upload handling
│   └── vite.ts                # Vite dev server integration
├── shared/                    # Shared code
│   ├── schema.ts              # Database schema (Drizzle)
│   └── routes.ts              # API route definitions
├── uploads/                   # Uploaded files storage
│   ├── lessons/
│   └── assignments/
├── package.json
├── drizzle.config.ts
├── tailwind.config.ts
├── vite.config.ts
└── tsconfig.json
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js v18 or higher
- PostgreSQL database
- npm or yarn package manager

### Local Development
```bash
# 1. Clone the repository
git clone https://github.com/govindsah22/LMS.git
cd LMS

# 2. Install dependencies
npm install

# 3. Create .env file with database URL
DATABASE_URL=postgresql://user:password@localhost:5432/eduhub
SESSION_SECRET=your-secret-key

# 4. Push database schema
npm run db:push

# 5. Start development server
npm run dev
```

### Production Deployment
```bash
# Build for production
npm run build

# Start production server
npm run start
```

---

## 👤 Default Test Accounts

| Role | Username | Password |
|------|----------|----------|
| Instructor | instructor | instructor123 |
| Student | student | student123 |

---

## 🔮 Future Enhancements

1. **Live Video Classes** - Integration with video conferencing
2. **Discussion Forums** - Course-specific discussion boards
3. **Notifications** - Email/push notifications for deadlines
4. **Certificates** - Auto-generate completion certificates
5. **Mobile App** - React Native mobile application
6. **Admin Panel** - Super admin for system management

---

## 👨‍💻 Developer Information

**Developed By:** Govind Sah  
**GitHub:** [govindsah22](https://github.com/govindsah22)  
**Project Duration:** 4 Weeks  
**Completion Date:** February 2026

---

## 📄 License

This project is licensed under the MIT License.
