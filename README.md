# Employee Evaluation System (EES)

A comprehensive full-stack web application for managing employee performance evaluations, HR operations, and workforce analytics.

## 🚀 Features

### Core Functionality
- **Performance Management**: Create, schedule, and manage employee evaluations
- **User Management**: Multi-role user system with authentication & authorization
- **Criteria Management**: Customizable evaluation criteria and scoring systems
- **Goal Setting**: OKR-style goal management with progress tracking
- **Reporting**: Comprehensive analytics and performance reports

### HR Operations
- **Employee Management**: Complete employee lifecycle management
- **Attendance Tracking**: Time tracking and attendance monitoring
- **Leave Management**: Leave requests, approvals, and tracking
- **Payroll Integration**: Salary and compensation management
- **Recruitment**: Job posting and candidate management
- **Benefits Administration**: Employee benefits and perks management

### Additional Features
- **Project Management**: Task assignment and progress tracking
- **Timesheets**: Detailed time logging and reporting
- **Todo Lists**: Personal and team task management
- **Dashboard**: Real-time analytics and insights

## 🛠️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **Material-UI (MUI)** for modern UI components
- **React Router** for navigation
- **React Query** for data fetching and caching
- **Chart.js** for data visualization
- **Formik & Yup** for form handling and validation
- **Vite** for fast development and building

### Backend
- **Node.js** with Express.js
- **JWT** for authentication
- **CORS** enabled for cross-origin requests
- **File upload** support for documents and media

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
npm start
```
Server runs on `http://localhost:3000`

### Frontend Setup
```bash
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`

### Build for Production
```bash
npm run build
```

## 🔧 API Endpoints

- `/api/evaluations` - Performance evaluations
- `/api/employees` - Employee management
- `/api/users` - User management
- `/api/criteria` - Evaluation criteria
- `/api/goals` - Goal management
- `/api/attendance` - Attendance tracking
- `/api/payroll` - Payroll management
- `/api/recruitment` - Recruitment processes
- `/api/benefits` - Benefits administration
- `/api/timesheets` - Time tracking
- `/api/projects` - Project management
- `/api/leaves` - Leave management

## 🔐 Authentication

The system uses JWT-based authentication with protected routes. All API endpoints require valid authentication tokens.

## 📊 Key Features

- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Updates**: Live data synchronization across the application
- **Data Export**: Export reports and data in various formats
- **Role-based Access**: Different permission levels for different user types
- **File Management**: Upload and manage documents and media files

## 🤝 Contributing

This is a personal project for employee performance evaluation. Feel free to fork and contribute improvements.

## 📝 License

This project is for educational and personal use.

---

**Built with ❤️ for modern HR management**
