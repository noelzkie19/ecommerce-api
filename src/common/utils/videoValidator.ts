/**
 * Video Validator Utility
 *
 * Validates YouTube URLs and extracts video IDs for embedding.
 */

/**
 * Regular expression patterns for YouTube URLs
 */
const YOUTUBE_URL_PATTERNS = [
  // youtube.com/watch?v=VIDEO_ID
  /^https?:\/\/(www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
  // youtu.be/VIDEO_ID
  /^https?:\/\/(www\.)?youtu\.be\/([a-zA-Z0-9_-]+)/,
  // youtube.com/embed/VIDEO_ID
  /^https?:\/\/(www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
  // youtube.com/v/VIDEO_ID
  /^https?:\/\/(www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]+)/,
];

/**
 * Check if a URL is a valid YouTube URL
 * @param url - The URL to validate
 * @returns true if valid YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
  if (!url || typeof url !== "string") {
    return false;
  }

  return YOUTUBE_URL_PATTERNS.some((pattern) => pattern.test(url));
}

/**
 * Extract the YouTube video ID from a URL
 * @param url - The YouTube URL
 * @returns The video ID or null if invalid
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== "string") {
    return null;
  }

  for (const pattern of YOUTUBE_URL_PATTERNS) {
    const match = pattern.exec(url);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Get the YouTube embed URL from a regular YouTube URL
 * @param url - The YouTube URL
 * @returns The embed URL or null if invalid
 */
export function getYouTubeEmbedUrl(url: string): string | null {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    return null;
  }

  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Validate and return embed URL, or throw error if invalid
 * @param url - The URL to validate
 * @returns The embed URL
 * @throws Error if URL is invalid
 */
export function validateYouTubeUrl(url: string): string {
  if (!isValidYouTubeUrl(url)) {
    throw new Error(
      "Invalid YouTube URL. Please use a valid YouTube URL (youtube.com/watch?v= or youtu.be/)",
    );
  }

  const embedUrl = getYouTubeEmbedUrl(url);
  if (!embedUrl) {
    throw new Error("Could not extract video ID from URL");
  }

  return embedUrl;
}
