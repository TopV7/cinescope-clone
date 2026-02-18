import React from 'react';
import { Link } from 'react-router-dom';

const SessionsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🎬 Сеансы фильмов</h1>
          <p className="text-gray-600 text-lg">Выберите фильм и время сеанса</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center py-12">
            <div className="text-gray-500 text-xl mb-4">📽 Сеансы в разработке</div>
            <p className="text-gray-400 mb-8">
              Функционал просмотра сеансов и покупки билетов будет доступен в ближайшее время.
            </p>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">🎭 Что будет доступно:</h3>
                <ul className="text-left text-blue-800 space-y-2">
                  <li>• Расписание сеансов на сегодня и завтра</li>
                  <li>• Выбор мест в зале</li>
                  <li>• Онлайн-покупка билетов</li>
                  <li>• Электронные билеты</li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-900 mb-2">🍿 Уже доступно:</h3>
                <ul className="text-left text-green-800 space-y-2">
                  <li>• Просмотр списка фильмов</li>
                  <li>• Детальная информация о фильмах</li>
                  <li>• Поиск фильмов по жанрам</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 space-x-4">
              <Link 
                to="/movies"
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                Перейти к фильмам
              </Link>
              <Link 
                to="/"
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                На главную
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionsPage;
