window.switchRoom = function(idx) { activeRoomIndex = parseInt(idx); };
window.zoomCanvas = function(factor) { currentZoom *= factor; applyTransform(); };
function applyTransform() { if (plan) plan.style.transform = `translate(${panX}px, ${panY}px) scale(${currentZoom})`; }

// Initialize on load
setTimeout(loadRoomsDropdown, 100);
