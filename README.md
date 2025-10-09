# 🏥 MediDiagnose - AI-Powered Medical Diagnosis System

A comprehensive medical web application that combines AI-powered symptom analysis with professional medical review to provide accurate health insights.

![MediDiagnose](https://via.placeholder.com/800x400/22c55e/ffffff?text=MediDiagnose+AI+Medical+System)

## 🌟 Features

### For Patients
- **🔍 AI Symptom Checker**: Advanced symptom analysis using machine learning
- **📊 Diagnosis History**: Track all your medical consultations and AI predictions
- **👤 Patient Profile**: Secure medical information management
- **⚡ Real-time Results**: Instant AI-powered health insights
- **🔒 Privacy First**: HIPAA-compliant data protection

### For Doctors
- **👨‍⚕️ Professional Dashboard**: Review and manage patient cases
- **🧠 AI Collaboration**: AI predictions to support clinical decisions
- **📝 Case Management**: Add professional notes and recommendations
- **📈 Analytics**: Track practice statistics and patient outcomes
- **🎯 Priority Queue**: Efficient case review workflow

### Technical Features
- **🤖 Advanced AI Model**: NLP-based symptom analysis and disease prediction
- **🔐 Secure Authentication**: JWT-based user authentication with role management
- **💾 Robust Database**: SQLite database with audit logging
- **🎨 Modern UI**: React with Tailwind CSS for responsive design
- **🚀 RESTful API**: Well-documented backend API
- **📱 Mobile Responsive**: Works seamlessly on all devices

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (SQLite)      │
│                 │    │                 │    │                 │
│ • Patient UI    │    │ • Auth API      │    │ • Users         │
│ • Doctor UI     │    │ • Diagnosis API │    │ • Sessions      │
│ • Symptom Check │    │ • User API      │    │ • Profiles      │
│ • Dashboards    │    │ • AI Model      │    │ • Audit Logs    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/medidiagnose.git
   cd medidiagnose
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Start the development servers**
   ```bash
   npm run dev
   ```

This will start:
- Backend server on `http://localhost:5000`
- Frontend application on `http://localhost:3000`

### Demo Accounts

The system comes with pre-seeded demo accounts:

**👨‍⚕️ Doctor Account**
- Email: `doctor@demo.com`
- Password: `demo123`

**🧑‍🦱 Patient Account**
- Email: `patient@demo.com`
- Password: `demo123`

## 📖 Usage Guide

### For Patients

1. **Register/Login**: Create an account or use the demo patient account
2. **Complete Profile**: Add your medical history, allergies, and emergency contacts
3. **Use Symptom Checker**: 
   - Describe your symptoms in detail
   - Rate severity (1-10 scale)
   - Specify symptom duration
   - Add any additional context
4. **Review AI Results**: Get instant AI predictions with confidence scores
5. **Track History**: Monitor all your diagnosis sessions
6. **Doctor Review**: Wait for professional medical review of your case

### For Doctors

1. **Login**: Use the demo doctor account or register as a medical professional
2. **Review Dashboard**: See pending patient cases requiring review
3. **Case Analysis**:
   - Review patient symptoms and medical history
   - Examine AI predictions and confidence scores
   - Add professional medical assessment
   - Provide recommendations and next steps
4. **Manage Profile**: Update specialization and hospital affiliation

## 🔧 Development

### Project Structure

```
medidiagnose/
├── backend/                 # Node.js/Express backend
│   ├── database/           # Database models and setup
│   ├── middleware/         # Authentication middleware
│   ├── models/            # AI model implementation
│   ├── routes/            # API route handlers
│   └── server.js          # Express server setup
├── frontend/               # React frontend
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React context providers
│   │   ├── pages/         # Application pages
│   │   ├── services/      # API service layer
│   │   └── App.js         # Main application component
└── package.json           # Root package configuration
```

### Backend API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

#### Diagnosis
- `POST /api/diagnosis/submit` - Submit new diagnosis
- `GET /api/diagnosis/history` - Get patient history
- `GET /api/diagnosis/pending` - Get pending reviews (doctors)
- `PUT /api/diagnosis/:id/review` - Review diagnosis session
- `GET /api/diagnosis/stats/overview` - Get statistics

#### Users
- `GET /api/users/patients` - Get all patients (doctors)
- `GET /api/users/patients/:id` - Get specific patient
- `GET /api/users/search/patients` - Search patients
- `GET /api/users/activity/:id` - Get user activity logs

### AI Model

The system includes a basic AI model that:
- Uses NLP to process symptom descriptions
- Matches symptoms to medical conditions
- Provides confidence scores and explanations
- Suggests treatment recommendations

**Note**: This is a demo implementation. A production system would use:
- Trained models on medical datasets
- More sophisticated NLP processing
- Integration with medical knowledge bases
- Continuous learning capabilities

### Environment Variables

Backend (`.env`):
```
PORT=5000
JWT_SECRET=your_super_secure_jwt_secret_key
NODE_ENV=development
DB_PATH=./database.sqlite
```

## 🧪 Testing

### Manual Testing Workflow

1. **Patient Flow**:
   - Register as a patient
   - Complete profile with medical information
   - Submit symptoms through symptom checker
   - Review AI predictions and explanations
   - Check diagnosis history

2. **Doctor Flow**:
   - Login as a doctor
   - Review pending patient cases
   - Examine AI predictions
   - Add professional medical notes
   - Submit case review

3. **Integration Testing**:
   - Verify real-time updates between patient and doctor views
   - Test authentication and authorization
   - Validate data persistence across sessions

## 🚢 Deployment

### Production Considerations

1. **Environment Setup**:
   - Use production-grade database (PostgreSQL/MySQL)
   - Set up proper environment variables
   - Configure HTTPS/SSL certificates
   - Implement proper logging

2. **Security**:
   - Use strong JWT secrets
   - Implement rate limiting
   - Add input validation and sanitization
   - Regular security audits

3. **Performance**:
   - Database indexing
   - API response caching
   - Image optimization
   - CDN for static assets

### Docker Deployment

```dockerfile
# Dockerfile example
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000 5000
CMD ["npm", "run", "dev"]
```

## 🔒 Security & Privacy

- **Data Encryption**: All sensitive data encrypted at rest
- **HIPAA Compliance**: Following healthcare data protection standards
- **Access Control**: Role-based authentication and authorization
- **Audit Logging**: Complete audit trail of all user actions
- **Privacy by Design**: Minimal data collection and retention policies

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## ⚠️ Medical Disclaimer

**Important**: This application is for demonstration purposes only and should NOT be used for actual medical diagnosis or treatment decisions. The AI predictions are educational tools and do not replace professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare professionals for medical concerns.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Future Enhancements

- **🧬 Advanced AI Models**: Integration with specialized medical AI models
- **🌐 Multi-language Support**: Internationalization and localization
- **📱 Mobile App**: Native mobile applications for iOS and Android
- **🔗 EHR Integration**: Electronic Health Record system integration
- **📊 Advanced Analytics**: Detailed health analytics and trends
- **🔔 Real-time Notifications**: Push notifications for updates
- **🎥 Telemedicine**: Video consultation capabilities
- **🧪 Lab Integration**: Laboratory results integration
- **📈 Predictive Analytics**: Health risk prediction models

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/medidiagnose/issues) page
2. Create a new issue with detailed description
3. For urgent matters, contact: support@medidiagnose.com

## 🏆 Acknowledgments

- Medical terminology and condition data sourced from public medical databases
- UI components inspired by modern healthcare applications
- AI model concepts based on medical literature and research
- Security practices following healthcare industry standards

---

**Built with ❤️ for better healthcare outcomes**
