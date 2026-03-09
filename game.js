const RARITY_ORDER = ["common", "rare", "epic", "legendary"];

const RARITY_CONFIG = {
  common: { foodSlots: 5, toySlots: 2, basePerClick: 1, hue: 25, chance: 1, houseBonus: 0.05 },
  rare: { foodSlots: 2, toySlots: 2, basePerClick: 2, hue: 190, chance: 0, houseBonus: 0.08 },
  epic: { foodSlots: 3, toySlots: 2, basePerClick: 4, hue: 280, chance: 0, houseBonus: 0.12 },
  legendary: { foodSlots: 4, toySlots: 3, basePerClick: 8, hue: 50, chance: 0, houseBonus: 0.18 },
};

const FOOD_PER_LEVEL = 0.35;
const TOY_AUTO_PER_LEVEL = 0.35;
const STARTING_HOUSES = 1;
const SLOTS_PER_HOUSE = 6;

const state = {
  bubbles: 0,
  wood: 0,
  spriteMode: true,
  axolottos: [],
  houses: STARTING_HOUSES,
  unlockedSlots: STARTING_HOUSES * SLOTS_PER_HOUSE,
  zoom: 1,
};

const ui = {
  bubblesValue: document.getElementById("bubblesValue"),
  woodWrap: document.getElementById("woodResource"),
  woodValue: document.getElementById("woodValue"),
  housesWrap: document.getElementById("housesResource"),
  housesValue: document.getElementById("housesValue"),
  bpsValue: document.getElementById("bpsValue"),
  zoomInBtn: document.getElementById("zoomInBtn"),
  zoomOutBtn: document.getElementById("zoomOutBtn"),
  zoomValue: document.getElementById("zoomValue"),
  villageGrid: document.getElementById("villageGrid"),
  villageTitle: document.getElementById("villageTitle"),
  storeList: document.getElementById("storeList"),
  axolottoCardTemplate: document.getElementById("axolottoCardTemplate"),
  storeItemTemplate: document.getElementById("storeItemTemplate"),
  emptySlotTemplate: document.getElementById("emptySlotTemplate"),
  lockedSlotTemplate: document.getElementById("lockedSlotTemplate"),
};

function createAxolotto(rarity = "common") {
  const config = RARITY_CONFIG[rarity];
  return {
    id: crypto.randomUUID(),
    rarity,
    food: 0,
    toys: 0,
    autoProgress: 0,
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
  const houseBoost = 1 + (state.houses - 1) * 0.08;
  return axolotto.basePerClick * foodBoost * houseBoost;
}

function autoClicksPerSecond(axolotto) {
  return Math.min(axolotto.toys, axolotto.toySlots) * TOY_AUTO_PER_LEVEL;
}

function axolottoBps(axolotto) {
  return autoClicksPerSecond(axolotto) * bubblesPerClick(axolotto);
}

function totalBubblesPerSecond() {
  return state.axolottos.reduce((sum, ax) => sum + axolottoBps(ax), 0);
}

function unlockSlotCost() {
  const purchasedSlots = state.unlockedSlots - STARTING_HOUSES * SLOTS_PER_HOUSE;
  return 30 + purchasedSlots * 20;
}

function nextHouseCost() {
  return 120 + (state.houses - 1) * 90;
}

function applyZoom() {
  const zoom = Math.max(0.6, Math.min(1.8, state.zoom));
  const cardMin = Math.round(245 * zoom);
  ui.villageGrid.style.setProperty("--village-card-min", `${cardMin}px`);
  ui.zoomValue.textContent = `${Math.round(zoom * 100)}%`;
}

function renderResources() {
  ui.bubblesValue.textContent = state.bubbles.toFixed(1);
  ui.woodValue.textContent = state.wood.toFixed(1);
  ui.housesValue.textContent = `${state.houses}`;
  ui.bpsValue.textContent = totalBubblesPerSecond().toFixed(1);

  ui.woodWrap.hidden = state.wood <= 0;
  ui.housesWrap.hidden = state.houses <= 1;
  ui.villageTitle.textContent = `Village Space (${state.unlockedSlots}/${state.houses * SLOTS_PER_HOUSE} slots unlocked)`;
  applyZoom();
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

function spawnBubbleGain(node, amount) {
  const gain = document.createElement("span");
  gain.className = "bubble-gain";
  gain.textContent = `+${amount.toFixed(1)} bubbles`;
  node.appendChild(gain);
  setTimeout(() => gain.remove(), 1000);
}

function renderAxolottoCard(axolotto) {
  const node = ui.axolottoCardTemplate.content.firstElementChild.cloneNode(true);
  const canvas = node.querySelector(".ax-canvas");
  const name = node.querySelector(".ax-name");
  const rarity = node.querySelector(".ax-rarity");
  const stats = node.querySelector(".ax-stats");

  name.textContent = `Axolotto #${state.axolottos.indexOf(axolotto) + 1}`;
  rarity.textContent = `Rarity: ${axolotto.rarity}`;
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

  node.addEventListener("click", () => {
    const gained = bubblesPerClick(axolotto);
    state.bubbles += gained;
    spawnBubbleGain(node, gained);
    renderResources();
    renderStore();
  });

  return node;
}

function buyFood() {
  const target = state.axolottos.find((ax) => ax.food < ax.foodSlots);
  if (!target || state.bubbles < 12) return;
  state.bubbles -= 12;
  target.food += 1;
}

function buyToy() {
  const target = state.axolottos.find((ax) => ax.toys < ax.toySlots);
  if (!target || state.bubbles < 12) return;
  state.bubbles -= 12;
  target.toys += 1;
}

function buyAxolotto() {
  if (state.axolottos.length >= state.unlockedSlots || state.bubbles < 12) return;
  const rarity = weightedRarityRoll();
  state.bubbles -= 12;
  state.axolottos.push(createAxolotto(rarity));
}

function buyWood() {
  if (state.bubbles < 20) return;
  state.bubbles -= 20;
  state.wood += 1;
}

function unlockSlot() {
  if (state.unlockedSlots >= state.houses * SLOTS_PER_HOUSE) return;
  const cost = unlockSlotCost();
  if (state.wood < cost) return;
  state.wood -= cost;
  state.unlockedSlots += 1;
}

function buyHouse() {
  const cost = nextHouseCost();
  if (state.wood < cost) return;
  state.wood -= cost;
  state.houses += 1;
}

function renderStore() {
  const items = [
    {
      name: "Food",
      description: "Adds +35% click value to the first Axolotto with open food slots.",
      cost: () => (state.axolottos.some((ax) => ax.food < ax.foodSlots) ? "12 bubbles" : null),
      onBuy: buyFood,
    },
    {
      name: "Toy",
      description: "Adds auto-click speed to the first Axolotto with open toy slots.",
      cost: () => (state.axolottos.some((ax) => ax.toys < ax.toySlots) ? "12 bubbles" : null),
      onBuy: buyToy,
    },
    {
      name: "Additional Axolotto",
      description: "Adds a new axolotto into any unlocked empty village slot.",
      cost: () => (state.axolottos.length >= state.unlockedSlots ? null : "12 bubbles"),
      onBuy: buyAxolotto,
    },
    {
      name: "1 Wood",
      description: "Buy one piece of wood for slot unlocks and village expansion.",
      cost: () => "20 bubbles",
      onBuy: buyWood,
    },
    {
      name: "New House",
      description: "Adds 6 new empty village slots that can be unlocked with wood.",
      cost: () => `${nextHouseCost()} wood`,
      disabled: () => state.wood < nextHouseCost(),
      onBuy: buyHouse,
    },
  ];

  ui.storeList.innerHTML = "";

  items.forEach((item) => {
    const node = ui.storeItemTemplate.content.firstElementChild.cloneNode(true);
    const cost = item.cost();
    const disabled = item.disabled
      ? item.disabled()
      : cost === null || (typeof cost === "string" && cost.includes("bubbles") && state.bubbles < Number.parseInt(cost, 10));

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

function villageBps(houseIndex) {
  const start = houseIndex * SLOTS_PER_HOUSE;
  const end = start + SLOTS_PER_HOUSE;
  return state.axolottos.slice(start, end).reduce((sum, ax) => sum + axolottoBps(ax), 0);
}

function renderVillage() {
  ui.villageGrid.innerHTML = "";

  for (let houseIndex = 0; houseIndex < state.houses; houseIndex += 1) {
    const village = document.createElement("section");
    village.className = "village-block";

    const heading = document.createElement("h3");
    heading.className = "village-block-title";
    heading.textContent = `Village ${houseIndex + 1} • ${villageBps(houseIndex).toFixed(1)} bubbles/s`;
    village.appendChild(heading);

    const slotsGrid = document.createElement("div");
    slotsGrid.className = "village-slots";

    for (let localSlot = 0; localSlot < SLOTS_PER_HOUSE; localSlot += 1) {
      const slotIndex = houseIndex * SLOTS_PER_HOUSE + localSlot;
      if (slotIndex < state.unlockedSlots) {
        const axolotto = state.axolottos[slotIndex];
        if (axolotto) {
          slotsGrid.appendChild(renderAxolottoCard(axolotto));
        } else {
          const emptyNode = ui.emptySlotTemplate.content.firstElementChild.cloneNode(true);
          slotsGrid.appendChild(emptyNode);
        }
      } else {
        const lockedNode = ui.lockedSlotTemplate.content.firstElementChild.cloneNode(true);
        const button = lockedNode.querySelector(".unlock-slot-btn");
        const cost = unlockSlotCost();
        button.textContent = `Unlock for ${cost} wood`;
        button.disabled = state.wood < cost;
        button.addEventListener("click", () => {
          unlockSlot();
          renderAll();
        });
        slotsGrid.appendChild(lockedNode);
      }
    }

    village.appendChild(slotsGrid);
    ui.villageGrid.appendChild(village);
  }
}

function tick(deltaSeconds) {
  state.axolottos.forEach((ax) => {
    const gained = axolottoBps(ax) * deltaSeconds;
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

  ui.zoomOutBtn.addEventListener("click", () => {
    state.zoom = Math.max(0.6, state.zoom - 0.1);
    applyZoom();
  });

  ui.zoomInBtn.addEventListener("click", () => {
    state.zoom = Math.min(1.8, state.zoom + 0.1);
    applyZoom();
  });

  let previous = performance.now();
  let sinceStoreRefresh = 0;

  setInterval(() => {
    const now = performance.now();
    const delta = (now - previous) / 1000;
    previous = now;
    tick(delta);
    renderResources();

    sinceStoreRefresh += delta;
    if (sinceStoreRefresh >= 0.5) {
      renderStore();
      sinceStoreRefresh = 0;
    }
  }, 100);

  renderAll();
}

start();
