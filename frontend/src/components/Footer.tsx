import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* О компании */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">C</span>
              </div>
              <span className="text-white font-bold text-xl">CineScope</span>
            </div>
            <p className="text-sm">
              Современный онлайн-кинотеатр с удобной системой покупки билетов
            </p>
          </div>

          {/* Навигация */}
          <div>
            <h3 className="text-white font-semibold mb-4">Навигация</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="hover:text-white transition-colors">Главная</a></li>
              <li><a href="/movies" className="hover:text-white transition-colors">Фильмы</a></li>
              <li><a href="/sessions" className="hover:text-white transition-colors">Сеансы</a></li>
              <li><a href="/profile" className="hover:text-white transition-colors">Профиль</a></li>
            </ul>
          </div>

          {/* Поддержка */}
          <div>
            <h3 className="text-white font-semibold mb-4">Поддержка</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/help" className="hover:text-white transition-colors">Помощь</a></li>
              <li><a href="/faq" className="hover:text-white transition-colors">FAQ</a></li>
              <li><a href="/contacts" className="hover:text-white transition-colors">Контакты</a></li>
              <li><a href="/terms" className="hover:text-white transition-colors">Условия</a></li>
            </ul>
          </div>

          {/* Контакты */}
          <div>
            <h3 className="text-white font-semibold mb-4">Контакты</h3>
            <ul className="space-y-2 text-sm">
              <li>support@cinescope.store</li>
              <li>+7 (999) 123-45-67</li>
              <li>Ежедневно с 9:00 до 21:00</li>
            </ul>
          </div>
        </div>

        {/* Нижняя часть */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; 2024 CineScope. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
