async function geocodePlace(place: string): Promise<[number, number] | null> {
  try {
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(place)}`);
    const data = await res.json();
    if (!res.ok) return null;
    if (typeof data?.lat === 'number' && typeof data?.lng === 'number') {
      return [data.lat, data.lng];
    }
    return null;
  } catch {
    return null;
  }
}
export default geocodePlace;