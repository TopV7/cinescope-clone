// Форматирование времени
export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  return `${hours}:${minutes}`;
};

// Форматирование даты
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

// Форматирование цены
export const formatPrice = (price: number): string => {
  return `${price} ₽`;
};

// Форматирование длительности
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}ч ${mins}м` : `${mins}м`;
};

// Обрезка текста
export const truncateText = (text: string, maxLength: number): string => {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

// Получение цвета рейтинга
export const getRatingColor = (rating: number): string => {
  if (rating >= 8) return 'text-green-600';
  if (rating >= 6) return 'text-yellow-600';
  return 'text-red-600';
};
