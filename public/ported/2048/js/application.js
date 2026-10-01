// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(function () {
  // Quadra: every round starts from an empty board.
  try { localStorage.removeItem("quadra2048.state"); } catch (e) {}
  new GameManager(4, KeyboardInputManager, HTMLActuator, LocalStorageManager);
});
