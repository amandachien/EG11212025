// Netlify Function for Plant Identification
// This keeps your API key secure on the server side

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { imageData } = JSON.parse(event.body);

        if (!imageData) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Image data is required' })
            };
        }

        // Call Plant.id API with secure API key
        const response = await fetch('https://api.plant.id/v2/identify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Api-Key': process.env.PLANT_ID_API_KEY
            },
            body: JSON.stringify({
                images: [imageData],
                modifiers: ['similar_images'],
                plant_details: [
                    'common_names',
                    'taxonomy',
                    'url',
                    'wiki_description',
                    'edible_parts'
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`Plant.id API error: ${response.status}`);
        }

        const data = await response.json();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('Plant identification error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to identify plant',
                message: error.message
            })
        };
    }
};
