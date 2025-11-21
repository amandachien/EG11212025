// Netlify Function for Air Quality Data
// This keeps your API key secure on the server side

exports.handler = async (event, context) => {
    // Only allow GET requests
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { lat, lon } = event.queryStringParameters || {};

        if (!lat || !lon) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Latitude and longitude are required' })
            };
        }

        // Call OpenWeatherMap Air Pollution API with secure API key
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Air Quality API error: ${response.status}`);
        }

        const data = await response.json();

        // Extract air quality information
        const airQualityData = {
            aqi: data.list[0].main.aqi, // 1-5 scale
            components: {
                co: data.list[0].components.co,
                no2: data.list[0].components.no2,
                o3: data.list[0].components.o3,
                pm2_5: data.list[0].components.pm2_5,
                pm10: data.list[0].components.pm10
            },
            // Convert to US AQI scale (0-500)
            aqiUS: convertToUSAQI(data.list[0].main.aqi, data.list[0].components.pm2_5)
        };

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=600' // Cache for 10 minutes
            },
            body: JSON.stringify(airQualityData)
        };

    } catch (error) {
        console.error('Air Quality API error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to fetch air quality data',
                message: error.message
            })
        };
    }
};

// Helper function to convert to US AQI scale
function convertToUSAQI(europeanAQI, pm25) {
    // Simplified conversion based on PM2.5
    // European AQI: 1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=Very Poor
    const aqiBreakpoints = [
        { min: 0, max: 12, aqiMin: 0, aqiMax: 50 },
        { min: 12.1, max: 35.4, aqiMin: 51, aqiMax: 100 },
        { min: 35.5, max: 55.4, aqiMin: 101, aqiMax: 150 },
        { min: 55.5, max: 150.4, aqiMin: 151, aqiMax: 200 },
        { min: 150.5, max: 250.4, aqiMin: 201, aqiMax: 300 },
        { min: 250.5, max: 500, aqiMin: 301, aqiMax: 500 }
    ];

    for (const bp of aqiBreakpoints) {
        if (pm25 >= bp.min && pm25 <= bp.max) {
            const aqi = ((bp.aqiMax - bp.aqiMin) / (bp.max - bp.min)) * (pm25 - bp.min) + bp.aqiMin;
            return Math.round(aqi);
        }
    }

    return 500; // Maximum AQI if out of range
}
