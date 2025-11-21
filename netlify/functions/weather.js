// Netlify Function for Weather Data
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

        // Call OpenWeatherMap API with secure API key
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Weather API error: ${response.status}`);
        }

        const data = await response.json();

        // Extract relevant weather information
        const weatherData = {
            temperature: data.main.temp,
            condition: data.weather[0].main.toLowerCase(),
            description: data.weather[0].description,
            humidity: data.main.humidity,
            pressure: data.main.pressure,
            windSpeed: data.wind.speed,
            location: data.name
        };

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=600' // Cache for 10 minutes
            },
            body: JSON.stringify(weatherData)
        };

    } catch (error) {
        console.error('Weather API error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to fetch weather data',
                message: error.message
            })
        };
    }
};
