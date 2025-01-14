import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wand2, ArrowRight, Sparkles, Layout, Code, Palette } from 'lucide-react';

const Home = () => {
  const [prompt, setPrompt] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    if (prompt.trim()) {
      navigate('/builder', { state: { prompt } });
    }
  };

  const features = [
    {
      icon: <Layout className="w-6 h-6 text-blue-400" />,
      title: "Smart Layouts",
      description: "AI-powered responsive design that adapts to any screen"
    },
    {
      icon: <Code className="w-6 h-6 text-purple-400" />,
      title: "Clean Code",
      description: "Generate optimized, maintainable code automatically"
    },
    {
      icon: <Palette className="w-6 h-6 text-green-400" />,
      title: "Custom Styling",
      description: "Beautiful, cohesive design systems tailored to your brand"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_40%)] pointer-events-none" />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center p-2 bg-blue-500/10 rounded-full mb-8">
              <Wand2 className="w-8 h-8 text-blue-400" />
              <Sparkles className="w-6 h-6 text-yellow-400 ml-2" />
            </div>
            
            <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
              Transform Your Ideas Into
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text"> Stunning Websites</span>
            </h1>
            
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Harness the power of AI to create beautiful, functional websites in minutes. 
              No coding required.
            </p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 mb-12 border border-gray-700/50">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your dream website... For example: 'Create a modern portfolio website for a photographer with a dark theme and full-screen gallery.'"
                  maxLength={500}
                  className="w-full h-48 p-6 bg-gray-900/50 text-white border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder-gray-400 text-lg"
                />
                <div className="absolute bottom-4 right-4 text-gray-400 text-sm">
                  {prompt.length} / 500
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-8 rounded-xl font-medium text-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center justify-center group"
              >
                Generate Website Plan
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/30">
                <div className="bg-gray-700/30 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;