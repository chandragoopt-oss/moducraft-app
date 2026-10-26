// ModuCraft Custom Patch File
// Paste any new features from Claude below this line.
// --- PATCH: Change Today Page Title ---
const originalTodayCard = todayCard;
todayCard = function() {
    let html = originalTodayCard();
    // Find the old title and replace it with the new one
    return html.replace("Today —", "Welcome Back! Today is");
};
