import React from 'react';
import { Camera, Heart, Users, Gift } from 'lucide-react';

export function PhotoGallery() {
  const EmptyState = () => (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white/50 backdrop-blur-lg rounded-3xl p-12 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-10 left-10 w-20 h-20 bg-blue-100 rounded-full opacity-50 animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-indigo-100 rounded-full opacity-50 animate-pulse delay-300"></div>
          <div className="absolute top-1/2 right-20 w-16 h-16 bg-purple-100 rounded-full opacity-50 animate-pulse delay-700"></div>
        </div>

        <div className="relative z-10">
          <div className="grid grid-cols-2 gap-4 max-w-[200px] mx-auto mb-8">
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-4 shadow-lg">
              <Camera className="w-full h-full text-white" />
            </div>
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 p-4 shadow-lg">
              <Heart className="w-full h-full text-white" />
            </div>
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-4 shadow-lg">
              <Users className="w-full h-full text-white" />
            </div>
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 p-4 shadow-lg">
              <Gift className="w-full h-full text-white" />
            </div>
          </div>

          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text mb-4">
            Welcome to Taleshot
          </h2>
          
          <p className="text-gray-600 text-lg mb-8 leading-relaxed max-w-xl mx-auto">
            Your photo management platform is ready to be built.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-[calc(100vh-16rem)] pb-20">
      <EmptyState />
    </div>
  );
}