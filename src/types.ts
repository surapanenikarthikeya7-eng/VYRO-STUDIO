export interface BookingInput {
  name: string;
  phone: string;
  email: string;
  service: string;
  budget: string;
  eventDate: string;
  message: string;
}

export interface Booking extends BookingInput {
  _id: string;
  createdAt: string;
}

export interface ContactInput {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export interface Contact extends ContactInput {
  _id: string;
  createdAt: string;
}

export interface PaymentInput {
  user: string;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  transactionId: string;
}

export interface Payment extends PaymentInput {
  _id: string;
  createdAt: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  category: 'Reels' | 'Events' | 'Portraits' | 'Weddings' | 'Cinematic Videos';
  mediaUrl: string; // Image or thumbnail
  videoUrl?: string; // Optional YouTube / Vimeo / MP4 link for cinematic video/reels modal
  aspectRatio: 'aspect-square' | 'aspect-[3/4]' | 'aspect-[4/3]' | 'aspect-[16/9]' | 'aspect-[9/16]';
}

export interface StudioService {
  id: string;
  title: string;
  priceRange: string;
  features: string[];
  isPopular?: boolean;
}
