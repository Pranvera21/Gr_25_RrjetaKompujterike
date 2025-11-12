
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



 * Gets all known clients
 * @returns {array} - Array of all known clients
 */
function getAllClients() {
