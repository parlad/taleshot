# Taleshot - Version History

## Version 1.0.0 - Initial Release
**Released:** January 16, 2025
**Deployment:** https://taleshot.com

### Features
- 📸 **Photo Upload & Management** - Upload and organize photos with stories
- 🏷️ **Tag System** - Organize photos with custom tags using junction table
- 🔄 **Flip Card View** - Interactive flip cards showing photo details
- 📱 **Responsive Design** - Works beautifully on all devices
- 🔒 **Privacy Controls** - Make photos public or keep them private
- 🔍 **Search & Discovery** - Find other users' public photos
- ✨ **Modern UI** - Clean, intuitive interface with smooth animations
- 👤 **User Authentication** - Secure email/password authentication
- 🎨 **View Modes** - Toggle between flip cards and slide view

### Tech Stack
- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Authentication, Storage)
- **Build Tool:** Vite
- **Icons:** Lucide React
- **Routing:** React Router DOM
- **Deployment:** Netlify

### Database Schema
- **photos** - Stores photo metadata and URLs
- **photo_tags** - Junction table for photo-tag relationships
- **profiles** - User profile information

### Key Components
- PhotoGallery - Main photo display with filtering
- PhotoCard - Interactive flip cards with edit functionality
- AddPhotoModal - Photo upload with tag management
- TagFilter - Filter photos by tags
- SearchPage - Discover public photos from other users
- Auth - User authentication with profile creation

### Deployment
- Live at: https://taleshot.com
- Default domain: splendid-khapse-62b1e4.netlify.app
- Custom domain configured
- Automatic deployments from main branch