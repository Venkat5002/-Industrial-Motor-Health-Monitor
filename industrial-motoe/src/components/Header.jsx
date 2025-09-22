import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const navLinks = [
  { name: 'Simulator', path: '/' },
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'History', path: '/history' }
];

export const Header = () => {
  const loc = useLocation();
  return (
    <header className="bg-white shadow p-4 flex justify-between items-center">
      <h1 className="text-xl font-semibold">Industrial MotoE</h1>
      <nav className="space-x-6">
        {navLinks.map(link => (
          <Link
            key={link.path}
            to={link.path}
            className={`hover:underline ${loc.pathname === link.path ? 'font-bold text-blue-600' : ''}`}
          >
            {link.name}
          </Link>
        ))}
      </nav>
    </header>
  );
}