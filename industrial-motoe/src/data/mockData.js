export const devices = [
    { id: 'DEV-001', status: 'online' },
    { id: 'DEV-002', status: 'offline' },
    { id: 'DEV-003', status: 'online' },
  ];
  
  export const metrics = {
    vibration: 3.5,          // g
    temperature: 75,         // °F
    current: 12.3            // A
  };
  
  export const history = [
    { ts: '2024‑09‑10 08:00', dev: 'DEV-001', vib: 2.8, temp: 72, cur: 11.9, risk: 1 },
    { ts: '2024‑09‑10 09:00', dev: 'DEV-002', vib: 3.0, temp: 78, cur: 12.5, risk: 2 },
    // ... add more rows if desired
  ];
  