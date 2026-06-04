// YouTube helpers: parse a video id out of any common URL shape, and fetch the
// title + thumbnail using the public oEmbed endpoint (no API key required).

const YOUTUBE_ID_REGEX =
  /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

/**
 * Extract the 11-character video id from a YouTube URL.
 * Supports watch?v=, youtu.be/, /embed/, /shorts/, /live/ and extra params.
 * Returns null if the string isn't a recognizable YouTube link.
 */
export function extractYouTubeId(url: string): string | null {
  const trimmed = url.trim();
  const match = trimmed.match(YOUTUBE_ID_REGEX);
  return match ? match[1] : null;
}

export type YouTubeMeta = {
  title: string;
  thumbnail: string;
};

/**
 * Fetch the title + thumbnail for a video id via YouTube's oEmbed endpoint.
 * If the request fails (private/removed video, network error) we fall back to
 * a generic title and the always-available hqdefault thumbnail so submission
 * never hard-fails.
 */
export async function fetchYouTubeMeta(videoId: string): Promise<YouTubeMeta> {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const fallback: YouTubeMeta = {
    title: `YouTube video ${videoId}`,
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  };

  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(
        watchUrl,
      )}&format=json`,
      { cache: "no-store" },
    );
    if (!res.ok) return fallback;

    const data = (await res.json()) as {
      title?: string;
      thumbnail_url?: string;
    };

    return {
      title: data.title?.trim() || fallback.title,
      thumbnail: data.thumbnail_url || fallback.thumbnail,
    };
  } catch {
    return fallback;
  }
}
