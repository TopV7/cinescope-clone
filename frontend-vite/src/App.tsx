import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-600 to-purple-600">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Vite + React + TailwindCSS
          </h1>
          <p className="text-xl text-white mb-8">
            Наконец-то TailwindCSS работает! 🎉
          </p>
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-auto">
            <button 
              onClick={() => setCount((count) => count + 1)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              count is {count}
            </button>
            <p className="text-gray-600 mt-4">
              Нажми на кнопку и посмотри на TailwindCSS стили!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
