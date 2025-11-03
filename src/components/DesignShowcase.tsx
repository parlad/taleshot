import React from 'react';
import { Heart, Share2, Download, Plus, Search, Settings } from 'lucide-react';

export function DesignShowcase() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
      <section>
        <h2 className="text-3xl font-bold gradient-text mb-6">Button Variants</h2>
        <div className="flex flex-wrap gap-4">
          <button className="btn-filled flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Filled Button
          </button>

          <button className="btn-outlined flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Outlined Button
          </button>

          <button className="btn-ghost flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Ghost Button
          </button>

          <button className="btn-primary flex items-center gap-2">
            <Download className="w-5 h-5" />
            Primary Button
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-bold gradient-text mb-6">Card Variants</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-glass p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-mint-teal flex items-center justify-center text-white">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Glass Card</h3>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Glassmorphism effect with blur and translucent background for modern UI design.
            </p>
          </div>

          <div className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-blue-purple flex items-center justify-center text-white">
                <Settings className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Elevated Card</h3>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Deep shadows with hover lift effect for prominent content sections.
            </p>
          </div>

          <div className="card-modern p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl gradient-vibrant flex items-center justify-center text-white">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Modern Card</h3>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Clean card design with subtle shadows and smooth hover animations.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-bold gradient-text mb-6">Gradient Palette</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="gradient-mint-teal rounded-2xl p-8 text-white shadow-lg">
            <h3 className="text-2xl font-bold mb-2">Mint → Teal</h3>
            <p className="text-white/90">Primary accent gradient</p>
          </div>

          <div className="gradient-blue-purple rounded-2xl p-8 text-white shadow-lg">
            <h3 className="text-2xl font-bold mb-2">Blue → Purple</h3>
            <p className="text-white/90">Secondary gradient</p>
          </div>

          <div className="gradient-vibrant rounded-2xl p-8 text-white shadow-lg">
            <h3 className="text-2xl font-bold mb-2">Cyan → Teal → Green</h3>
            <p className="text-white/90">Vibrant accent</p>
          </div>
        </div>
      </section>
    </div>
  );
}
