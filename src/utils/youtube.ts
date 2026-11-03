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
}

export const YOUTUBE_STREAM_PRESETS: YouTubePreset[] = [
  {
    id: 'lofi-girl',
    name: {
      ro: 'Lofi Girl • Beats to relax / study',
      ru: 'Lofi Girl • Уютный чилл & лофай',
    },
    genre: 'Lofi Hip Hop • 24/7 Live',
    url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    thumbnail: 'https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg',
  },
  {
    id: 'coffee-shop-radio',
    name: {
      ro: 'Coffee Shop Radio • 24/7 Cafe Vibes',
      ru: 'Кофейное радио • 24/7 атмосфера кофейни',
    },
    genre: 'Lofi & Chillhop • 24/7 Live',
    url: 'https://www.youtube.com/watch?v=lP26UCnoH9s',
    thumbnail: 'https://img.youtube.com/vi/lP26UCnoH9s/hqdefault.jpg',
  },
  {
    id: 'cozy-jazz-cafe',
    name: {
      ro: 'Cozy Jazz Cafe • Sax & Piano relax',
      ru: 'Уютный кофейный джаз • Саксофон и пианино',
    },
    genre: 'Smooth Instrumental Jazz',
    url: 'https://www.youtube.com/watch?v=fEvM-OUq940',
    thumbnail: 'https://img.youtube.com/vi/fEvM-OUq940/hqdefault.jpg',
  },
  {
    id: 'bossa-nova-morning',
    name: {
      ro: 'Bossa Nova Cafe • Chitara & soare',
      ru: 'Босса-нова в кофейне • Солнечная гитара',
    },
    genre: 'Acoustic Bossa Nova',
    url: 'https://www.youtube.com/watch?v=4xDzrJKXOOY',
    thumbnail: 'https://img.youtube.com/vi/4xDzrJKXOOY/hqdefault.jpg',
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
      embedUrl: `https://www.youtube-nocookie.com/embed/videoseries?list=${listId}&autoplay=1&mute=0&controls=0&playsinline=1&enablejsapi=1&loop=1`,
      canonicalUrl: `https://www.youtube.com/playlist?list=${listId}`,
    };
  }

  // 2. Check for standard 11-char video ID (or live stream)
  // Supports youtube.com/watch?v=ID, youtu.be/ID, youtube.com/live/ID, youtube.com/embed/ID
  const videoMatch = str.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|live\/))([a-zA-Z0-9_-]{11})/
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
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=0&controls=0&playsinline=1&enablejsapi=1&loop=1${extraPlaylist}`,
      canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
    };
  }

  return { type: 'invalid', id: null, embedUrl: null, canonicalUrl: null };
}

export function extractYouTubeId(urlOrId?: string | null): string | null {
  const parsed = parseYouTubeUrl(urlOrId);
  return parsed.id;
}
