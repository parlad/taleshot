# Taleshot

A beautiful photo memory application built with React, TypeScript, and Supabase.

## Features

- 📸 **Photo Upload & Management** - Upload and organize your photos with stories
- 🏷️ **Tag System** - Organize photos with custom tags
- 🔄 **Flip Card View** - Interactive flip cards showing photo details
- 📱 **Responsive Design** - Works beautifully on all devices
- 🔒 **Privacy Controls** - Make photos public or keep them private
- 🔍 **Search & Discovery** - Find other users' public photos
- ✨ **Modern UI** - Clean, intuitive interface with smooth animations

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Build Tool**: Vite
- **Icons**: Lucide React
- **Routing**: React Router DOM

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd taleshot
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Update `.env` with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Start the development server:
```bash
npm run dev
```

## Database Schema

The application uses the following main tables:

- **photos** - Stores photo metadata and URLs
- **photo_tags** - Junction table for photo-tag relationships  
- **profiles** - User profile information

## Deployment

The project is configured for deployment on Netlify with the included `netlify.toml` configuration.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.