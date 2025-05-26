document.getElementById('search-button').addEventListener('click', async () => {
  const itemName = document.getElementById('item-name').value.trim();
  if (!itemName) {
      alert('Please enter an item name.');
      return;
  }

  try {
      const response = await fetch(`http://localhost:3000/api/search?q=${encodeURIComponent(itemName)}`);
      if (!response.ok) {
          throw new Error('Failed to fetch eBay data');
      }

      const data = await response.json();
      displayResults(data);
  } catch (error) {
      console.error('Error fetching eBay data:', error);
      document.getElementById('results').innerHTML = 'Error fetching eBay data.';
  }
});

function displayResults(data) {
  const resultsContainer = document.getElementById('results');
  resultsContainer.innerHTML = `
      <h3>eBay Results</h3>
      <p>Average Price (Last 90 Days): $${data.averagePrice}</p>
      <p>Number of Items Sold (Last 90 Days): ${data.itemsSold}</p>
  `;
}
