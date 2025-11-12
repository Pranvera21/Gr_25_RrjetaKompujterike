// Module containing a list of known clients and functions to resolve client names based on IP addresses

const knownClients = [
  {
    ip: '127.0.0.1',
    name: 'Localhost Admin',
    type: 'admin',
    privileges: ['read', 'write', 'execute']
  },
  {
    ip: '192.168.1.100',
    name: 'Client-001',
    type: 'client',
    privileges: ['read']
  },
  {
    ip: '192.168.1.101',
    name: 'Client-002',
    type: 'client',
    privileges: ['read']
  },
  {
    ip: '192.168.1.102',
    name: 'Client-003',
    type: 'client',
    privileges: ['read']
  },
  {
    ip: '10.0.0.1',
    name: 'Admin-001',
    type: 'admin',
    privileges: ['read', 'write', 'execute']
  }
];

/**
 * Resolves client name based on IP address
 * @param {string} ipAddress - The IP address to lookup
 * @returns {string|null} - The client name if found, null otherwise
 */
function resolveClientName(ipAddress) {
  const client = knownClients.find(client => client.ip === ipAddress);
  return client ? client.name : null;
}

/**
 * Gets client information based on IP address
 * @param {string} ipAddress - The IP address to lookup
 * @returns {object|null} - The client object if found, null otherwise
 */
function getClientInfo(ipAddress) {
  const client = knownClients.find(client => client.ip === ipAddress);
  return client || null;
}

/**
 * Checks if a client has admin privileges
 * @param {string} ipAddress - The IP address to check
 * @returns {boolean} - True if client has admin privileges, false otherwise
 */
function isAdmin(ipAddress) {
  const client = getClientInfo(ipAddress);
  return client && client.type === 'admin';
}

/**
 * Checks if a client has a specific privilege
 * @param {string} ipAddress - The IP address to check
 * @param {string} privilege - The privilege to check (read, write, execute)
 * @returns {boolean} - True if client has the privilege, false otherwise
 */
function hasPrivilege(ipAddress, privilege) {
  const client = getClientInfo(ipAddress);
  if (!client) return false;
  
  // Admin clients have all privileges
  if (client.type === 'admin') return true;
  
  return client.privileges.includes(privilege);
}

/**
 * Gets all known clients
 * @returns {array} - Array of all known clients
 */
function getAllClients() {
  return knownClients;
}

/**
 * Adds a new client to the known clients list
 * @param {string} ip - The IP address
 * @param {string} name - The client name
 * @param {string} type - The client type (admin or client)
 * @param {array} privileges - Array of privileges
 */
function addClient(ip, name, type = 'client', privileges = ['read']) {
  // Check if client already exists
  if (getClientInfo(ip)) {
    throw new Error(`Client with IP ${ip} already exists`);
  }
  
  knownClients.push({
    ip,
    name,
    type,
    privileges
  });
}

/**
 * Removes a client from the known clients list
 * @param {string} ipAddress - The IP address to remove
 * @returns {boolean} - True if client was removed, false otherwise
 */
function removeClient(ipAddress) {
  const index = knownClients.findIndex(client => client.ip === ipAddress);
  if (index !== -1) {
    knownClients.splice(index, 1);
    return true;
  }
  return false;
}

export {
  knownClients,
  resolveClientName,
  getClientInfo,
  isAdmin,
  hasPrivilege,
  getAllClients,
  addClient,
  removeClient
};

