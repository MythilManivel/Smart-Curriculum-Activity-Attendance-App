# 🎓 QR Code-based Attendance System

A modern, secure, and efficient attendance management system using QR codes for educational institutions and organizations. This system simplifies attendance tracking while maintaining security through location verification and user authentication.

## ✨ Key Features

### 📱 **User Roles**
- **Students**: Mark attendance by scanning QR codes
- **Teachers**: Create and manage attendance sessions
- **Admins**: View reports and manage users

### 🔒 **Security Features**
- **QR Code Authentication**: Unique session codes for each class
- **Location Verification**: Ensures attendance is marked from authorized locations
- **Session Expiry**: Time-limited QR codes prevent unauthorized use
- **User Authentication**: Secure login system with JWT tokens

### 📊 **Attendance Management**
- Real-time attendance tracking
- Detailed attendance history
- Exportable reports (CSV)
- Session-based attendance records

### 📍 **Location Services**
- GPS-based location verification
- Configurable distance limits
- Location history for audit trails

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your configuration.

3. **Start the server**
   ```bash
   npm start
   ```
   The API will be available at `http://localhost:5000`

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the development server**
   ```bash
   npm start
   ```
   The app will be available at `http://localhost:3000`

## 🛠️ Technologies Used

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- JWT for authentication
- Bcrypt for password hashing
- QR Code generation

### Frontend
- React.js
- React Router
- React Bootstrap
- Axios for API calls
- React QR Code Scanner
- Date-fns for date handling

## 📱 User Guides

### For Students
1. Log in to your account
2. Go to "Mark Attendance"
3. Scan the QR code displayed by your teacher
4. Confirm your location
5. Attendance marked successfully!

### For Teachers
1. Log in to your account
2. Go to "Create Session"
3. Enter session details (subject, duration)
4. Display the generated QR code to students
5. Monitor attendance in real-time

### For Admins
1. Access the admin dashboard
2. View attendance reports
3. Manage user accounts
4. Generate exportable reports

## 🌐 Deployment

### Backend Deployment
1. Set up a MongoDB database (MongoDB Atlas recommended)
2. Configure environment variables in production
3. Use PM2 for process management
   ```bash
   npm install -g pm2
   pm2 start server.js
   ```

### Frontend Deployment
1. Build the production version
   ```bash
   npm run build
   ```
2. Deploy the `build` folder to your preferred hosting service
   - Netlify
   - Vercel
   - Firebase Hosting
   - GitHub Pages

## 🔒 Security Best Practices

1. Always use HTTPS in production
2. Keep dependencies updated
3. Implement rate limiting on authentication endpoints
4. Use secure, encrypted connections to MongoDB
5. Regularly back up your database

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ for educational purposes
- Special thanks to all open-source contributors whose work made this project possible
- **Data Retention**: Configurable data retention policies
- **Right to Delete**: Easy data removal options
- **Transparency**: Clear data usage explanations

## 📞 Support & Troubleshooting

### **Common Issues**
1. **Camera not working**: Check browser permissions
2. **Location denied**: Allow location access in browser
3. **Face not detected**: Ensure good lighting and clear view
4. **Firebase errors**: Check internet connection and config

### **Demo Tips**
- **Test beforehand**: Run through complete flow before presentation
- **Have backup**: Prepare screenshots if live demo fails
- **Explain features**: Don't just show, explain the benefits
- **Interactive demo**: Let audience try the system

---

## 🎉 Ready for Your Presentation!

This advanced Smart Attendance System demonstrates cutting-edge web technologies and provides a comprehensive solution for educational institutions. The combination of face recognition, location verification, and real-time analytics makes it a standout project for your SIH presentation.

**Key Selling Points:**
- ✅ **Advanced Technology**: Face recognition + GPS location
- ✅ **Security First**: Anti-spoofing and location verification
- ✅ **Real-time Analytics**: Live dashboard and reporting
- ✅ **Scalable Solution**: Handles large student populations
- ✅ **Modern UI/UX**: Professional, responsive design
- ✅ **Easy Deployment**: One-click hosting options

**Perfect for demonstrating:**
- Modern web development skills
- Integration of multiple APIs
- Real-world problem solving
- User experience design
- Security considerations
- Scalable architecture

Good luck with your presentation! 🚀