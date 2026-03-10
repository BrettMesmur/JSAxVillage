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
  common: 130,
  rare: 900,
  epic: 5200,
  legendary: 36000,
  reallyawesome: 240000,
};

const RARITY_COST_GROWTH = {
  common: 1.24,
  rare: 1.28,
  epic: 1.33,
  legendary: 1.38,
  reallyawesome: 1.45,
};

const FOOD_BASE_COST = 14;
const FOOD_COST_GROWTH = 1.115;
const TOY_BASE_COST = 24;
const TOY_COST_GROWTH = 1.12;
const WOOD_BASE_COST = 30;
const WOOD_COST_GROWTH = 1.09;

const RARITY_UNLOCK_REQUIREMENTS = {
  common: {},
  rare: { common: 3 },
  epic: { common: 4, rare: 3 },
  legendary: { common: 5, rare: 4, epic: 3 },
  reallyawesome: { common: 6, rare: 5, epic: 4, legendary: 3 },
};

const BULK_AMOUNTS = [1, 10, 100];

function normalizeBigParts(mantissa, exponent) {
  if (!Number.isFinite(mantissa) || mantissa <= 0) return { m: 0, e: 0 };
  let m = mantissa;
  let e = exponent;
  while (m >= 10) {
    m /= 10;
    e += 1;
  }
  while (m < 1) {
    m *= 10;
    e -= 1;
  }
  return { m, e };
}

function toBig(value) {
  if (typeof value === "object" && value && typeof value.m === "number" && typeof value.e === "number") {
    return normalizeBigParts(value.m, value.e);
  }
  const num = Number(value) || 0;
  if (num <= 0 || !Number.isFinite(num)) return { m: 0, e: 0 };
  const exponent = Math.floor(Math.log10(num));
  return normalizeBigParts(num / 10 ** exponent, exponent);
}

function bigCmp(a, b) {
  const left = toBig(a);
  const right = toBig(b);
  if (left.m === 0 && right.m === 0) return 0;
  if (left.e !== right.e) return left.e > right.e ? 1 : -1;
  if (Math.abs(left.m - right.m) < 1e-12) return 0;
  return left.m > right.m ? 1 : -1;
}

function bigAdd(a, b) {
  const left = toBig(a);
  const right = toBig(b);
  if (left.m === 0) return right;
  if (right.m === 0) return left;
  if (left.e - right.e > 15) return left;
  if (right.e - left.e > 15) return right;

  if (left.e >= right.e) {
    const scaled = right.m * 10 ** (right.e - left.e);
    return normalizeBigParts(left.m + scaled, left.e);
  }
  const scaled = left.m * 10 ** (left.e - right.e);
  return normalizeBigParts(right.m + scaled, right.e);
}

function bigSub(a, b) {
  if (bigCmp(a, b) < 0) return { m: 0, e: 0 };
  const left = toBig(a);
  const right = toBig(b);
  if (right.m === 0) return left;
  if (left.e - right.e > 15) return left;

  const scaled = right.m * 10 ** (right.e - left.e);
  return normalizeBigParts(left.m - scaled, left.e);
}

function bigMul(a, factor) {
  const left = toBig(a);
  if (left.m === 0 || factor === 0) return { m: 0, e: 0 };
  return normalizeBigParts(left.m * factor, left.e);
}

function formatBig(value, decimals = 1) {
  const big = toBig(value);
  if (big.m === 0) return "0";

  const suffixes = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
  const group = Math.floor(big.e / 3);

  if (group <= 0) {
    return Math.floor(big.m * 10 ** big.e).toLocaleString();
  }

  if (group < suffixes.length) {
    const adjusted = big.m * 10 ** (big.e - group * 3);
    const rounded = adjusted.toFixed(decimals).replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
    return `${rounded}${suffixes[group]}`;
  }

  return `${big.m.toFixed(2)}e${big.e}`;
}

function canAfford(resource, cost) {
  return bigCmp(resource, cost) >= 0;
}

const state = {
  bubbles: toBig(0),
  wood: toBig(0),
  spriteMode: true,
  axolottos: [],
  houses: STARTING_HOUSES,
  unlockedSlots: STARTING_HOUSES * SLOTS_PER_HOUSE,
  villages: Array.from({ length: STARTING_HOUSES }, () => ({ decorations: 0, mayor: 0, nextCollectAt: 0 })),
  zoom: 1,
  woodPurchases: 0,
  storeBulkSelection: { food: 1, toy: 1, wood: 1 },
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
  const base = 12 + villageIndex * 8;
  return toBig(base * 1.18 ** village.decorations);
}

function mayorCost(villageIndex) {
  const village = state.villages[villageIndex];
  const base = 30 + villageIndex * 12;
  return toBig(base * 1.2 ** village.mayor);
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
  return toBig(FOOD_BASE_COST * FOOD_COST_GROWTH ** totalFoodUpgrades());
}

function toyCost() {
  return toBig(TOY_BASE_COST * TOY_COST_GROWTH ** totalToyUpgrades());
}

function rarityOwnedCount(rarity) {
  return state.axolottos.filter((ax) => ax.rarity === rarity).length;
}

function axolottoCost(rarity) {
  const base = RARITY_BASE_COST[rarity] || RARITY_BASE_COST.common;
  const rarityGrowth = RARITY_COST_GROWTH[rarity] || RARITY_COST_GROWTH.common;
  const ownedGrowth = rarityGrowth ** rarityOwnedCount(rarity);
  const globalGrowth = 1.015 ** state.axolottos.length;
  return toBig(base * ownedGrowth * globalGrowth);
}

function unlockSlotCost() {
  const purchasedSlots = state.unlockedSlots - STARTING_HOUSES * SLOTS_PER_HOUSE;
  return toBig(20 * 1.16 ** purchasedSlots);
}

function nextHouseCost() {
  return toBig(70 * 1.45 ** (state.houses - 1));
}

function woodCost() {
  return toBig(WOOD_BASE_COST * WOOD_COST_GROWTH ** state.woodPurchases);
}

function maxedAxolottosByRarity(rarity) {
  return state.axolottos.filter((ax) => ax.rarity === rarity && ax.food >= ax.foodSlots && ax.toys >= ax.toySlots).length;
}

function rarityUnlocked(rarity) {
  const requirements = RARITY_UNLOCK_REQUIREMENTS[rarity] || {};
  return Object.entries(requirements).every(([requiredRarity, count]) => maxedAxolottosByRarity(requiredRarity) >= count);
}

function rarityUnlockText(rarity) {
  const requirements = RARITY_UNLOCK_REQUIREMENTS[rarity] || {};
  const missing = Object.entries(requirements)
    .map(([requiredRarity, count]) => ({ requiredRarity, count, current: maxedAxolottosByRarity(requiredRarity) }))
    .filter((entry) => entry.current < entry.count);

  if (!missing.length) return "";

  return missing
    .map((entry) => `${entry.current}/${entry.count} fully upgraded ${rarityLabel(entry.requiredRarity).toLowerCase()} axolottos`)
    .join(" • ");
}

function upgradeBaseCost(type) {
  return type === "food" ? FOOD_BASE_COST : TOY_BASE_COST;
}

function upgradeGrowth(type) {
  return type === "food" ? FOOD_COST_GROWTH : TOY_COST_GROWTH;
}

function planUpgradePurchase(type, amount) {
  const key = type === "food" ? "food" : "toys";
  const slotsKey = type === "food" ? "foodSlots" : "toySlots";
  const levels = state.axolottos.map((ax) => ax[key]);
  const caps = state.axolottos.map((ax) => ax[slotsKey]);
  let totalUpgrades = levels.reduce((sum, value) => sum + value, 0);
  let spent = toBig(0);
  let purchased = 0;

  while (purchased < amount) {
    const targetIndex = levels.findIndex((value, index) => value < caps[index]);
    if (targetIndex < 0) break;
    const cost = toBig(upgradeBaseCost(type) * upgradeGrowth(type) ** totalUpgrades);
    if (!canAfford(state.bubbles, bigAdd(spent, cost))) break;
    spent = bigAdd(spent, cost);
    levels[targetIndex] += 1;
    totalUpgrades += 1;
    purchased += 1;
  }

  return { purchased, spent };
}

function woodPurchasePlan(amount) {
  let purchases = 0;
  let spent = toBig(0);
  let currentCost = woodCost();
  while (purchases < amount && canAfford(state.bubbles, bigAdd(spent, currentCost))) {
    spent = bigAdd(spent, currentCost);
    currentCost = bigMul(currentCost, WOOD_COST_GROWTH);
    purchases += 1;
  }
  return { purchased: purchases, spent };
}

function applyZoom() {
  state.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, state.zoom));
  const cardMin = Math.max(90, Math.round(245 * state.zoom));
  ui.villageGrid.style.setProperty("--village-card-min", `${cardMin}px`);
  ui.zoomValue.textContent = `${Math.round(state.zoom * 100)}%`;
}

function renderResources() {
  ui.bubblesValue.textContent = formatBig(state.bubbles);
  ui.woodValue.textContent = formatBig(state.wood);
  ui.housesValue.textContent = `${state.houses}`;
  ui.bpsValue.textContent = formatBig(toBig(totalBubblesPerSecond()), 1);
  ui.wpsValue.textContent = formatBig(toBig(totalWoodPerSecond()), 1);

  ui.woodWrap.hidden = bigCmp(state.wood, toBig(0)) <= 0;
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
  gain.textContent = `+${formatBig(toBig(amount), 1)} ${label}`;
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
    state.bubbles = bigAdd(state.bubbles, toBig(gained));
    spawnBubbleGain(node, gained);
    renderResources();
    renderStore();
  });

  return node;
}

function buyFood(amount = 1) {
  const plan = planUpgradePurchase("food", amount);
  if (plan.purchased < amount) return;
  state.bubbles = bigSub(state.bubbles, plan.spent);
  for (let i = 0; i < amount; i += 1) {
    const target = state.axolottos.find((ax) => ax.food < ax.foodSlots);
    if (!target) break;
    target.food += 1;
  }
}

function buyToy(amount = 1) {
  const plan = planUpgradePurchase("toy", amount);
  if (plan.purchased < amount) return;
  state.bubbles = bigSub(state.bubbles, plan.spent);
  for (let i = 0; i < amount; i += 1) {
    const target = state.axolottos.find((ax) => ax.toys < ax.toySlots);
    if (!target) break;
    target.toys += 1;
  }
}

function buyAxolotto(rarity) {
  const cost = axolottoCost(rarity);
  if (!rarityUnlocked(rarity) || state.axolottos.length >= state.unlockedSlots || !canAfford(state.bubbles, cost)) return;
  state.bubbles = bigSub(state.bubbles, cost);
  state.axolottos.push(createAxolotto(rarity));
}

function buyWood(amount = 1) {
  const plan = woodPurchasePlan(amount);
  if (plan.purchased < amount) return;
  state.bubbles = bigSub(state.bubbles, plan.spent);
  state.wood = bigAdd(state.wood, toBig(amount));
  state.woodPurchases += amount;
}

function upgradeDecorations(villageIndex) {
  const cost = decorationCost(villageIndex);
  if (!canAfford(state.wood, cost)) return;
  state.wood = bigSub(state.wood, cost);
  state.villages[villageIndex].decorations += 1;
}

function hireMayor(villageIndex) {
  const cost = mayorCost(villageIndex);
  if (!canAfford(state.wood, cost)) return;
  state.wood = bigSub(state.wood, cost);
  state.villages[villageIndex].mayor += 1;
}


function collectCooldownRemainingMs(villageIndex) {
  const now = Date.now();
  return Math.max(0, state.villages[villageIndex].nextCollectAt - now);
}

function collectButtonLabel(villageIndex) {
  const gain = formatBig(toBig(woodPerVillageClick(villageIndex)), 1);
  const remaining = collectCooldownRemainingMs(villageIndex);
  if (remaining <= 0) return `Collect Wood (+${gain})`;
  return `Collect in ${Math.ceil(remaining / 1000)}s (+${gain})`;
}

function collectVillageWood(villageIndex, node) {
  if (collectCooldownRemainingMs(villageIndex) > 0) return;
  const gain = woodPerVillageClick(villageIndex);
  state.wood = bigAdd(state.wood, toBig(gain));
  state.villages[villageIndex].nextCollectAt = Date.now() + COLLECT_COOLDOWN_MS;
  spawnBubbleGain(node, gain, "wood");
  renderResources();
  renderStore();
  refreshVillagePanels();
}

function unlockSlot() {
  if (state.unlockedSlots >= state.houses * SLOTS_PER_HOUSE) return;
  const cost = unlockSlotCost();
  if (!canAfford(state.wood, cost)) return;
  state.wood = bigSub(state.wood, cost);
  state.unlockedSlots += 1;
}

function buyHouse() {
  const cost = nextHouseCost();
  if (!canAfford(state.wood, cost)) return;
  state.wood = bigSub(state.wood, cost);
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
    woodPurchases: state.woodPurchases,
    villages: state.villages,
    axolottos: state.axolottos.map((ax) => ({ id: ax.id, rarity: ax.rarity, food: ax.food, toys: ax.toys, spritePath: ax.spritePath })),
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return;
  const data = JSON.parse(raw);

  state.bubbles = toBig(data.bubbles || 0);
  state.wood = toBig(data.wood || 0);
  state.houses = Math.max(STARTING_HOUSES, Number(data.houses || STARTING_HOUSES));
  state.unlockedSlots = Math.max(SLOTS_PER_HOUSE, Number(data.unlockedSlots || SLOTS_PER_HOUSE));
  state.zoom = Number(data.zoom || 1);
  state.woodPurchases = Math.max(0, Number(data.woodPurchases || 0));
  state.storeBulkSelection = { food: 1, toy: 1, wood: 1 };

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
  state.bubbles = toBig(0);
  state.wood = toBig(0);
  state.axolottos = [createAxolotto("common")];
  state.houses = STARTING_HOUSES;
  state.unlockedSlots = STARTING_HOUSES * SLOTS_PER_HOUSE;
  state.villages = Array.from({ length: STARTING_HOUSES }, () => ({ decorations: 0, mayor: 0, nextCollectAt: 0 }));
  state.zoom = 1;
  state.woodPurchases = 0;
  state.storeBulkSelection = { food: 1, toy: 1, wood: 1 };
}

function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}

function renderStore() {
  const items = [
    {
      name: "Food",
      description: "Raise click value; prices scale exponentially with total food upgrades.",
      currency: "bubbles",
      key: "food",
      purchasePlan: (amount) => planUpgradePurchase("food", amount),
      onBuy: buyFood,
    },
    {
      name: "Toy",
      description: "Raise auto-click speed; prices scale exponentially with total toy upgrades.",
      currency: "bubbles",
      key: "toy",
      purchasePlan: (amount) => planUpgradePurchase("toy", amount),
      onBuy: buyToy,
    },
    ...RARITY_ORDER.map((rarity) => ({
      name: `Purchase ${rarityLabel(rarity)} Axolotto`,
      description: rarityUnlocked(rarity)
        ? `Buy a ${rarity} axolotto with rarity-scaled stats and exponentially increasing cost.`
        : `Locked: ${rarityUnlockText(rarity)}`,
      cost: () => (state.axolottos.length >= state.unlockedSlots || !rarityUnlocked(rarity) ? null : axolottoCost(rarity)),
      currency: "bubbles",
      onBuy: () => buyAxolotto(rarity),
    })),
    {
      name: "Wood",
      description: "Buy wood directly with bubbles. Cost scales with each wood purchase.",
      currency: "bubbles",
      key: "wood",
      purchasePlan: woodPurchasePlan,
      onBuy: buyWood,
    },
    {
      name: "New House",
      description: "Adds a new village with 6 more slots and its own upgrades.",
      cost: () => nextHouseCost(),
      currency: "wood",
      disabled: () => !canAfford(state.wood, nextHouseCost()),
      onBuy: buyHouse,
    },
  ];

  ui.storeList.innerHTML = "";
  items.forEach((item) => {
    const node = ui.storeItemTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".item-name").textContent = item.name;
    node.querySelector(".item-description").textContent = item.description;

    const buyBtn = node.querySelector(".buy-btn");

    if (item.purchasePlan) {
      buyBtn.remove();

      const controls = document.createElement("div");
      controls.className = "bulk-buy-controls";

      const selected = state.storeBulkSelection[item.key] || 1;
      const maxPlan = item.purchasePlan(100);
      const availableAmounts = BULK_AMOUNTS.filter((amount) => maxPlan.purchased >= amount);
      if (!availableAmounts.length) availableAmounts.push(1);
      if (!availableAmounts.includes(selected)) {
        state.storeBulkSelection[item.key] = availableAmounts[availableAmounts.length - 1];
      }
      const activeAmount = state.storeBulkSelection[item.key];
      const activePlan = item.purchasePlan(activeAmount);

      const row = document.createElement("div");
      row.className = "bulk-buy-row";

      availableAmounts.forEach((amount) => {
        const optionBtn = document.createElement("button");
        optionBtn.type = "button";
        optionBtn.className = `buy-btn bulk-option-btn${amount === activeAmount ? " is-active" : ""}`;
        optionBtn.textContent = `+${amount}`;
        optionBtn.addEventListener("click", () => {
          state.storeBulkSelection[item.key] = amount;
          renderStore();
        });
        row.appendChild(optionBtn);
      });

      const purchaseBtn = document.createElement("button");
      purchaseBtn.type = "button";
      purchaseBtn.className = "buy-btn";
      purchaseBtn.textContent = activePlan.purchased >= activeAmount
        ? `Purchase +${activeAmount} (${formatBig(activePlan.spent)} ${item.currency})`
        : "Unavailable";
      purchaseBtn.disabled = activePlan.purchased < activeAmount;
      purchaseBtn.addEventListener("click", () => {
        item.onBuy(activeAmount);
        renderAll();
      });

      controls.append(row, purchaseBtn);
      node.appendChild(controls);
    } else {
      const cost = item.cost();
      const currencyResource = item.currency === "wood" ? state.wood : state.bubbles;
      const disabled = item.disabled ? item.disabled() : cost === null || !canAfford(currencyResource, cost);
      buyBtn.textContent = cost === null ? "Unavailable" : `Buy (${formatBig(cost)} ${item.currency})`;
      buyBtn.disabled = disabled;
      buyBtn.addEventListener("click", () => {
        item.onBuy();
        renderAll();
      });
    }

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
    heading.textContent = `Village ${houseIndex + 1} • ${formatBig(toBig(villageBps(houseIndex)), 1)} bubbles/s • ${formatBig(toBig(villageWoodPerSecond(houseIndex)), 1)} wood/s`;
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
    decorationsBtn.textContent = `Decorations Lv ${village.decorations} (${formatBig(decorationCost(houseIndex))} wood)`;
    decorationsBtn.disabled = !canAfford(state.wood, decorationCost(houseIndex));
    decorationsBtn.addEventListener("click", () => {
      upgradeDecorations(houseIndex);
      renderAll();
    });

    const mayorBtn = document.createElement("button");
    mayorBtn.className = "mayor-btn";
    mayorBtn.textContent = `Mayor Lv ${village.mayor} (${formatBig(mayorCost(houseIndex))} wood)`;
    mayorBtn.disabled = !canAfford(state.wood, mayorCost(houseIndex));
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
        button.textContent = `Unlock for ${formatBig(cost)} wood`;
        button.disabled = !canAfford(state.wood, cost);
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

    villageNode.querySelector(".village-block-title").textContent = `Village ${houseIndex + 1} • ${formatBig(toBig(villageBps(houseIndex)), 1)} bubbles/s • ${formatBig(toBig(villageWoodPerSecond(houseIndex)), 1)} wood/s`;
    const collectBtn = villageNode.querySelector(".collect-wood-btn");
    collectBtn.textContent = collectButtonLabel(houseIndex);
    collectBtn.disabled = collectCooldownRemainingMs(houseIndex) > 0;

    const decorationsBtn = villageNode.querySelector(".decorations-btn");
    decorationsBtn.textContent = `Decorations Lv ${village.decorations} (${formatBig(decorationCost(houseIndex))} wood)`;
    decorationsBtn.disabled = !canAfford(state.wood, decorationCost(houseIndex));

    const mayorBtn = villageNode.querySelector(".mayor-btn");
    mayorBtn.textContent = `Mayor Lv ${village.mayor} (${formatBig(mayorCost(houseIndex))} wood)`;
    mayorBtn.disabled = !canAfford(state.wood, mayorCost(houseIndex));
  });

  ui.villageGrid.querySelectorAll(".unlock-slot-btn").forEach((btn) => {
    const cost = unlockSlotCost();
    btn.textContent = `Unlock for ${formatBig(cost)} wood`;
    btn.disabled = !canAfford(state.wood, cost);
  });
}

function tick(deltaSeconds) {
  state.axolottos.forEach((ax) => {
    state.bubbles = bigAdd(state.bubbles, toBig(axolottoBps(ax) * deltaSeconds));
  });
  state.villages.forEach((_v, index) => {
    state.wood = bigAdd(state.wood, toBig(villageWoodPerSecond(index) * deltaSeconds));
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
