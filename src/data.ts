import { PortfolioItem, StudioService } from './types';

export const servicesData: StudioService[] = [
  {
    id: 'reels_editing',
    title: 'REELS EDITING',
    priceRange: '₹500 - ₹1,000',
    features: [
      'Trend edits & overlays',
      'Viral transitions & SFX',
      'Ultra-fast express delivery',
      'Instagram post optimization',
    ],
  },
  {
    id: 'videography',
    title: 'VIDEOGRAPHY',
    priceRange: '₹1,000 - ₹10,000',
    features: [
      'Stunning 4K high-FPS shooting',
      'Corporate & family events coverage',
      'High-end cinematic editing',
      'Hollywood-grade color grading',
    ],
    isPopular: true,
  },
  {
    id: 'photography',
    title: 'PHOTOGRAPHY',
    priceRange: '₹5,000',
    features: [
      'HD high-resolution photos',
      'Premium professional editing',
      'Custom color correction',
      'Studio portrait retouching',
    ],
  },
];

export const portfolioData: PortfolioItem[] = [
  // Weddings
  {
    id: 'p-wed-1',
    title: 'Eternal Vows Cinematic Wedding Film',
    category: 'Weddings',
    mediaUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-bride-and-groom-posing-in-a-field-42586-large.mp4',
    aspectRatio: 'aspect-[16/9]',
  },
  {
    id: 'p-wed-2',
    title: 'Royal Indian Groom & Bride Highlight',
    category: 'Weddings',
    mediaUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-couple-walking-in-a-forest-42585-large.mp4',
    aspectRatio: 'aspect-[16/9]',
  },
  
  // Cinematic Videos
  {
    id: 'p-cin-1',
    title: 'Mountain Sunset Drone Reel',
    category: 'Cinematic Videos',
    mediaUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    aspectRatio: 'aspect-[16/9]',
  },
  {
    id: 'p-cin-2',
    title: 'Midnight Streets Neon Cinematography',
    category: 'Cinematic Videos',
    mediaUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-neon-light-reflections-in-wet-asphalt-34825-large.mp4',
    aspectRatio: 'aspect-[16/9]',
  },

  // Reels
  {
    id: 'p-reel-1',
    title: 'Urban Fashion Transition Reel',
    category: 'Reels',
    mediaUrl: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-smiling-at-a-fashion-photoshoot-42358-large.mp4',
    aspectRatio: 'aspect-[9/16]',
  },
  {
    id: 'p-reel-2',
    title: 'Cyberpunk Gym Motivation Reel',
    category: 'Reels',
    mediaUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-weights-being-lifted-in-a-dark-gym-43093-large.mp4',
    aspectRatio: 'aspect-[9/16]',
  },

  // Events
  {
    id: 'p-eve-1',
    title: 'Neon Electronic Music Festival Aftermovie',
    category: 'Events',
    mediaUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-dj-performing-at-a-music-festival-42588-large.mp4',
    aspectRatio: 'aspect-[16/9]',
  },
  {
    id: 'p-eve-2',
    title: 'Grand Concert Laser Stage Reel',
    category: 'Events',
    mediaUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-crowd-cheering-at-a-concert-42590-large.mp4',
    aspectRatio: 'aspect-[16/9]',
  },

  // Portraits
  {
    id: 'p-por-1',
    title: 'Monochrome High-Fashion Model Reel',
    category: 'Portraits',
    mediaUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-portrait-of-a-fashion-model-outdoors-42359-large.mp4',
    aspectRatio: 'aspect-[9/16]',
  },
  {
    id: 'p-por-2',
    title: 'Glow-in-the-dark Futuristic Kinetic Reel',
    category: 'Portraits',
    mediaUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-with-neon-lights-on-her-face-42592-large.mp4',
    aspectRatio: 'aspect-[9/16]',
  }
];
