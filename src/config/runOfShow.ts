export const runOfShowConfig = {
  title: "Run of Show",
  sections: [
    {
      title: "Location",
      content: (data: any) => {
        const getWeatherEmoji = (condition: string) => {
          const conditions = condition.toLowerCase();
          if (conditions.includes('snow')) return '🌨️';
          if (conditions.includes('rain')) return '🌧️';
          if (conditions.includes('cloud')) return '☁️';
          if (conditions.includes('clear')) return '☀️';
          if (conditions.includes('sun')) return '☀️';
          if (conditions.includes('thunder')) return '⛈️';
          if (conditions.includes('fog')) return '🌫️';
          if (conditions.includes('mist')) return '🌫️';
          return '🌤️'; // default to partly cloudy
        };

        const locationName = data.location || 'N/A';
        const weather = data.weather ? 
          `${getWeatherEmoji(data.weather.conditions)} **${data.weather.high}°F** | ${data.weather.low}°F` : 
          'N/A';
        const mapsLink = data.googleMapsLink || '';
        const address = data.address || '';
        
        return [
          `**Location:** ${locationName}`,
          `**Address:** ${address}`,
          `[View in Google Maps](${mapsLink})`,
          `**Weather Conditions:** ${weather}`
        ].join('\n');
      }
    },
    // ... rest of existing code ...
  ]
}; 