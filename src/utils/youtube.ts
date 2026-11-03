// YouTube background streaming helper and URL parser for Amika Cafe TV Menu Board

export interface ParsedYouTubeTarget {
  type: 'video' | 'playlist' | 'invalid';
  id: string | null;
  embedUrl: string | null;
  canonicalUrl: string | null;
}

export interface YouTubePreset {
  id: string;
  name: { ro: string; ru: string };
  genre: string;
  url: string;
  thumbnail: string;
  isLive?: boolean;
}

export const YOUTUBE_STREAM_PRESETS: YouTubePreset[] = [
  {
    id: 'chillhop-radio',
    name: {
      ro: 'Chillhop Radio • Jazzy & Lofi Beats',
      ru: 'Chillhop Radio • Джаз и тёплый лофай',
    },
    genre: 'Jazzy & Lofi Beats • 24/7 Live',
    url: 'https://www.youtube.com/watch?v=5yx6BWlEVcY',
    thumbnail: 'https://img.youtube.com/vi/5yx6BWlEVcY/hqdefault.jpg',
    isLive: true,
  },
  {
    id: 'cafe-music-bgm',
    name: {
      ro: 'Cafe Music BGM • Cafe Jazz & Piano',
      ru: 'Cafe Music BGM • Уютный джаз и рояль',
    },
    genre: 'Smooth Cafe Jazz • 24/7 Live',
    url: 'https://www.youtube.com/watch?v=h2a32T45zxs',
    thumbnail: 'https://img.youtube.com/vi/h2a32T45zxs/hqdefault.jpg',
    isLive: true,
  },
  {
    id: 'bakery-cafe-jazz',
    name: {
      ro: 'Bakery Café Jazz • Acustică & Relax',
      ru: 'Кофейный джаз • Нежная акустика и релакс',
    },
    genre: 'Acoustic Cafe Vibes • 24/7 Live',
    url: 'https://www.youtube.com/watch?v=8jyLh3IhvAU',
    thumbnail: 'https://img.youtube.com/vi/8jyLh3IhvAU/hqdefault.jpg',
    isLive: true,
  },
  {
    id: 'synthwave-chill',
    name: {
      ro: 'Synthwave & Chill • Lofi Girl Radio',
      ru: 'Synthwave & Chill • Спокойный вечерний чилл',
    },
    genre: 'Ambient & Chillwave • 24/7 Live',
    url: 'https://www.youtube.com/watch?v=4xDzrJKXOOY',
    thumbnail: 'https://img.youtube.com/vi/4xDzrJKXOOY/hqdefault.jpg',
    isLive: true,
  },
  {
    id: 'cozy-fall-cafe',
    name: {
      ro: 'Cozy Fall Coffee Shop • Jazz & Ploaie',
      ru: 'Осенняя кофейня • Мягкий джаз и шелест дождя',
    },
    genre: 'Smooth Instrumental • Non-stop 8h',
    url: 'https://www.youtube.com/watch?v=VMAPTo7RVCo',
    thumbnail: 'https://img.youtube.com/vi/VMAPTo7RVCo/hqdefault.jpg',
    isLive: false,
  },
  {
    id: 'chillhop-plant-cafe',
    name: {
      ro: 'Plant Café • Lofi Classics',
      ru: 'Plant Café • Классический лофай',
    },
    genre: 'Lofi & Chillhop Classics • Permanent',
    url: 'https://www.youtube.com/watch?v=QyGbnE-RHKA',
    thumbnail: 'https://img.youtube.com/vi/QyGbnE-RHKA/hqdefault.jpg',
    isLive: false,
  },
];

export function parseYouTubeUrl(input?: string | null): ParsedYouTubeTarget {
  if (!input || !input.trim()) {
    return { type: 'invalid', id: null, embedUrl: null, canonicalUrl: null };
  }
  const str = input.trim();

  // 1. Check for pure playlist: list=...
  const playlistMatch = str.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (playlistMatch && playlistMatch[1] && !str.includes('watch?v=') && !str.includes('youtu.be/')) {
    const listId = playlistMatch[1];
    return {
      type: 'playlist',
      id: listId,
      embedUrl: `https://www.youtube.com/embed/videoseries?list=${listId}&autoplay=1&mute=0&controls=0&playsinline=1&enablejsapi=1&loop=1`,
      canonicalUrl: `https://www.youtube.com/playlist?list=${listId}`,
    };
  }

  // 2. Check for standard 11-char video ID (or live stream)
  // Supports youtube.com/watch?v=ID, youtu.be/ID, youtube.com/live/ID, youtube.com/embed/ID, /shorts/ID, m.youtube.com
  const videoMatch = str.match(
    /(?:youtu\.be\/|(?:www\.|m\.|music\.)?youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|live\/|shorts\/))([a-zA-Z0-9_-]{11})/
  );

  let videoId: string | null = null;
  if (videoMatch && videoMatch[1]) {
    videoId = videoMatch[1];
  } else if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
    videoId = str;
  }

  if (videoId) {
    const extraPlaylist = playlistMatch ? `&list=${playlistMatch[1]}` : `&playlist=${videoId}`;
    return {
      type: 'video',
      id: videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=0&playsinline=1&enablejsapi=1&loop=1${extraPlaylist}`,
      canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
    };
  }

  return { type: 'invalid', id: null, embedUrl: null, canonicalUrl: null };
}

export function extractYouTubeId(urlOrId?: string | null): string | null {
  const parsed = parseYouTubeUrl(urlOrId);
  return parsed.id;
}
