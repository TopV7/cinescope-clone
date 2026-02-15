import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-900 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Логотип */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="text-xl font-bold">CineScope</span>
          </Link>

          {/* Навигация */}
          <nav className="hidden md:flex space-x-8">
            <Link 
              to="/" 
              className="text-gray-300 hover:text-white transition-colors duration-200"
            >
              Главная
            </Link>
            <Link 
              to="/movies" 
              className="text-gray-300 hover:text-white transition-colors duration-200"
            >
              Фильмы
            </Link>
            <Link 
              to="/sessions" 
              className="text-gray-300 hover:text-white transition-colors duration-200"
            >
              Сеансы
            </Link>
          </nav>

          {/* Кнопки входа/регистрации */}
          <div className="flex items-center space-x-4">
            <button className="text-gray-300 hover:text-white transition-colors duration-200">
              Вход
            </button>
            <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200">
              Регистрация
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
