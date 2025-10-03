# GuardShare - Secure File Sharing Platform

A modern, secure file sharing platform built with React, Node.js, Express, MongoDB, and React Native. Features advanced link sharing with access controls, user management, and beautiful glassmorphism UI across web and mobile platforms.

## 🚀 Features

### 🔐 Authentication & Security
- JWT-based authentication with refresh tokens
- Role-based access control (User/Superuser)
- Rate limiting and security headers
- Activity logging and audit trails

### 📁 File Management
- GridFS storage for large files (50MB limit)
- Custom filename support
- File favorites and search
- Bulk operations and download tracking

### 🔗 Advanced Link Sharing
- Custom link names with unique validation
- Multiple expiration options (time/date/never)
- Access limits and usage tracking
- Verification systems (password/username)
- Scope control (public/users/selected)
- Download permission control

### 🎨 Modern UI/UX
- **Web**: Glassmorphism design with live lightning effects
- **Mobile**: Native iOS/Android experience with React Native
- Dark/light theme support
- Fully responsive design
- Advanced search and filtering
- Real-time updates and notifications

### 👥 User Management (Superuser)
- User account management
- Role assignment and permissions
- Activity monitoring and logs
- System-wide overview

### 📱 Mobile App Features
- Native iOS and Android support via Expo Go
- Offline data persistence with AsyncStorage
- Real-time synchronization with WebSocket
- Touch-optimized interface
- Pull-to-refresh functionality
- File upload with progress tracking
- Bottom tab navigation

## 🏗️ Architecture

### Frontend
- **Web Client**: React + TypeScript + Vite
- **Mobile Client**: React Native + Expo Go
- **Styling**: Tailwind CSS (Web) + React Native StyleSheet (Mobile)
- **State Management**: Context API + Custom Hooks
- **Real-time**: Socket.io Client

### Backend
- **Server**: Node.js + Express
- **Database**: MongoDB + GridFS
- **Authentication**: JWT + bcrypt
- **Real-time**: Socket.io
- **File Storage**: GridFS (MongoDB)

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Expo CLI (for mobile development)
- iOS Simulator or Android Emulator (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd guardshare
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd server && npm install
   cd ../client-mobile && npm install
   cd ..
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/guardshare
   
   # JWT
   JWT_SECRET=your-super-secure-jwt-secret-key-here
   JWT_EXPIRES_IN=7d
   
   # Server
   PORT=5000
   NODE_ENV=development
   
   # Client URL (for CORS)
   CLIENT_URL=http://localhost:5173
   ```

4. **Create Superuser Account**
   ```bash
   cd server
   npm run create-superuser
   ```
   
   This creates:
   - **Superuser**: `admin` / `admin123`
   - **Demo User**: `demo` / `demo123`

5. **Start All Services**
   ```bash
   npm run dev
   ```
   
   This starts:
   - **Web Client**: http://localhost:5173
   - **Server**: http://localhost:5000
   - **Mobile**: Expo development server

## 📱 Mobile Development

### Running the Mobile App

1. **Install Expo CLI globally**
   ```bash
   npm install -g @expo/cli
   ```

2. **Start the mobile development server**
   ```bash
   cd client-mobile
   npm run dev
   ```

3. **Run on device/simulator**
   - **iOS**: Press `i` in terminal or scan QR code with Camera app
   - **Android**: Press `a` in terminal or scan QR code with Expo Go app
   - **Web**: Press `w` in terminal

### Mobile App Structure

```
client-mobile/
├── src/
│   ├── components/          # Reusable components
│   │   ├── common/         # Common UI components
│   │   └── ...
│   ├── contexts/           # React contexts
│   │   ├── AuthContext.jsx
│   │   ├── ThemeContext.jsx
│   │   └── DataContext.jsx
│   ├── screens/            # Screen components
│   │   ├── auth/          # Authentication screens
│   │   ├── main/          # Main app screens
│   │   └── public/        # Public screens
│   ├── services/          # API services
│   │   ├── api.js
│   │   └── socketService.js
│   └── ...
├── App.jsx                # Main app component
├── app.json              # Expo configuration
└── package.json          # Dependencies
```

## 🌐 Project Structure

```
guardshare/
├── src/                    # React web frontend
│   ├── components/         # Reusable components
│   ├── contexts/          # React contexts
│   ├── pages/             # Page components
│   ├── services/          # API services
│   └── styles/            # Global styles
├── client-mobile/         # React Native mobile app
│   ├── src/               # Mobile app source
│   ├── App.jsx           # Mobile app entry
│   └── app.json          # Expo configuration
├── server/                # Node.js backend
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   ├── scripts/           # Utility scripts
│   └── utils/             # Helper functions
└── docs/                  # Documentation
```

## 🔧 Development Commands

### Root Level
- `npm run dev` - Start all services (web, server, mobile)
- `npm run client` - Start web client only
- `npm run server` - Start backend server only
- `npm run mobile` - Start mobile development server
- `npm run build` - Build web client for production

### Mobile Specific
- `cd client-mobile && npm run dev` - Start Expo development server
- `cd client-mobile && npm run android` - Run on Android
- `cd client-mobile && npm run ios` - Run on iOS
- `cd client-mobile && npm run web` - Run mobile app in web browser

### Server Specific
- `cd server && npm run create-superuser` - Create admin account

## 📱 Mobile Features

### Core Functionality
- **Authentication**: Login/Register with secure token storage
- **File Management**: Upload, view, delete files with progress tracking
- **Link Sharing**: Create and manage shareable links
- **Real-time Updates**: Live synchronization across devices
- **Offline Support**: Local data persistence with AsyncStorage

### UI/UX Features
- **Bottom Tab Navigation**: Intuitive navigation between main sections
- **Pull-to-Refresh**: Refresh data with native pull gesture
- **Modal Interfaces**: Full-screen modals for complex interactions
- **Touch Feedback**: Proper haptic and visual feedback
- **Responsive Design**: Adapts to different screen sizes
- **Dark/Light Theme**: System-aware theme switching

### Technical Features
- **File Upload**: Progress tracking with FormData
- **Image Caching**: Optimized image loading and caching
- **Socket Integration**: Real-time updates via WebSocket
- **Error Handling**: Comprehensive error states and recovery
- **Loading States**: Proper loading indicators throughout

## 🔐 API Documentation

The API documentation is available in `api-routes.txt` with complete endpoint details, request/response formats, and authentication requirements.

### Key Endpoints

- **Authentication**: `/api/auth/*`
- **File Management**: `/api/files/*`
- **Link Sharing**: `/api/links/*`
- **User Management**: `/api/users/*` (Superuser only)

## 👥 User Roles

### Regular User
- Upload and manage files
- Create and manage shareable links
- Access shared links (based on permissions)
- Update profile settings

### Superuser
- All user permissions
- Manage all users and their data
- View system-wide statistics
- Access admin panels and logs

## 🔒 Security Features

- **Rate Limiting**: Prevents API abuse
- **CORS Protection**: Configured for production
- **Input Validation**: Comprehensive data validation
- **File Security**: Safe file upload and storage
- **Access Control**: Granular permission system
- **Activity Logging**: Complete audit trail
- **Secure Storage**: Encrypted token storage on mobile

## 🚀 Deployment

### Web Application
```bash
npm run build
```

### Mobile Application
```bash
cd client-mobile
expo build:android  # For Android APK
expo build:ios      # For iOS IPA
```

### Environment Variables
Ensure all production environment variables are set:
- `MONGODB_URI`: Production MongoDB connection
- `JWT_SECRET`: Strong, unique secret key
- `NODE_ENV=production`
- `CLIENT_URL`: Production client URL

### Recommended Deployment
- **Web Frontend**: Netlify, Vercel, or CDN
- **Mobile App**: App Store / Google Play Store
- **Backend**: Railway, Heroku, or VPS
- **Database**: MongoDB Atlas
- **File Storage**: GridFS (included) or cloud storage

## 🧪 Testing

### Web Testing
```bash
npm run test
```

### Mobile Testing
```bash
cd client-mobile
npm run test
```

### Cross-Platform Testing
- Test on multiple devices and screen sizes
- Verify API integration across platforms
- Test offline functionality
- Validate real-time updates
- Check responsive layouts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, please check the documentation or create an issue in the repository.

---

**GuardShare** - Secure file sharing reimagined across all platforms ⚡🛡️📱