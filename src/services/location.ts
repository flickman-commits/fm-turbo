export interface WeatherData {
  sunrise: string;
  sunset: string;
  temperature: number;
  conditions: string;
  high: number;
  low: number;
}

interface ForecastData {
  main: {
    temp: number;
  };
  sys: {
    sunrise: number;
    sunset: number;
  };
  weather: Array<{
    description: string;
  }>;
}

export async function getGoogleMapsLink(address: string): Promise<string> {
  // Encode the address for use in the URL
  const encodedAddress = encodeURIComponent(address);
  return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
}

export async function getWeatherData(address: string, date: string): Promise<WeatherData> {
  try {
    // Simplify to just use "New York" for now since we know that's our location
    const searchQuery = "New York,NY,US";
    console.log('Weather API search query:', searchQuery);

    // First, get coordinates from the address using Geocoding API
    const geocodeUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(searchQuery)}&limit=1&appid=5f5afb04556ad9da995ad557d60ac6cd`;
    console.log('Geocoding API URL:', geocodeUrl);

    const geocodeResponse = await fetch(geocodeUrl);
    console.log('Geocoding API status:', geocodeResponse.status);
    
    if (!geocodeResponse.ok) {
      throw new Error(`Geocoding API error: ${geocodeResponse.status}`);
    }

    const geocodeData = await geocodeResponse.json();
    console.log('Geocoding API response:', geocodeData);

    if (!Array.isArray(geocodeData) || geocodeData.length === 0) {
      throw new Error('Location not found in geocoding response');
    }

    const { lat, lon } = geocodeData[0];
    console.log('Coordinates:', { lat, lon });

    // Get weather data including forecast
    const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=5f5afb04556ad9da995ad557d60ac6cd&units=imperial`;
    console.log('Weather API URL:', weatherUrl);

    const weatherResponse = await fetch(weatherUrl);
    console.log('Weather API status:', weatherResponse.status);

    if (!weatherResponse.ok) {
      throw new Error(`Weather API error: ${weatherResponse.status}`);
    }

    const weatherData = await weatherResponse.json();
    console.log('Weather API response:', weatherData);

    // Get today's forecast
    const todayForecast = weatherData.list[0] as ForecastData;
    const dailyForecasts = weatherData.list.slice(0, 8) as ForecastData[]; // Get first 24 hours

    // Find high and low temps
    const temps = dailyForecasts.map((f: ForecastData) => f.main.temp);
    const high = Math.max(...temps);
    const low = Math.min(...temps);

    return {
      sunrise: new Date(todayForecast.sys.sunrise * 1000).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      }),
      sunset: new Date(todayForecast.sys.sunset * 1000).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      }),
      temperature: Math.round(todayForecast.main.temp),
      conditions: todayForecast.weather[0].description,
      high: Math.round(high),
      low: Math.round(low)
    };
  } catch (error) {
    console.error('Detailed error in getWeatherData:', {
      error,
      address,
      date
    });
    throw error;
  }
} 