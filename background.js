require('dotenv').config();

async function fetchEbayData(query) {
    const ebayApiUrl = `https://api.ebay.com/findCompletedItems?keywords=${encodeURIComponent(query)}&soldItemsOnly=true`;

    try {
        const response = await fetch(ebayApiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer `${process.env.CLIENT_ID}`'
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch eBay data");
        }

        const data = await response.json();
        return processEbayData(data);
    } catch (error) {
        console.error(error);
        return { averagePrice: "N/A", saleCount: 0 };
    }
}

function processEbayData(data) {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const items = data.findCompletedItemsResponse?.[0]?.searchResult?.[0]?.item || [];
    const filteredItems = items.filter(item => {
        const endTime = new Date(item.listingInfo[0].endTime[0]);
        return endTime >= ninetyDaysAgo && item.sellingStatus[0].sellingState[0] === "EndedWithSales";
    });

    const totalPrice = filteredItems.reduce((sum, item) => {
        return sum + parseFloat(item.sellingStatus[0].currentPrice[0].__value__);
    }, 0);

    const averagePrice = filteredItems.length > 0 ? totalPrice / filteredItems.length : 0;
    return { averagePrice: averagePrice.toFixed(2), saleCount: filteredItems.length };
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SEARCH_EBAY') {
        fetchEbayData(message.query).then(summary => {
            sendResponse(summary);
        });
        return true; // Keep the message channel open for async response
    }
});
