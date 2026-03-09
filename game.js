const RARITY_ORDER = ["common", "rare", "epic", "legendary"];

const RARITY_CONFIG = {
  common: { foodSlots: 5, toySlots: 2, basePerClick: 1, hue: 25, chance: 1 },
  rare: { foodSlots: 2, toySlots: 2, basePerClick: 2, hue: 190, chance: 0 },
  epic: { foodSlots: 3, toySlots: 2, basePerClick: 4, hue: 280, chance: 0 },
  legendary: { foodSlots: 4, toySlots: 3, basePerClick: 8, hue: 50, chance: 0 },
};

const FOOD_PER_LEVEL = 0.35;
const TOY_AUTO_PER_LEVEL = 0.35;
const STARTING_HOUSES = 1;
const SLOTS_PER_HOUSE = 6;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 1.8;

const state = {
  bubbles: 0,
  wood: 0,
  spriteMode: true,
  axolottos: [],
  houses: STARTING_HOUSES,
  unlockedSlots: STARTING_HOUSES * SLOTS_PER_HOUSE,
  villages: Array.from({ length: STARTING_HOUSES }, () => ({ clickUnlocked: false, decorations: 0, mayor: 0 })),
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

function villageUnlockCost(villageIndex) {
  return 4 + villageIndex * 7;
}

function decorationCost(villageIndex) {
  const village = state.villages[villageIndex];
  return 6 + villageIndex * 4 + village.decorations * 6;
}

function mayorCost(villageIndex) {
  const village = state.villages[villageIndex];
  return 16 + villageIndex * 8 + village.mayor * 14;
}

function woodPerVillageClick(villageIndex) {
  const village = state.villages[villageIndex];
  return village.clickUnlocked ? 1 + village.decorations : 0;
}

function villageWoodPerSecond(villageIndex) {
  const village = state.villages[villageIndex];
  if (!village.clickUnlocked) return 0;
  return village.mayor * woodPerVillageClick(villageIndex) * 0.5;
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

function axolottoCost() {
  return (18 + state.axolottos.length * 6) * 5;
}

function unlockSlotCost() {
  const purchasedSlots = state.unlockedSlots - STARTING_HOUSES * SLOTS_PER_HOUSE;
  return 12 + purchasedSlots * 10;
}

function nextHouseCost() {
  return 30 + (state.houses - 1) * 22;
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

function spawnBubbleGain(node, amount, label = "bubbles") {
  const gain = document.createElement("span");
  gain.className = "bubble-gain";
  gain.textContent = `+${amount.toFixed(1)} ${label}`;
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

function buyAxolotto() {
  const cost = axolottoCost();
  if (state.axolottos.length >= state.unlockedSlots || state.bubbles < cost) return;
  const rarity = weightedRarityRoll();
  state.bubbles -= cost;
  state.axolottos.push(createAxolotto(rarity));
}

function buyWood() {
  if (state.bubbles < 20) return;
  state.bubbles -= 20;
  state.wood += 1;
}

function unlockVillageClick(villageIndex) {
  const cost = villageUnlockCost(villageIndex);
  if (state.wood < cost) return;
  state.wood -= cost;
  state.villages[villageIndex].clickUnlocked = true;
}

function upgradeDecorations(villageIndex) {
  const cost = decorationCost(villageIndex);
  if (state.wood < cost || !state.villages[villageIndex].clickUnlocked) return;
  state.wood -= cost;
  state.villages[villageIndex].decorations += 1;
}

function hireMayor(villageIndex) {
  const cost = mayorCost(villageIndex);
  if (state.wood < cost || !state.villages[villageIndex].clickUnlocked) return;
  state.wood -= cost;
  state.villages[villageIndex].mayor += 1;
}

function collectVillageWood(villageIndex, node) {
  const gain = woodPerVillageClick(villageIndex);
  if (gain <= 0) return;
  state.wood += gain;
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
  state.villages.push({ clickUnlocked: false, decorations: 0, mayor: 0 });
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
    {
      name: "Additional Axolotto",
      description: "Costs more each time and fills the next unlocked slot.",
      cost: () => (state.axolottos.length >= state.unlockedSlots ? null : `${axolottoCost()} bubbles`),
      onBuy: buyAxolotto,
    },
    {
      name: "1 Wood",
      description: "Buy one wood resource directly.",
      cost: () => "20 bubbles",
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
    heading.textContent = `Village ${houseIndex + 1} • ${whole(villageBps(houseIndex))} bubbles/s • ${whole(villageWoodPerSecond(houseIndex))} wood/s`;
    villageNode.appendChild(heading);

    const villageControls = document.createElement("div");
    villageControls.className = "village-controls";

    const icon = document.createElement("img");
    icon.className = "village-icon";
    icon.src = "Images/houses/Common/1.png";
    icon.alt = "Village house";
    villageControls.appendChild(icon);

    const collectBtn = document.createElement("button");
    collectBtn.className = "collect-wood-btn";
    collectBtn.textContent = village.clickUnlocked
      ? `Collect Wood (+${woodPerVillageClick(houseIndex).toFixed(1)})`
      : `Unlock Collect (${villageUnlockCost(houseIndex)} wood)`;
    collectBtn.disabled = village.clickUnlocked ? false : state.wood < villageUnlockCost(houseIndex);
    collectBtn.addEventListener("click", () => {
      if (village.clickUnlocked) {
        collectVillageWood(houseIndex, villageControls);
      } else {
        unlockVillageClick(houseIndex);
        renderAll();
      }
    });

    const decorationsBtn = document.createElement("button");
    decorationsBtn.className = "decorations-btn";
    decorationsBtn.textContent = `Decorations Lv ${village.decorations} (${decorationCost(houseIndex)} wood)`;
    decorationsBtn.disabled = !village.clickUnlocked || state.wood < decorationCost(houseIndex);
    decorationsBtn.addEventListener("click", () => {
      upgradeDecorations(houseIndex);
      renderAll();
    });

    const mayorBtn = document.createElement("button");
    mayorBtn.className = "mayor-btn";
    mayorBtn.textContent = `Mayor Lv ${village.mayor} (${mayorCost(houseIndex)} wood)`;
    mayorBtn.disabled = !village.clickUnlocked || state.wood < mayorCost(houseIndex);
    mayorBtn.addEventListener("click", () => {
      hireMayor(houseIndex);
      renderAll();
    });

    villageControls.append(collectBtn, decorationsBtn, mayorBtn);
    villageNode.appendChild(villageControls);

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

    villageNode.appendChild(slotsGrid);
    ui.villageGrid.appendChild(villageNode);
  }
}


function refreshVillagePanels() {
  state.villages.forEach((village, houseIndex) => {
    const villageNode = ui.villageGrid.querySelector(`[data-village-index="${houseIndex}"]`);
    if (!villageNode) return;

    const heading = villageNode.querySelector('.village-block-title');
    if (heading) {
      heading.textContent = `Village ${houseIndex + 1} • ${whole(villageBps(houseIndex))} bubbles/s • ${whole(villageWoodPerSecond(houseIndex))} wood/s`;
    }

    const collectBtn = villageNode.querySelector('.collect-wood-btn');
    if (collectBtn) {
      collectBtn.textContent = village.clickUnlocked
        ? `Collect Wood (+${woodPerVillageClick(houseIndex).toFixed(1)})`
        : `Unlock Collect (${villageUnlockCost(houseIndex)} wood)`;
      collectBtn.disabled = village.clickUnlocked ? false : state.wood < villageUnlockCost(houseIndex);
    }

    const decorationsBtn = villageNode.querySelector('.decorations-btn');
    if (decorationsBtn) {
      decorationsBtn.textContent = `Decorations Lv ${village.decorations} (${decorationCost(houseIndex)} wood)`;
      decorationsBtn.disabled = !village.clickUnlocked || state.wood < decorationCost(houseIndex);
    }

    const mayorBtn = villageNode.querySelector('.mayor-btn');
    if (mayorBtn) {
      mayorBtn.textContent = `Mayor Lv ${village.mayor} (${mayorCost(houseIndex)} wood)`;
      mayorBtn.disabled = !village.clickUnlocked || state.wood < mayorCost(houseIndex);
    }
  });

  ui.villageGrid.querySelectorAll('.unlock-slot-btn').forEach((btn) => {
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
  state.axolottos.push(createAxolotto("common"));

  ui.zoomOutBtn.addEventListener("click", () => {
    state.zoom = Math.max(MIN_ZOOM, state.zoom - 0.1);
    applyZoom();
  });

  ui.zoomInBtn.addEventListener("click", () => {
    state.zoom = Math.min(MAX_ZOOM, state.zoom + 0.1);
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
