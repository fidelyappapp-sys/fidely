// Google's "write a review" deep link only needs the Place ID — this URL
// format is stable and documented, no API call needed to build it.
export function buildGoogleReviewUrl(placeId: string): string {
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
}
