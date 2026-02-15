export interface Movie {
  id: string;
  title: string;
  description: string;
  poster: string;
  duration: number; // в минутах
  genre: string[];
  rating: number; // от 1 до 10
  releaseDate: string;
  price: number; // цена билета
}

export interface MovieSession {
  id: string;
  movieId: string;
  time: string;
  hall: string;
  availableSeats: number;
  price: number;
}

export interface Ticket {
  id: string;
  sessionId: string;
  movieId: string;
  seatNumber: number;
  price: number;
  status: 'reserved' | 'paid' | 'cancelled';
}
