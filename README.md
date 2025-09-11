# Kájọpọ̀ Connect

> A platform connecting opportunity seekers with providers for social impact across Nigeria and Africa.

## 🌟 Overview

Kájọpọ̀ Connect is a comprehensive web application that bridges the gap between individuals and organizations seeking opportunities with those who can provide them. The platform focuses on social impact, community development, and empowerment across various sectors.

## ✨ Features

### For Users
- **User Registration & Authentication** - Secure sign-up and login system
- **Profile Management** - Comprehensive user profiles with skills and interests
- **Opportunity Discovery** - Browse and search for relevant opportunities
- **Application System** - Apply for opportunities with detailed forms
- **Messaging System** - Direct communication between seekers and providers
- **Dashboard** - Personalized dashboard with activity tracking

### For Administrators
- **Admin Dashboard** - Comprehensive management interface
- **User Management** - Approve, reject, or suspend user accounts
- **Opportunity Oversight** - Monitor and manage all opportunities
- **Analytics** - Track platform usage and success metrics
- **Content Moderation** - Ensure quality and appropriate content

### Technical Features
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Dark/Light Theme** - User preference-based theming
- **Local Storage** - Client-side data persistence
- **Modern UI/UX** - Built with Tailwind CSS for beautiful interfaces
- **Progressive Enhancement** - Works without JavaScript for basic functionality

## 🚀 Quick Start

### Local Development

1. **Clone or download** the repository
2. **Navigate** to the project directory
3. **Start a local server:**
   ```bash
   # Using Python (recommended)
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```
4. **Open** http://localhost:8000 in your browser

### Test Accounts

**Admin Access:**
- Email: `admin@kajopo.com`
- Password: `Admin123!`

**Manager Access:**
- Email: `manager@kajopo.com`
- Password: `Manager123!`

## 🌐 Deployment

The application is ready for deployment on various platforms:

### Recommended: Netlify (Easiest)
1. Go to [netlify.com](https://netlify.com)
2. Drag and drop the project folder
3. Get instant live URL

### Alternative Options
- **Vercel** - Excellent performance and developer experience
- **GitHub Pages** - Free hosting for public repositories
- **Firebase Hosting** - Google's robust infrastructure
- **Surge.sh** - Simple command-line deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## 📁 Project Structure

```
kajopo-connect/
├── index.html              # Landing page
├── registration-form.html  # User registration
├── signin-form.html       # User login
├── dashboard.html         # User dashboard
├── admin-dashboard.html   # Admin interface
├── admin-login.html       # Admin login
├── profile.html           # User profile management
├── browse-opportunities.html # Opportunity discovery
├── create-opportunity.html   # Opportunity creation
├── messaging.html         # Communication system
├── css/
│   └── themes.css        # Theme styles
├── js/
│   ├── admin-auth.js     # Admin authentication
│   └── theme-manager.js  # Theme management
├── netlify.toml          # Netlify configuration
├── vercel.json           # Vercel configuration
└── DEPLOYMENT.md         # Deployment guide
```

## 🎯 Key Pages

- **`/`** - Landing page with platform overview
- **`/register`** - User registration form
- **`/login`** - User authentication
- **`/dashboard`** - Personalized user dashboard
- **`/admin`** - Administrative interface
- **`/opportunities`** - Browse available opportunities
- **`/profile`** - User profile management
- **`/messaging`** - Communication center

## 🛠 Technology Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Styling:** Tailwind CSS
- **Storage:** localStorage (client-side)
- **Authentication:** Custom implementation
- **Deployment:** Static hosting (Netlify, Vercel, etc.)

## 🔧 Configuration

### Environment Setup
No server-side configuration required. The application runs entirely in the browser with localStorage for data persistence.

### Customization
- **Themes:** Modify `css/themes.css`
- **Colors:** Update Tailwind configuration in HTML files
- **Content:** Edit HTML files directly
- **Functionality:** Extend JavaScript files in `js/` directory

## 📱 Browser Support

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Email: support@kajopo.com
- Documentation: See DEPLOYMENT.md

## 🎉 Acknowledgments

- Built with ❤️ by LaDIOM LLC
- Designed for social impact in Nigeria and Africa
- Community-driven development

---

**Ready to make an impact?** Deploy your instance and start connecting opportunity seekers with providers today!