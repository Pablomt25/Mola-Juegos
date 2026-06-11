const listeners = {};

export function onEvent(event, callback) {
  if (!listeners[event]) listeners[event] = [];
  listeners[event].push(callback);
  return () => {
    listeners[event] = listeners[event].filter(cb => cb !== callback);
  };
}

export function emitEvent(event, data) {
  if (!listeners[event]) return;
  listeners[event].forEach(cb => cb(data));
}

export function removeEventListener(event, callback) {
  if (!listeners[event]) return;
  listeners[event] = listeners[event].filter(cb => cb !== callback);
}