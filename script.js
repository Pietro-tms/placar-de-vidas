"use strict";

const setupScreen = document.getElementById("setup-screen");
const scoreScreen = document.getElementById("score-screen");
const setupForm = document.getElementById("setup-form");
const playerCountInput = document.getElementById("player-count");
const initialLivesInput = document.getElementById("initial-lives");
const namesContainer = document.getElementById("player-names");
const formError = document.getElementById("form-error");
const scoreboard = document.getElementById("scoreboard");
const announcer = document.getElementById("announcer");
const newGameDialog = document.getElementById("new-game-dialog");

const nameDrafts = Array(15).fill("");
let players = [];
let initialLives = 3;

function isIntegerInRange(value, min, max) {
  return value.trim() !== "" && Number.isInteger(Number(value)) && Number(value) >= min && Number(value) <= max;
}

function clearValidation() {
  formError.hidden = true;
  formError.textContent = "";
  playerCountInput.removeAttribute("aria-invalid");
  initialLivesInput.removeAttribute("aria-invalid");
}

// Returns a validated configuration, or null after explaining the errors.
function validateConfiguration() {
  clearValidation();
  const errors = [];
  let firstInvalid = null;
  if (!isIntegerInRange(playerCountInput.value, 2, 15)) {
    errors.push("Informe um número inteiro de jogadores entre 2 e 15.");
    playerCountInput.setAttribute("aria-invalid", "true");
    firstInvalid = playerCountInput;
  }
  if (!isIntegerInRange(initialLivesInput.value, 1, 30)) {
    errors.push("Informe um número inteiro de vidas entre 1 e 30.");
    initialLivesInput.setAttribute("aria-invalid", "true");
    firstInvalid = firstInvalid || initialLivesInput;
  }
  if (errors.length > 0) {
    formError.textContent = errors.join(" ");
    formError.hidden = false;
    firstInvalid.focus();
    return null;
  }
  return { playerCount: Number(playerCountInput.value), initialLives: Number(initialLivesInput.value) };
}

function renderNameFields() {
  if (!isIntegerInRange(playerCountInput.value, 2, 15)) return;
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < Number(playerCountInput.value); index += 1) {
    const field = document.createElement("div");
    field.className = "field";
    const label = document.createElement("label");
    label.className = "name-label";
    label.htmlFor = `player-name-${index}`;
    label.textContent = `Jogador ${index + 1}`;
    const input = document.createElement("input");
    input.id = label.htmlFor;
    input.name = `playerName${index + 1}`;
    input.type = "text";
    input.placeholder = `Jogador ${index + 1}`;
    input.value = nameDrafts[index];
    input.addEventListener("input", () => { nameDrafts[index] = input.value; });
    field.append(label, input);
    fragment.append(field);
  }
  namesContainer.replaceChildren(fragment);
}

function startGame(event) {
  event.preventDefault();
  const configuration = validateConfiguration();
  if (!configuration) return;
  initialLives = configuration.initialLives;
  players = Array.from({ length: configuration.playerCount }, (_, index) => ({
    name: nameDrafts[index].trim() || `Jogador ${index + 1}`,
    lives: initialLives
  }));
  renderScoreboard();
  setupScreen.hidden = true;
  scoreScreen.hidden = false;
  document.getElementById("score-title").focus();
}

function renderScoreboard() {
  scoreboard.replaceChildren();
  scoreboard.classList.toggle("two-players", players.length === 2);
  players.forEach((player, index) => {
    const card = document.createElement("article");
    card.className = "player-card";
    card.dataset.suit = ["♠", "♥", "♣", "♦"][index % 4];
    card.id = `player-${index}`;
    card.setAttribute("aria-labelledby", `name-${index}`);
    // This template is static. User-provided names are assigned with textContent.
    card.innerHTML = `<div class="player-header"><span class="avatar" aria-hidden="true"></span><div><h2 class="player-name"></h2><div class="player-status"></div></div></div><span class="life-total"></span><div class="life-caption"></div><div class="hearts" aria-hidden="true"></div><div class="life-controls"><button class="button secondary life-button lose-life" type="button">−</button><button class="button primary life-button gain-life" type="button">+</button></div>`;
    card.querySelector(".avatar").textContent = card.dataset.suit;
    const name = card.querySelector(".player-name");
    name.id = `name-${index}`;
    name.textContent = player.name;
    const loseButton = card.querySelector(".lose-life");
    const gainButton = card.querySelector(".gain-life");
    loseButton.setAttribute("aria-label", `Tirar uma vida de ${player.name}`);
    gainButton.setAttribute("aria-label", `Dar uma vida a ${player.name}`);
    loseButton.addEventListener("click", () => updateLives(index, -1));
    gainButton.addEventListener("click", () => updateLives(index, 1));
    scoreboard.append(card);
    renderPlayerLives(index);
  });
  updateMatchSummary();
}

function renderPlayerLives(index) {
  const player = players[index];
  const card = document.getElementById(`player-${index}`);
  const eliminated = player.lives === 0;
  card.classList.toggle("eliminated", eliminated);
  card.querySelector(".player-status").textContent = eliminated ? "Eliminado" : "No jogo";
  card.querySelector(".life-total").textContent = player.lives;
  card.querySelector(".life-caption").textContent = player.lives === 1 ? "vida restante" : "vidas restantes";
  const loseButton = card.querySelector(".lose-life");
  // Keep keyboard focus usable when the focused minus button becomes disabled.
  if (eliminated && document.activeElement === loseButton) card.querySelector(".gain-life").focus();
  loseButton.disabled = eliminated;
  const hearts = document.createDocumentFragment();
  for (let life = 0; life < player.lives; life += 1) {
    const heart = document.createElement("span");
    heart.textContent = "♥";
    hearts.append(heart);
  }
  card.querySelector(".hearts").replaceChildren(hearts);
}

function updateMatchSummary() {
  const activeCount = players.filter(player => player.lives > 0).length;
  document.getElementById("summary-players").textContent = players.length;
  document.getElementById("summary-active").textContent = activeCount;
  document.querySelector(".stat-active .stat-unit").textContent = activeCount === 1 ? "ativo" : "ativos";
  document.getElementById("summary-lives").textContent = initialLives;
  document.getElementById("summary-lives-label").textContent = initialLives === 1 ? "vida inicial" : "vidas iniciais";
}

function updateLives(index, change) {
  const player = players[index];
  if (!player || (change !== -1 && change !== 1)) return;
  player.lives = Math.max(0, player.lives + change);
  renderPlayerLives(index);
  updateMatchSummary();
  announcer.textContent = `${player.name}: ${player.lives} ${player.lives === 1 ? "vida" : "vidas"}.${player.lives === 0 ? " Eliminado." : ""}`;
}

function resetGame() {
  players.forEach((player, index) => {
    player.lives = initialLives;
    renderPlayerLives(index);
  });
  updateMatchSummary();
  announcer.textContent = `Partida reiniciada. Todos voltaram a ${initialLives} ${initialLives === 1 ? "vida" : "vidas"}.`;
}

function newGame() {
  newGameDialog.close();
  players = [];
  scoreboard.replaceChildren();
  announcer.textContent = "";
  clearValidation();
  scoreScreen.hidden = true;
  setupScreen.hidden = false;
  document.getElementById("setup-title").focus();
}

playerCountInput.addEventListener("input", () => { clearValidation(); renderNameFields(); });
initialLivesInput.addEventListener("input", clearValidation);
setupForm.addEventListener("submit", startGame);
document.getElementById("reset-game").addEventListener("click", resetGame);
document.getElementById("new-game").addEventListener("click", () => newGameDialog.showModal());
document.getElementById("cancel-new-game").addEventListener("click", () => newGameDialog.close());
document.getElementById("confirm-new-game").addEventListener("click", newGame);
renderNameFields();
