const RARITY_ORDER = ["common", "rare", "epic", "legendary"];

const RARITY_CONFIG = {
  common: { foodSlots: 1, toySlots: 1, basePerClick: 1, hue: 25, chance: 0.62, houseBonus: 0.05 },
  rare: { foodSlots: 2, toySlots: 2, basePerClick: 2, hue: 190, chance: 0.25, houseBonus: 0.08 },
  epic: { foodSlots: 3, toySlots: 2, basePerClick: 4, hue: 280, chance: 0.1, houseBonus: 0.12 },
  legendary: { foodSlots: 4, toySlots: 3, basePerClick: 8, hue: 50, chance: 0.03, houseBonus: 0.18 },
};

const HOUSE_BASE = {
  common: { bubbleMultiplier: 1.15, woodCost: 70 },
  rare: { bubbleMultiplier: 1.3, woodCost: 125 },
  epic: { bubbleMultiplier: 1.5, woodCost: 200 },
  legendary: { bubbleMultiplier: 1.85, woodCost: 320 },
};

const FOOD_PER_LEVEL = 0.35;
const TOY_AUTO_PER_LEVEL = 0.35;
const MAX_AXOLOTTO = 6;

const state = {
  bubbles: 20,
  wood: 0,
  spriteMode: false,
  axolottos: [],
  houses: [],
};

const ui = {
  bubblesValue: document.getElementById("bubblesValue"),
  woodValue: document.getElementById("woodValue"),
  housesValue: document.getElementById("housesValue"),
  bpsValue: document.getElementById("bpsValue"),
  villageGrid: document.getElementById("villageGrid"),
  storeList: document.getElementById("storeList"),
  spriteToggle: document.getElementById("spriteToggle"),
  axolottoCardTemplate: document.getElementById("axolottoCardTemplate"),
  storeItemTemplate: document.getElementById("storeItemTemplate"),
};

function createAxolotto(rarity = "common") {
  const config = RARITY_CONFIG[rarity];
  return {
    id: crypto.randomUUID(),
    rarity,
    food: 0,
    toys: 0,
    autoProgress: 0,
    houseRarity: null,
    ...config,
  };
}

function getSpritePath(axolotto) {
  const folder = axolotto.rarity[0].toUpperCase() + axolotto.rarity.slice(1);
  return `Images/axolotls/${folder}/normal.png`;
}

function weightedRarityRoll() {
  let roll = Math.random();
  for (const rarity of RARITY_ORDER) {
    roll -= RARITY_CONFIG[rarity].chance;
    if (roll <= 0) return rarity;
  }
  return "common";
}

function bubblesPerClick(axolotto) {
  const foodBoost = 1 + Math.min(axolotto.food, axolotto.foodSlots) * FOOD_PER_LEVEL;
  const houseBoost = axolotto.houseRarity
    ? HOUSE_BASE[axolotto.houseRarity].bubbleMultiplier
    : 1;
  return axolotto.basePerClick * foodBoost * houseBoost;
}

function autoClicksPerSecond(axolotto) {
  return Math.min(axolotto.toys, axolotto.toySlots) * TOY_AUTO_PER_LEVEL;
}

function totalBubblesPerSecond() {
  return state.axolottos.reduce((sum, ax) => sum + autoClicksPerSecond(ax) * bubblesPerClick(ax), 0);
}

function totalHouseMultiplier() {
  return state.houses.reduce((sum, h) => sum + (HOUSE_BASE[h].bubbleMultiplier - 1), 0);
}

function renderResources() {
  ui.bubblesValue.textContent = state.bubbles.toFixed(1);
  ui.woodValue.textContent = state.wood.toFixed(1);
  ui.housesValue.textContent = `${state.houses.length} (+${(totalHouseMultiplier() * 100).toFixed(0)}%)`;
  ui.bpsValue.textContent = totalBubblesPerSecond().toFixed(1);
}

function drawFallbackAxolotto(ctx, axolotto) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = "#1a7ba8";
  ctx.fillRect(0, h - 34, w, 34);

  ctx.save();
  ctx.translate(w / 2, h / 2 + 8);
  const bodyColor = `hsl(${axolotto.hue} 85% 70%)`;
  ctx.fillStyle = bodyColor;

  ctx.beginPath();
  ctx.ellipse(0, 6, 56, 38, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(-43, -10, 16, 0, Math.PI * 2);
  ctx.arc(43, -10, 16, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < axolotto.foodSlots; i++) {
    ctx.fillStyle = "rgba(70,20,120,.35)";
    ctx.beginPath();
    ctx.arc(-24 + i * 16, 4 + (i % 2) * 7, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#151932";
  ctx.beginPath();
  ctx.arc(-19, -4, 5, 0, Math.PI * 2);
  ctx.arc(19, -4, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#151932";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 15, 12, 0.15, Math.PI - 0.15);
  ctx.stroke();

  ctx.restore();
}

function renderAxolottoCard(axolotto) {
  const node = ui.axolottoCardTemplate.content.firstElementChild.cloneNode(true);
  const canvas = node.querySelector(".ax-canvas");
  const name = node.querySelector(".ax-name");
  const rarity = node.querySelector(".ax-rarity");
  const stats = node.querySelector(".ax-stats");
  const clickBtn = node.querySelector(".click-btn");

  name.textContent = `Axolotto #${state.axolottos.indexOf(axolotto) + 1}`;
  rarity.textContent = `Rarity: ${axolotto.rarity} | Food slots ${axolotto.foodSlots} | Toy slots ${axolotto.toySlots}`;
  stats.textContent = `Food ${axolotto.food}/${axolotto.foodSlots}, Toys ${axolotto.toys}/${axolotto.toySlots}, Click +${bubblesPerClick(axolotto).toFixed(1)} bubbles`;

  const ctx = canvas.getContext("2d");
  if (state.spriteMode) {
    const image = new Image();
    image.onload = () => ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    image.onerror = () => drawFallbackAxolotto(ctx, axolotto);
    image.src = getSpritePath(axolotto);
  } else {
    drawFallbackAxolotto(ctx, axolotto);
  }

  clickBtn.addEventListener("click", () => {
    state.bubbles += bubblesPerClick(axolotto);
    renderAll();
  });

  return node;
}

function buyFood() {
  const target = state.axolottos.find((ax) => ax.food < ax.foodSlots);
  if (!target) return;
  const cost = 12 + target.food * 7;
  if (state.bubbles < cost) return;
  state.bubbles -= cost;
  target.food += 1;
}

function buyToy() {
  const target = state.axolottos.find((ax) => ax.toys < ax.toySlots);
  if (!target) return;
  const cost = 20 + target.toys * 12;
  if (state.bubbles < cost) return;
  state.bubbles -= cost;
  target.toys += 1;
}

function buyAxolotto() {
  if (state.axolottos.length >= MAX_AXOLOTTO) return;
  const rarity = weightedRarityRoll();
  const cost = 55 + state.axolottos.length * 38;
  if (state.bubbles < cost) return;
  state.bubbles -= cost;
  const ax = createAxolotto(rarity);
  if (state.houses.length) {
    ax.houseRarity = state.houses[state.houses.length - 1];
  }
  state.axolottos.push(ax);
}

function buyWood() {
  const cost = 8;
  if (state.bubbles < cost) return;
  state.bubbles -= cost;
  state.wood += 10;
}

function buyHouse(rarity) {
  const spec = HOUSE_BASE[rarity];
  if (state.wood < spec.woodCost) return;
  state.wood -= spec.woodCost;
  state.houses.push(rarity);
  const latest = state.houses[state.houses.length - 1];
  state.axolottos.forEach((ax) => {
    if (!ax.houseRarity || RARITY_ORDER.indexOf(latest) > RARITY_ORDER.indexOf(ax.houseRarity)) {
      ax.houseRarity = latest;
    }
  });
}

function renderStore() {
  const items = [
    {
      name: "Food",
      description: "Adds +35% click value to the first Axolotto with open food slots.",
      cost: () => {
        const target = state.axolottos.find((ax) => ax.food < ax.foodSlots);
        return target ? 12 + target.food * 7 : null;
      },
      onBuy: buyFood,
    },
    {
      name: "Toy",
      description: "Adds auto-click speed to the first Axolotto with open toy slots.",
      cost: () => {
        const target = state.axolottos.find((ax) => ax.toys < ax.toySlots);
        return target ? 20 + target.toys * 12 : null;
      },
      onBuy: buyToy,
    },
    {
      name: "Additional Axolotto",
      description: "Add another Axolotto to the village (up to 6) with weighted rarity roll.",
      cost: () => (state.axolottos.length >= MAX_AXOLOTTO ? null : 55 + state.axolottos.length * 38),
      onBuy: buyAxolotto,
    },
    {
      name: "Wood",
      description: "Buy construction wood. 10 wood per purchase.",
      cost: () => 8,
      onBuy: buyWood,
    },
    ...RARITY_ORDER.map((rarity) => ({
      name: `${rarity[0].toUpperCase() + rarity.slice(1)} House`,
      description: `Consumes wood to add a ${rarity} house that improves all Axolotto bubbles.`,
      cost: () => `${HOUSE_BASE[rarity].woodCost} wood`,
      disabled: () => state.wood < HOUSE_BASE[rarity].woodCost,
      onBuy: () => buyHouse(rarity),
    })),
  ];

  ui.storeList.innerHTML = "";

  items.forEach((item) => {
    const node = ui.storeItemTemplate.content.firstElementChild.cloneNode(true);
    const cost = item.cost();
    const disabled = item.disabled ? item.disabled() : cost === null || (typeof cost === "number" && state.bubbles < cost);

    node.querySelector(".item-name").textContent = item.name;
    node.querySelector(".item-description").textContent = item.description;

    const buyBtn = node.querySelector(".buy-btn");
    buyBtn.textContent = cost === null ? "Unavailable" : `Buy (${cost})`;
    buyBtn.disabled = disabled;
    buyBtn.addEventListener("click", () => {
      item.onBuy();
      renderAll();
    });

    ui.storeList.appendChild(node);
  });
}

function renderVillage() {
  ui.villageGrid.innerHTML = "";
  state.axolottos.forEach((axolotto) => {
    ui.villageGrid.appendChild(renderAxolottoCard(axolotto));
  });
}

function tick(deltaSeconds) {
  state.axolottos.forEach((ax) => {
    const gained = autoClicksPerSecond(ax) * bubblesPerClick(ax) * deltaSeconds;
    state.bubbles += gained;
  });
}

function renderAll() {
  renderResources();
  renderVillage();
  renderStore();
}

function start() {
  state.axolottos.push(createAxolotto("common"));

  ui.spriteToggle.addEventListener("change", (event) => {
    state.spriteMode = event.target.checked;
    renderVillage();
  });

  let previous = performance.now();
  setInterval(() => {
    const now = performance.now();
    const delta = (now - previous) / 1000;
    previous = now;
    tick(delta);
    renderResources();
  }, 100);

  renderAll();
}

start();
