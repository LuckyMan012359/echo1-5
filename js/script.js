function saveApiInfo(endpoint, token) {
  localStorage.setItem('apiEndpoint', endpoint);
  localStorage.setItem('apiToken', token);
}

function getApiInfo() {
  return {
    endpoint: localStorage.getItem('apiEndpoint') || document.getElementById('apiEndpointSelect').value,
    token: localStorage.getItem('apiToken')
  };
}

document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const apiToken = document.getElementById('apiToken').value;
  const apiEndpoint = document.getElementById('apiEndpointSelect').value;
  saveApiInfo(apiEndpoint, apiToken);
  document.getElementById('loginContainer').style.display = 'none';
  document.getElementById('menuContainer').style.display = 'flex';
  setupApiCalls();
});

document.getElementById('apiEndpointSelect').addEventListener('change', function() {
  const { token } = getApiInfo();
  saveApiInfo(this.value, token);
});

function setupApiCalls() {
  document.getElementById('getCertificateLink').addEventListener('click', (e) => { e.preventDefault(); handleApiCall('getCertificate'); });
  document.getElementById('freezeLink').addEventListener('click', (e) => { e.preventDefault(); handleApiCall('freeze'); });
  document.getElementById('tagsLink').addEventListener('click', (e) => { e.preventDefault(); handleApiCall('getTags'); });
  document.getElementById('sendMessageLink').addEventListener('click', (e) => { e.preventDefault(); handleApiCall('sendMessage'); });
  document.getElementById('enableLostModeLink').addEventListener('click', (e) => { e.preventDefault(); handleApiCall('enableLostMode'); });
  document.getElementById('getIntegrationLink').addEventListener('click', (e) => { e.preventDefault(); handleApiCall('getIntegration'); });
  document.getElementById('getSoftwareInventoryLink').addEventListener('click', (e) => { e.preventDefault(); handleApiCall('getSoftwareInventory'); });
  document.getElementById('getLegalAssetStatesLink').addEventListener('click', (e) => { e.preventDefault(); handleApiCall('getLegalAssetStates'); });
  document.getElementById('setDeviceAssetStateLink').addEventListener('click', (e) => { e.preventDefault(); handleApiCall('setDeviceAssetState'); });
  document.getElementById('getDeviceStatesLink').addEventListener('click', (e) => { e.preventDefault(); handleApiCall('getDeviceStates'); });
  document.getElementById('unfreezeLink').addEventListener('click', (e) => { e.preventDefault(); handleApiCall('unfreeze'); });
  document.getElementById('addTagLink').addEventListener('click', (e) => { e.preventDefault(); handleApiCall('addTag'); });
}
function getHeaders() {
  const { token } = getApiInfo();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

function formatHeaders(headers) {
  let formattedHeaders = '';
  for (let [key, value] of headers) {
    formattedHeaders += `${key}: ${value}\n`;
  }
  return formattedHeaders;
}

function formatBody(body) {
  if (typeof body === 'object') {
    return JSON.stringify(body, null, 2);
  }
  return body;
}


function displayResponse(response, body) {
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = `
        <div class="response-box">
            <h3>Status</h3>
            <p>Status Code: ${response.status}</p>
            <p>Status Text: ${response.statusText}</p>
        </div>
        <div class="response-box">
            <h3>Headers</h3>
            <pre>${formatHeaders(response.headers)}</pre>
        </div>
        <div class="response-box">
            <h3>Body</h3>
            <pre>${formatBody(body)}</pre>
        </div>
    `;
}

function displayError(error) {
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = `
        <div class="response-box error">
            <h3>Error</h3>
            <pre>${error.message}</pre>
        </div>
    `;
}

async function handleResponse(response) {
  const contentType = response.headers.get("content-type");
  let body;
  try {
    if (contentType && contentType.indexOf("application/json") !== -1) {
      body = await response.json();
    } else {
      body = await response.text();
    }
  } catch (error) {
    body = `Error parsing response body: ${error.message}`;
  }

  displayResponse(response, body);
}

async function handleApiCall(apiFunction) {
  try {
    const { endpoint } = getApiInfo();
    const apiConfig = apiConfigurations[apiFunction](endpoint);
    const response = await fetch(apiConfig.url, {
      method: apiConfig.method,
      headers: getHeaders(),
      body: apiConfig.body ? JSON.stringify(apiConfig.body) : undefined
    });
    await handleResponse(response);
  } catch (error) {
    displayError(error);
    console.error("API call failed:", error);
  }
}

const apiConfigurations = {
  getCertificate: (endpoint) => {
    const serialNumber = document.getElementById('serialNumberInput').value;
    const token = prompt("Enter token:");
    if (!serialNumber || !token) {
      displayError(new Error("Serial number and token are required"));
      return null;
    }
    return {
      url: `${endpoint}/api/device/${serialNumber}/certificate/${token}`,
      method: 'GET'
    };
  },
  freeze: (endpoint) => {
    const serialNumber = document.getElementById('serialNumberInput').value;
    const message = prompt("Enter freeze message:");
    const duration = prompt("Enter duration (in hours):");
    const date = prompt("Enter date (YYYY-MM-DD):");
    if (!serialNumber || !message || !duration || !date) {
      displayError(new Error("All fields are required"));
      return null;
    }
    return {
      url: `${endpoint}/api/device/${serialNumber}/freeze`,
      method: 'PUT',
      body: { message, duration: parseInt(duration), date }
    };
  },
  getTags: (endpoint) => ({
    url: `${endpoint}/api/tags`,
    method: 'GET'
  }),
  sendMessage: (endpoint) => {
    const serialNumber = document.getElementById('serialNumberInput').value;
    const message = prompt("Enter message:");
    const subject = prompt("Enter subject:");
    const sender = prompt("Enter sender:");
    const dateTime = prompt("Enter date and time (YYYY-MM-DDTHH:mm:ss):");
    const priority = prompt("Enter priority (integer):");
    if (!serialNumber || !message || !subject || !sender || !dateTime || !priority) {
      throw new Error("All fields are required");
    }
    return {
      url: `${endpoint}/api/device/${serialNumber}/send_message`,
      method: 'POST',
      body: { message, subject, sender, dateTime, priority: parseInt(priority) }
    };
  },
  enableLostMode: (endpoint) => {
    const serialNumber = document.getElementById('serialNumberInput').value;
    const message = prompt("Enter lost mode message:");
    const phoneNumber = prompt("Enter phone number:");
    const date = prompt("Enter date (YYYY-MM-DD):");
    const footnote = prompt("Enter footnote:");
    const header = prompt("Enter header:");
    if (!serialNumber || !message || !phoneNumber || !date || !footnote || !header) {
      throw new Error("All fields are required");
    }
    return {
      url: `${endpoint}/api/device/${serialNumber}/enable_lost_mode`,
      method: 'POST',
      body: { message, phoneNumber, date, footnote, header }
    };
  },
  getIntegration: (endpoint) => {
    const code = document.getElementById('codeInput').value;
    if (!code) {
      throw new Error("Code is required");
    }
    return {
      url: `${endpoint}/api/integration/${code}`,
      method: 'GET'
    };
  },
  getSoftwareInventory: (endpoint) => {
    const serialNumber = document.getElementById('serialNumberInput').value;
    const softwareName = prompt("Enter software name:");
    const version = prompt("Enter version:");
    if (!serialNumber || !softwareName || !version) {
      throw new Error("All fields are required");
    }
    return {
      url: `${endpoint}/api/software-inventory/list?serialNumber=${serialNumber}&softwareName=${softwareName}&version=${version}`,
      method: 'GET'
    };
  },
  getLegalAssetStates: (endpoint) => ({
    url: `${endpoint}/api/device/legal-asset-state`,
    method: 'GET'
  }),
  setDeviceAssetState: (endpoint) => {
    const serialNumber = document.getElementById('serialNumberInput').value;
    const state = document.getElementById('stateInput').value;
    if (!serialNumber || !state) {
      throw new Error("Serial number and state are required");
    }
    return {
      url: `${endpoint}/api/device/${serialNumber}/asset-state/${state}`,
      method: 'POST'
    };
  },
  getDeviceStates: (endpoint) => {
    const serialNumber = document.getElementById('serialNumberInput').value;
    const state = document.getElementById('stateInput').value;
    let url = `${endpoint}/api/devicestate`;
    if (serialNumber) url += `?serialNumber=${serialNumber}`;
    if (state) url += `${serialNumber ? '&' : '?'}state=${state}`;
    return { url, method: 'GET' };
  },
  unfreeze: (endpoint) => {
    const serialNumber = document.getElementById('serialNumberInput').value;
    if (!serialNumber) {
      throw new Error("Serial number is required");
    }
    return {
      url: `${endpoint}/api/device/${serialNumber}/unfreeze`,
      method: 'PUT'
    };
  },
  addTag: (endpoint) => {
    const serialNumber = document.getElementById('serialNumberInput').value;
    const tag = prompt("Enter tag:");
    if (!serialNumber || !tag) {
      throw new Error("Serial number and tag are required");
    }
    return {
      url: `${endpoint}/api/tag/addtag/${serialNumber}/${tag}`,
      method: 'POST'
    };
  }
};

// Initialiser dropdown med gemt endpoint, hvis det findes
const savedEndpoint = localStorage.getItem('apiEndpoint');
if (savedEndpoint) {
  document.getElementById('apiEndpointSelect').value = savedEndpoint;
}
