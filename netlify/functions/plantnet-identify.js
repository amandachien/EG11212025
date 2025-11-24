// Netlify Function for PlantNet Identification
// Acts as a fallback when Plant.id quota is reached

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

        // Convert base64 to buffer
        const buffer = Buffer.from(imageData, 'base64');

        // Create FormData for PlantNet API
        // Note: In Node.js environment (Netlify Functions), we need to construct the multipart request manually
        // or use a library. Here we'll use a simple boundary approach.
        const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

        let body = '';
        body += `--${boundary}\r\n`;
        body += 'Content-Disposition: form-data; name="images"; filename="plant.jpg"\r\n';
        body += 'Content-Type: image/jpeg\r\n\r\n';

        // We can't easily mix string and buffer in a string body, so we'll use the API key as a query param
        // and send the image as a standard file upload if possible, but PlantNet accepts image url or file.
        // Since we have base64, let's try to send it as a file.

        // Alternative: Use the 'images' parameter with the base64 string if supported, 
        // but PlantNet usually expects a file.

        // Let's use a simpler approach: fetch with FormData if available, or construct the body.
        // Since we are in Node, let's use the 'node-fetch' style or standard fetch if Node 18+.

        const apiKey = process.env.PLANTNET_API_KEY;
        const lang = 'en';
        const url = `https://my-api.plantnet.org/v2/identify/all?api-key=${apiKey}&lang=${lang}`;

        // Construct multipart body manually with Buffer
        const preAmble = Buffer.from(
            `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="images"; filename="plant.jpg"\r\n` +
            `Content-Type: image/jpeg\r\n\r\n`
        );

        const postAmble = Buffer.from(`\r\n--${boundary}--\r\n`);

        const finalBody = Buffer.concat([preAmble, buffer, postAmble]);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`
            },
            body: finalBody
        });

        if (!response.ok) {
            throw new Error(`PlantNet API error: ${response.status}`);
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
        console.error('PlantNet identification error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to identify plant with PlantNet',
                message: error.message
            })
        };
    }
};
