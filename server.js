import 'dotenv/config'
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3000;

// eBay OAuth credentials
const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const TOKEN_URL = process.env.TOKEN_URL;
const BROWSE_API_URL = process.env.BROWSE_URL;


app.use(cors());
app.use(express.json());

// Generate OAuth token
async function getAccessToken() {
    const body = new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'https://api.ebay.com/oauth/api_scope',
    });

    const response = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
        },
        body,
    });

    if (!response.ok) {
        throw new Error('Failed to fetch access token');
    }

    const tokenData = await response.json();
    return tokenData.access_token;
}

// Fetch eBay data
app.get('/api/search', async (req, res) => {
    const query = req.query.q || 'iphone';
    try {
        const accessToken = await getAccessToken();

        const response = await fetch(`${BROWSE_API_URL}?q=${encodeURIComponent(query)}&limit=50`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch eBay data');
        }

        const data = await response.json();

        // Process the data to calculate average price and count
        const itemSummaries = data.itemSummaries || [];
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        let totalPrice = 0;
        let count = 0;

        itemSummaries.forEach(item => {
            const creationDate = new Date(item.itemCreationDate);
            if (creationDate >= ninetyDaysAgo) {
                totalPrice += parseFloat(item.price.value);
                count++;
            }
        });

        const averagePrice = count > 0 ? (totalPrice / count).toFixed(2) : 0;

        // Return processed data
        res.json({
            averagePrice,
            itemsSold: count,
        });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch eBay data' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
