export type ResolvedLocation = {
  address: string;
  suburb: string | null;
  latitude: number;
  longitude: number;
};

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported on this device."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000,
    });
  });
}

export async function resolveCurrentLocation(): Promise<ResolvedLocation> {
  const position = await getCurrentPosition();
  const { latitude, longitude } = position.coords;

  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
  });

  const res = await fetch(`/api/addresses/reverse?${params.toString()}`);
  const data = (await res.json()) as { error?: string; location?: ResolvedLocation };

  if (!res.ok || !data.location) {
    throw new Error(
      data.error ??
        "Your location is outside the BizWatch 4551 service area. Enter an address within postcode 4551.",
    );
  }

  return data.location;
}

export function geolocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Location access was denied. Enter the address manually or allow location in your browser settings.";
    case error.POSITION_UNAVAILABLE:
      return "Your location could not be determined. Enter the address manually.";
    case error.TIMEOUT:
      return "Location request timed out. Try again or enter the address manually.";
    default:
      return "Could not get your current location.";
  }
}
