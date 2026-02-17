import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero секция */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              Добро пожаловать в CineScope
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Современный онлайн-кинотеатр с удобной системой покупки билетов. 
              Наслаждайтесь новыми премьерами в комфортной атмосфере.
            </p>
            <div className="space-x-4">
              <Link 
                to="/movies" 
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors duration-200 inline-block"
              >
                Купить билет
              </Link>
              <Link 
                to="/movies" 
                className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-3 rounded-lg text-lg font-semibold transition-colors duration-200 inline-block"
              >
                Смотреть афишу
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Преимущества */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Почему выбирают нас</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎬</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Новые премьеры</h3>
              <p className="text-gray-600">
                Последние новинки кинопроката каждый день
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎫</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Удобные билеты</h3>
              <p className="text-gray-600">
                Онлайн покупка и выбор мест в зале
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🍿</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Комфорт</h3>
              <p className="text-gray-600">
                Современные залы и качественный звук
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Популярные фильмы */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Популярные фильмы</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* Заглушки для фильмов */}
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div key={item} className="bg-gray-100 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-200">
                <div className="h-64 bg-gray-300"></div>
                <div className="p-4">
                  <h3 className="font-semibold mb-2">Название фильма {item}</h3>
                  <p className="text-gray-600 text-sm mb-4">Краткое описание...</p>
                  <div className="flex justify-between items-center">
                    <span className="text-red-600 font-bold">₽500</span>
                    <Link 
                      to={`/movies/${item}`}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                    >
                      Подробнее
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
