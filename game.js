const RARITY_ORDER = ["common", "rare", "epic", "legendary", "reallyawesome"];

const RARITY_CONFIG = {
  common: { foodSlots: 5, toySlots: 2, basePerClick: 1, hue: 25, chance: 1, foodPerLevel: 0.3, toyAutoPerLevel: 0.25 },
  rare: { foodSlots: 7, toySlots: 3, basePerClick: 3, hue: 190, chance: 0, foodPerLevel: 0.45, toyAutoPerLevel: 0.45 },
  epic: { foodSlots: 9, toySlots: 4, basePerClick: 7, hue: 280, chance: 0, foodPerLevel: 0.6, toyAutoPerLevel: 0.7 },
  legendary: { foodSlots: 12, toySlots: 6, basePerClick: 15, hue: 50, chance: 0, foodPerLevel: 0.85, toyAutoPerLevel: 1.05 },
  reallyawesome: { foodSlots: 16, toySlots: 8, basePerClick: 28, hue: 330, chance: 0, foodPerLevel: 1.15, toyAutoPerLevel: 1.45 },
};

const FOOD_PER_LEVEL = 0.35;
const TOY_AUTO_PER_LEVEL = 0.35;
const STARTING_HOUSES = 1;
const SLOTS_PER_HOUSE = 6;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 1.8;
const SAVE_KEY = "jsax_village_save_v1";
const COLLECT_COOLDOWN_MS = 10000;

const AXOLOTL_IMAGES = {
  common: [
    "Images/axolotls/Common/normal.png",
    "Images/axolotls/Common/minecraft.png",
    "Images/axolotls/Common/ChatGPT Image Feb 1, 2026, 01_21_59 PM.png",
  ],
  rare: [
    "Images/axolotls/Rare/cookie.png",
    "Images/axolotls/Rare/gold.png",
    "Images/axolotls/Rare/ChatGPT Image Feb 1, 2026, 01_26_02 PM.png",
    "Images/axolotls/Rare/ChatGPT Image Mar 9, 2026, 01_58_32 PM.png",
    "Images/axolotls/Rare/ChatGPT Image Mar 9, 2026, 01_59_19 PM.png",
  ],
  epic: [
    "Images/axolotls/Epic/lavacute.png",
    "Images/axolotls/Epic/thief.png",
    "Images/axolotls/Epic/ChatGPT Image Feb 1, 2026, 01_18_38 PM.png",
    "Images/axolotls/Epic/ChatGPT Image Feb 1, 2026, 01_32_48 PM.png",
    "Images/axolotls/Epic/ChatGPT Image Feb 1, 2026, 01_44_14 PM.png",
  ],
  legendary: [
    "Images/axolotls/Legendary/diamond.png",
    "Images/axolotls/Legendary/lava.png",
    "Images/axolotls/Legendary/time.png",
    "Images/axolotls/Legendary/ChatGPT Image Feb 1, 2026, 01_28_51 PM.png",
    "Images/axolotls/Legendary/ChatGPT Image Feb 1, 2026, 01_47_02 PM.png",
  ],
  reallyawesome: [
    "Images/axolotls/ReallyAwesome/queen.png",
    "Images/axolotls/ReallyAwesome/king.png",
    "Images/axolotls/ReallyAwesome/ChatGPT Image Feb 1, 2026, 01_20_38 PM.png",
    "Images/axolotls/ReallyAwesome/ChatGPT Image Feb 1, 2026, 01_44_48 PM.png",
    "Images/axolotls/ReallyAwesome/ChatGPT Image Feb 1, 2026, 01_45_39 PM.png",
  ],
};

const RARITY_BASE_COST = {
  common: 90,
  rare: 240,
  epic: 620,
  legendary: 1650,
  reallyawesome: 4200,
};

const state = {
  bubbles: 0,
  wood: 0,
  spriteMode: true,
  axolottos: [],
  houses: STARTING_HOUSES,
  unlockedSlots: STARTING_HOUSES * SLOTS_PER_HOUSE,
  villages: Array.from({ length: STARTING_HOUSES }, () => ({ decorations: 0, mayor: 0, nextCollectAt: 0 })),
  zoom: 1,
};

const ui = {
  bubblesValue: document.getElementById("bubblesValue"),
  woodWrap: document.getElementById("woodResource"),
  woodValue: document.getElementById("woodValue"),
  housesWrap: document.getElementById("housesResource"),
  housesValue: document.getElementById("housesValue"),
  bpsValue: document.getElementById("bpsValue"),
  wpsValue: document.getElementById("wpsValue"),
  zoomInBtn: document.getElementById("zoomInBtn"),
  zoomOutBtn: document.getElementById("zoomOutBtn"),
  zoomValue: document.getElementById("zoomValue"),
  villageGrid: document.getElementById("villageGrid"),
  villageTitle: document.getElementById("villageTitle"),
  storeList: document.getElementById("storeList"),
  saveBtn: document.getElementById("saveBtn"),
  loadBtn: document.getElementById("loadBtn"),
  newGameBtn: document.getElementById("newGameBtn"),
  axolottoCardTemplate: document.getElementById("axolottoCardTemplate"),
  storeItemTemplate: document.getElementById("storeItemTemplate"),
  emptySlotTemplate: document.getElementById("emptySlotTemplate"),
  lockedSlotTemplate: document.getElementById("lockedSlotTemplate"),
};

function rarityLabel(rarity) {
  if (rarity === "reallyawesome") return "Really Awesome";
  return rarity[0].toUpperCase() + rarity.slice(1);
}

function randomRaritySprite(rarity) {
  const options = AXOLOTL_IMAGES[rarity] || AXOLOTL_IMAGES.common;
  return options[Math.floor(Math.random() * options.length)];
}

function createAxolotto(rarity = "common") {
  const config = RARITY_CONFIG[rarity];
  return {
    id: crypto.randomUUID(),
    rarity,
    food: 0,
    toys: 0,
    spritePath: randomRaritySprite(rarity),
    ...config,
  };
}

function rehydrateAxolotto(data) {
  const rarity = RARITY_CONFIG[data.rarity] ? data.rarity : "common";
  return {
    id: data.id || crypto.randomUUID(),
    rarity,
    food: Math.max(0, Number(data.food || 0)),
    toys: Math.max(0, Number(data.toys || 0)),
    spritePath: data.spritePath || randomRaritySprite(rarity),
    ...RARITY_CONFIG[rarity],
  };
}

function getSpritePath(axolotto) {
  return encodeURI(axolotto.spritePath || randomRaritySprite(axolotto.rarity));
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
  const foodBoost = 1 + Math.min(axolotto.food, axolotto.foodSlots) * axolotto.foodPerLevel;
  const houseBoost = 1 + (state.houses - 1) * 0.08;
  return axolotto.basePerClick * foodBoost * houseBoost;
}

function autoClicksPerSecond(axolotto) {
  return Math.min(axolotto.toys, axolotto.toySlots) * axolotto.toyAutoPerLevel;
}

function axolottoBps(axolotto) {
  return autoClicksPerSecond(axolotto) * bubblesPerClick(axolotto);
}

function totalBubblesPerSecond() {
  return state.axolottos.reduce((sum, ax) => sum + axolottoBps(ax), 0);
}

function decorationCost(villageIndex) {
  const village = state.villages[villageIndex];
  return 8 + villageIndex * 6 + village.decorations * 10;
}

function mayorCost(villageIndex) {
  const village = state.villages[villageIndex];
  return 20 + villageIndex * 10 + village.mayor * 18;
}

function woodPerVillageClick(villageIndex) {
  return 1 + state.villages[villageIndex].decorations;
}

function villageWoodPerSecond(villageIndex) {
  const village = state.villages[villageIndex];
  return village.mayor * woodPerVillageClick(villageIndex) * 0.4;
}

function totalWoodPerSecond() {
  return state.villages.reduce((sum, _v, index) => sum + villageWoodPerSecond(index), 0);
}

function totalFoodUpgrades() {
  return state.axolottos.reduce((sum, ax) => sum + ax.food, 0);
}

function totalToyUpgrades() {
  return state.axolottos.reduce((sum, ax) => sum + ax.toys, 0);
}

function foodCost() {
  return 10 + totalFoodUpgrades() * 2;
}

function toyCost() {
  return 14 + totalToyUpgrades() * 3;
}

function rarityOwnedCount(rarity) {
  return state.axolottos.filter((ax) => ax.rarity === rarity).length;
}

function axolottoCost(rarity) {
  const base = RARITY_BASE_COST[rarity] || RARITY_BASE_COST.common;
  return Math.floor(base * (1 + rarityOwnedCount(rarity) * 0.55));
}

function unlockSlotCost() {
  const purchasedSlots = state.unlockedSlots - STARTING_HOUSES * SLOTS_PER_HOUSE;
  return 16 + purchasedSlots * 12;
}

function nextHouseCost() {
  return 42 + (state.houses - 1) * 28;
}

function whole(value) {
  return Math.floor(value);
}

function applyZoom() {
  state.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, state.zoom));
  const cardMin = Math.max(90, Math.round(245 * state.zoom));
  ui.villageGrid.style.setProperty("--village-card-min", `${cardMin}px`);
  ui.zoomValue.textContent = `${Math.round(state.zoom * 100)}%`;
}

function renderResources() {
  ui.bubblesValue.textContent = `${whole(state.bubbles)}`;
  ui.woodValue.textContent = `${whole(state.wood)}`;
  ui.housesValue.textContent = `${state.houses}`;
  ui.bpsValue.textContent = `${whole(totalBubblesPerSecond())}`;
  ui.wpsValue.textContent = `${whole(totalWoodPerSecond())}`;

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
  ctx.fillStyle = `hsl(${axolotto.hue} 85% 70%)`;
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

function spawnBubbleGain(node, amount, label = "bubbles") {
  const gain = document.createElement("span");
  gain.className = "bubble-gain";
  gain.textContent = `+${amount.toFixed(1)} ${label}`;
  node.appendChild(gain);
  setTimeout(() => gain.remove(), 1000);
}

function drawImageContain(ctx, image) {
  const canvasRatio = ctx.canvas.width / ctx.canvas.height;
  const imageRatio = image.width / image.height;

  let drawWidth = ctx.canvas.width;
  let drawHeight = ctx.canvas.height;
  let offsetX = 0;
  let offsetY = 0;

  if (imageRatio > canvasRatio) {
    drawHeight = drawWidth / imageRatio;
    offsetY = (ctx.canvas.height - drawHeight) / 2;
  } else {
    drawWidth = drawHeight * imageRatio;
    offsetX = (ctx.canvas.width - drawWidth) / 2;
  }

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

function renderAxolottoCard(axolotto) {
  const node = ui.axolottoCardTemplate.content.firstElementChild.cloneNode(true);
  const canvas = node.querySelector(".ax-canvas");
  const rarity = node.querySelector(".ax-rarity");
  const stats = node.querySelector(".ax-stats");

  rarity.textContent = `Rarity: ${axolotto.rarity}`;
  stats.textContent = `Food ${axolotto.food}/${axolotto.foodSlots}, Toys ${axolotto.toys}/${axolotto.toySlots}, Click +${bubblesPerClick(axolotto).toFixed(1)} bubbles`;

  const ctx = canvas.getContext("2d");
  if (state.spriteMode) {
    const image = new Image();
    image.onload = () => drawImageContain(ctx, image);
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
  const cost = foodCost();
  if (!target || state.bubbles < cost) return;
  state.bubbles -= cost;
  target.food += 1;
}

function buyToy() {
  const target = state.axolottos.find((ax) => ax.toys < ax.toySlots);
  const cost = toyCost();
  if (!target || state.bubbles < cost) return;
  state.bubbles -= cost;
  target.toys += 1;
}

function buyAxolotto(rarity) {
  const cost = axolottoCost(rarity);
  if (state.axolottos.length >= state.unlockedSlots || state.bubbles < cost) return;
  state.bubbles -= cost;
  state.axolottos.push(createAxolotto(rarity));
}

function buyWood() {
  if (state.bubbles < 25) return;
  state.bubbles -= 25;
  state.wood += 1;
}

function upgradeDecorations(villageIndex) {
  const cost = decorationCost(villageIndex);
  if (state.wood < cost) return;
  state.wood -= cost;
  state.villages[villageIndex].decorations += 1;
}

function hireMayor(villageIndex) {
  const cost = mayorCost(villageIndex);
  if (state.wood < cost) return;
  state.wood -= cost;
  state.villages[villageIndex].mayor += 1;
}


function collectCooldownRemainingMs(villageIndex) {
  const now = Date.now();
  return Math.max(0, state.villages[villageIndex].nextCollectAt - now);
}

function collectButtonLabel(villageIndex) {
  const gain = woodPerVillageClick(villageIndex).toFixed(1);
  const remaining = collectCooldownRemainingMs(villageIndex);
  if (remaining <= 0) return `Collect Wood (+${gain})`;
  return `Collect in ${Math.ceil(remaining / 1000)}s (+${gain})`;
}

function collectVillageWood(villageIndex, node) {
  if (collectCooldownRemainingMs(villageIndex) > 0) return;
  const gain = woodPerVillageClick(villageIndex);
  state.wood += gain;
  state.villages[villageIndex].nextCollectAt = Date.now() + COLLECT_COOLDOWN_MS;
  spawnBubbleGain(node, gain, "wood");
  renderResources();
  renderStore();
  refreshVillagePanels();
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
  state.villages.push({ decorations: 0, mayor: 0, nextCollectAt: 0 });
}

function saveGame() {
  const payload = {
    bubbles: state.bubbles,
    wood: state.wood,
    houses: state.houses,
    unlockedSlots: state.unlockedSlots,
    zoom: state.zoom,
    villages: state.villages,
    axolottos: state.axolottos.map((ax) => ({ id: ax.id, rarity: ax.rarity, food: ax.food, toys: ax.toys, spritePath: ax.spritePath })),
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return;
  const data = JSON.parse(raw);

  state.bubbles = Math.max(0, Number(data.bubbles || 0));
  state.wood = Math.max(0, Number(data.wood || 0));
  state.houses = Math.max(STARTING_HOUSES, Number(data.houses || STARTING_HOUSES));
  state.unlockedSlots = Math.max(SLOTS_PER_HOUSE, Number(data.unlockedSlots || SLOTS_PER_HOUSE));
  state.zoom = Number(data.zoom || 1);

  const villages = Array.isArray(data.villages) ? data.villages : [];
  state.villages = Array.from({ length: state.houses }, (_v, i) => ({
    decorations: Math.max(0, Number(villages[i]?.decorations || 0)),
    mayor: Math.max(0, Number(villages[i]?.mayor || 0)),
    nextCollectAt: Math.max(0, Number(villages[i]?.nextCollectAt || 0)),
  }));

  const loadedAx = Array.isArray(data.axolottos) ? data.axolottos.map(rehydrateAxolotto) : [];
  state.axolottos = loadedAx.slice(0, state.unlockedSlots);
}

function resetGameState() {
  state.bubbles = 0;
  state.wood = 0;
  state.axolottos = [createAxolotto("common")];
  state.houses = STARTING_HOUSES;
  state.unlockedSlots = STARTING_HOUSES * SLOTS_PER_HOUSE;
  state.villages = Array.from({ length: STARTING_HOUSES }, () => ({ decorations: 0, mayor: 0, nextCollectAt: 0 }));
  state.zoom = 1;
}

function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}

function renderStore() {
  const items = [
    {
      name: "Food",
      description: "Raise click value; each purchase costs more than the last.",
      cost: () => (state.axolottos.some((ax) => ax.food < ax.foodSlots) ? `${foodCost()} bubbles` : null),
      onBuy: buyFood,
    },
    {
      name: "Toy",
      description: "Raise auto-click speed; each purchase costs more than the last.",
      cost: () => (state.axolottos.some((ax) => ax.toys < ax.toySlots) ? `${toyCost()} bubbles` : null),
      onBuy: buyToy,
    },
    ...RARITY_ORDER.map((rarity) => ({
      name: `Purchase ${rarityLabel(rarity)} Axolotto`,
      description: `Buy a ${rarity} axolotto with rarity-scaled stats and cost.` ,
      cost: () => (state.axolottos.length >= state.unlockedSlots ? null : `${axolottoCost(rarity)} bubbles`),
      onBuy: () => buyAxolotto(rarity),
    })),
    {
      name: "1 Wood",
      description: "Buy one wood resource directly.",
      cost: () => "25 bubbles",
      onBuy: buyWood,
    },
    {
      name: "New House",
      description: "Adds a new village with 6 more slots and its own upgrades.",
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
    const village = state.villages[houseIndex];
    const villageNode = document.createElement("section");
    villageNode.className = "village-block";
    villageNode.dataset.villageIndex = String(houseIndex);

    const heading = document.createElement("h3");
    heading.className = "village-block-title";
    heading.textContent = `Village ${houseIndex + 1} • ${villageBps(houseIndex).toFixed(1)} bubbles/s • ${villageWoodPerSecond(houseIndex).toFixed(1)} wood/s`;
    villageNode.appendChild(heading);

    const villageControls = document.createElement("div");
    villageControls.className = "village-controls";

    const collectBtn = document.createElement("button");
    collectBtn.className = "collect-wood-btn";
    collectBtn.textContent = collectButtonLabel(houseIndex);
    collectBtn.disabled = collectCooldownRemainingMs(houseIndex) > 0;
    collectBtn.addEventListener("click", () => collectVillageWood(houseIndex, villageControls));

    const decorationsBtn = document.createElement("button");
    decorationsBtn.className = "decorations-btn";
    decorationsBtn.textContent = `Decorations Lv ${village.decorations} (${decorationCost(houseIndex)} wood)`;
    decorationsBtn.disabled = state.wood < decorationCost(houseIndex);
    decorationsBtn.addEventListener("click", () => {
      upgradeDecorations(houseIndex);
      renderAll();
    });

    const mayorBtn = document.createElement("button");
    mayorBtn.className = "mayor-btn";
    mayorBtn.textContent = `Mayor Lv ${village.mayor} (${mayorCost(houseIndex)} wood)`;
    mayorBtn.disabled = state.wood < mayorCost(houseIndex);
    mayorBtn.addEventListener("click", () => {
      hireMayor(houseIndex);
      renderAll();
    });

    const helper = document.createElement("p");
    helper.className = "village-helper";
    helper.textContent = `Decorations increase wood per click (+1 each level). Mayor auto-collects wood every second based on your current wood per click. Manual collect is available every 10 seconds.`;

    villageControls.append(collectBtn, decorationsBtn, mayorBtn);
    villageNode.append(villageControls, helper);

    const slotsGrid = document.createElement("div");
    slotsGrid.className = "village-slots";

    for (let localSlot = 0; localSlot < SLOTS_PER_HOUSE; localSlot += 1) {
      const slotIndex = houseIndex * SLOTS_PER_HOUSE + localSlot;
      if (slotIndex < state.unlockedSlots) {
        const axolotto = state.axolottos[slotIndex];
        slotsGrid.appendChild(axolotto ? renderAxolottoCard(axolotto) : ui.emptySlotTemplate.content.firstElementChild.cloneNode(true));
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

    villageNode.appendChild(slotsGrid);
    ui.villageGrid.appendChild(villageNode);
  }
}

function refreshVillagePanels() {
  state.villages.forEach((village, houseIndex) => {
    const villageNode = ui.villageGrid.querySelector(`[data-village-index="${houseIndex}"]`);
    if (!villageNode) return;

    villageNode.querySelector(".village-block-title").textContent = `Village ${houseIndex + 1} • ${villageBps(houseIndex).toFixed(1)} bubbles/s • ${villageWoodPerSecond(houseIndex).toFixed(1)} wood/s`;
    const collectBtn = villageNode.querySelector(".collect-wood-btn");
    collectBtn.textContent = collectButtonLabel(houseIndex);
    collectBtn.disabled = collectCooldownRemainingMs(houseIndex) > 0;

    const decorationsBtn = villageNode.querySelector(".decorations-btn");
    decorationsBtn.textContent = `Decorations Lv ${village.decorations} (${decorationCost(houseIndex)} wood)`;
    decorationsBtn.disabled = state.wood < decorationCost(houseIndex);

    const mayorBtn = villageNode.querySelector(".mayor-btn");
    mayorBtn.textContent = `Mayor Lv ${village.mayor} (${mayorCost(houseIndex)} wood)`;
    mayorBtn.disabled = state.wood < mayorCost(houseIndex);
  });

  ui.villageGrid.querySelectorAll(".unlock-slot-btn").forEach((btn) => {
    const cost = unlockSlotCost();
    btn.textContent = `Unlock for ${cost} wood`;
    btn.disabled = state.wood < cost;
  });
}

function tick(deltaSeconds) {
  state.axolottos.forEach((ax) => {
    state.bubbles += axolottoBps(ax) * deltaSeconds;
  });
  state.villages.forEach((_v, index) => {
    state.wood += villageWoodPerSecond(index) * deltaSeconds;
  });
}

function renderAll() {
  renderResources();
  renderVillage();
  renderStore();
}

function start() {
  if (localStorage.getItem(SAVE_KEY)) {
    loadGame();
  }

  if (!state.axolottos.length) {
    state.axolottos.push(createAxolotto("common"));
  }

  ui.zoomOutBtn.addEventListener("click", () => {
    state.zoom = Math.max(MIN_ZOOM, state.zoom - 0.1);
    applyZoom();
  });
  ui.zoomInBtn.addEventListener("click", () => {
    state.zoom = Math.min(MAX_ZOOM, state.zoom + 0.1);
    applyZoom();
  });

  ui.saveBtn.addEventListener("click", () => saveGame());
  ui.loadBtn.addEventListener("click", () => {
    loadGame();
    renderAll();
  });
  ui.newGameBtn.addEventListener("click", () => {
    if (!window.confirm("Start a new game? Your saved progress will be overwritten.")) return;
    clearSave();
    resetGameState();
    saveGame();
    renderAll();
  });

  let previous = performance.now();
  let sinceStoreRefresh = 0;

  setInterval(() => {
    saveGame();
  }, 10000);

  setInterval(() => {
    const now = performance.now();
    const delta = (now - previous) / 1000;
    previous = now;
    tick(delta);
    renderResources();
    refreshVillagePanels();

    sinceStoreRefresh += delta;
    if (sinceStoreRefresh >= 0.5) {
      renderStore();
      sinceStoreRefresh = 0;
    }
  }, 100);

  renderAll();
}

start();
