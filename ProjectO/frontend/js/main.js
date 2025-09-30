const queryInput = document.getElementById('queryInput');
const submitBtn = document.getElementById('submitBtn');
const responseSection = document.getElementById('response-section');
const responseOutput = document.getElementById('responseOutput');
const newQueryBtn = document.getElementById('newQueryBtn');
const querySection = document.getElementById('query-section');

const API_URL = 'http://localhost:5000/api/query';

async function handleSubmit() {
  const query = queryInput.value.trim();
  if (!query) {
    alert('Please enter a question.');
    return;
  }

  queryInput.disabled = true;
  submitBtn.disabled = true;
  responseOutput.textContent = 'Waiting for response...';
  responseSection.hidden = false;
  querySection.hidden = true;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ question: query })
    });
    const data = await response.json();
    if (response.ok) {
      responseOutput.textContent = data.answer || 'No response from AI.';
    } else {
      responseOutput.textContent = `Error: ${data.error || 'Unknown error'}`;
    }
  } catch (error) {
    responseOutput.textContent = `Network or server error: ${error.message}`;
  } finally {
    queryInput.disabled = false;
    submitBtn.disabled = false;
  }
}

function handleNewQuery() {
  queryInput.value = '';
  responseOutput.textContent = '';
  responseSection.hidden = true;
  querySection.hidden = false;
  queryInput.focus();
}

submitBtn.addEventListener('click', handleSubmit);
newQueryBtn.addEventListener('click', handleNewQuery);
