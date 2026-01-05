import React from 'react';
import { Github, Twitter, Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-surface py-12 border-t border-border text-center md:text-left transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
        
        <div>
          <h3 className="text-2xl font-magilio text-primary mb-2">BlazeUp</h3>
          <p className="text-secondary text-sm max-w-xs">
            Streaming live 24/7. The official voice of the campus.
          </p>
        </div>

        <div className="flex gap-6">
            <a href="#" className="text-secondary hover:text-accent transition"><Twitter size={20} /></a>
            <a href="#" className="text-secondary hover:text-accent transition"><Instagram size={20} /></a>
            <a href="#" className="text-secondary hover:text-accent transition"><Github size={20} /></a>
        </div>

        <div className="text-secondary text-sm">
          &copy; {new Date().getFullYear()} BlazeUp Radio.
        </div>
      </div>
    </footer>
  );
}