"use strict";

const byId = id => document.getElementById(id);
const form = byId("meal-form");
const preview = byId("preview");
const shopSelect = byId("shop-select");
const dishList = byId("dish-list");
const newShopFields = byId("new-shop");
const feedback = byId("feedback");
const photoTasks = new WeakMap();
let restaurants = [];
let categories = [];
let visitId;
let newShopId;
let pendingVisit;
let signInUrl;
let publishing = false;
let lastRejectedPayload = null;
let outcomeUnknown = false;
const maxDishes = 6;

function textElement(tag, text, className) {
  const element = document.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  return element;
}

function selectedShop() {
  return restaurants.find(shop => shop.id === shopSelect.value);
}

function sameName(a, b) {
  return a.trim().normalize("NFKC").toLowerCase() === b.trim().normalize("NFKC").toLowerCase();
}

function updateDishChoices(card) {
  const choices = selectedShop()?.dishes ?? [];
  const select = card.querySelector(".old-dish");
  select.replaceChildren(new Option("新餐點", ""));
  for (const dish of choices) select.add(new Option(dish.name, dish.id));
  card.querySelector(".old-dish-wrap").hidden = !choices.length;
  card.querySelector(".dish-name").readOnly = false;
}

function applyShopChoice() {
  const shop = selectedShop();
  newShopFields.hidden = shopSelect.value !== "new";
  newShopFields.disabled = newShopFields.hidden;
  byId("shop-address").textContent = shop?.address || "";
  byId("shop-address").hidden = !shop?.address;
  for (const card of dishList.children) updateDishChoices(card);
}

function renumberDishes() {
  const cards = [...dishList.children];
  cards.forEach((card, index) => {
    card.querySelector(".dish-heading").textContent = "餐點 " + (index + 1);
    card.querySelector(".dish-tools").hidden = cards.length === 1;
  });
  byId("add-dish").hidden = cards.length >= maxDishes;
}

async function preparePhoto(file) {
  const image = new Image();
  const objectUrl = URL.createObjectURL(file);
  try {
    image.src = objectUrl;
    await image.decode();
    const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.85, 0.72, 0.56, 0.4]) {
      const data = canvas.toDataURL("image/jpeg", quality);
      if (data.startsWith("data:image/jpeg;base64,") && data.length <= 1_398_100) return data;
    }
    throw new Error("請改選一張較小的照片。");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function selectPhoto(card) {
  const input = card.querySelector(".file");
  const file = input.files[0];
  const message = card.querySelector(".file-status");
  const thumb = card.querySelector(".thumbnail");
  thumb.removeAttribute("src");
  thumb.hidden = true;
  input.setCustomValidity("");
  message.textContent = "";
  photoTasks.delete(card);
  if (!file) return;
  message.textContent = "準備照片中…";
  const task = preparePhoto(file).then(data => {
    if (input.files[0] === file) {
      thumb.src = data;
      thumb.hidden = false;
      message.textContent = "";
    }
    return data;
  }).catch(() => {
    if (input.files[0] === file) {
      message.textContent = "無法讀取這張照片。請改選 JPG 或 PNG 圖片。";
      input.setCustomValidity(message.textContent);
    }
    return null;
  });
  photoTasks.set(card, task);
}

function showStars(row, value) {
  [...row.children].forEach((cell, i) => {
    const filled = Math.max(0, Math.min(1, (value || 0) - i));
    cell.style.setProperty("--fill", filled * 100 + "%");
  });
}

function createStars(row, select) {
  for (let position = 1; position <= 5; position++) {
    const cell = document.createElement("span");
    cell.className = "score-star";
    const glyph = textElement("span", "★");
    glyph.setAttribute("aria-hidden", "true");
    cell.append(glyph);
    if (select) {
      for (const value of [position - 0.5, position]) {
        const button = document.createElement("button");
        button.type = "button";
        button.tabIndex = -1; // Keyboard users can choose every value in the native select.
        button.setAttribute("aria-label", value + " 顆星");
        button.addEventListener("click", () => {
          select.value = String(value);
          showStars(row, value);
        });
        cell.append(button);
      }
    }
    row.append(cell);
  }
}

function addDish() {
  const card = byId("dish-template").content.firstElementChild.cloneNode(true);
  card.dataset.newId = crypto.randomUUID();
  const pills = card.querySelector(".pills");
  for (const category of categories) {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = category;
    label.append(checkbox, category);
    pills.append(label);
  }
  const score = card.querySelector(".score");
  for (let half = 1; half <= 10; half++) {
    const value = half / 2;
    score.add(new Option(value + " 顆星", String(value)));
  }
  const starRow = card.querySelector(".score-picker");
  createStars(starRow, score);
  showStars(starRow, null);
  score.addEventListener("change", () => showStars(starRow, Number(score.value)));
  card.querySelector(".file").addEventListener("change", () => selectPhoto(card));
  card.querySelector(".remove").addEventListener("click", () => {
    card.remove();
    renumberDishes();
    byId("add-dish").focus();
  });
  card.querySelector(".old-dish").addEventListener("change", event => {
    const dish = selectedShop()?.dishes.find(d => d.id === event.target.value);
    const name = card.querySelector(".dish-name");
    name.value = dish?.name ?? "";
    name.readOnly = Boolean(dish);
    for (const checkbox of pills.querySelectorAll("input")) {
      checkbox.checked = Boolean(dish?.categories.includes(checkbox.value));
    }
  });
  updateDishChoices(card);
  dishList.appendChild(card);
  renumberDishes();
  return card;
}

function readShop() {
  const existing = selectedShop();
  if (existing) {
    const {id, name, englishName, city, district, address} = existing;
    return {id, name, englishName: englishName || "", city, district, address: address || ""};
  }
  const shop = {
    id: newShopId, name: byId("shop-name").value.trim(), englishName: byId("shop-english").value.trim(),
    city: byId("shop-city").value.trim().replace(/^台/, "臺"), district: byId("shop-district").value.trim(),
    address: byId("shop-street").value.trim()
  };
  if (!shop.name || !shop.city || !shop.district) throw new Error("請填寫店名、縣市與行政區。");
  const duplicate = restaurants.find(entry => sameName(shop.name, entry.name) &&
    sameName(shop.city, entry.city.replace(/^台/, "臺")) && sameName(shop.district, entry.district) &&
    (!shop.address || !entry.address || sameName(shop.address, entry.address)));
  if (duplicate) throw new Error("相簿裡已經有這家店，請在「店家」選單改選現有店家。");
  return shop;
}

async function readDish(card, index) {
  const field = selector => card.querySelector(selector);
  const name = field(".dish-name").value.trim();
  if (!name) throw new Error("請填寫第 " + index + " 道的菜名。");
  const old = selectedShop()?.dishes.find(entry => sameName(entry.name, name));
  const types = [...card.querySelectorAll(".pills input:checked")].map(box => box.value);
  if (!types.length) throw new Error("請為「" + name + "」選擇至少一種餐點類型。");
  const photoData = await photoTasks.get(card);
  if (!photoData) throw new Error("請確認「" + name + "」的照片能正常讀取。");
  const price = field(".price-field").value;
  const score = field(".score").value;
  return {
    id: old?.id || card.dataset.newId, name:old?.name || name, categories:types, price:price === "" ? null : Number(price),
    score:score === "" ? null : Number(score), orderer:field(".orderer").value,
    reviews:{me:field(".mine").value.trim(), partner:field(".partner").value.trim()}, photoData
  };
}

function renderPreview(visit) {
  byId("preview-shop").replaceChildren(
    textElement("h2", visit.shop.name + (visit.shop.englishName ? " · " + visit.shop.englishName : "")),
    textElement("p", [visit.date, visit.shop.city + visit.shop.district, visit.shop.address].filter(Boolean).join(" · "))
  );
  const dishes = byId("preview-dishes");
  dishes.replaceChildren();
  for (const dish of visit.dishes) {
    const print = document.createElement("article");
    print.className = "preview-print";
    const photo = new Image();
    photo.src = dish.photoData;
    photo.alt = dish.name;
    const notes = document.createElement("div");
    if (dish.score !== null) {
      const line = document.createElement("div");
      line.className = "score-preview";
      const starRow = document.createElement("span");
      starRow.className = "star-row";
      starRow.setAttribute("aria-hidden", "true");
      createStars(starRow);
      showStars(starRow, dish.score);
      line.append(starRow, textElement("span", dish.score + " / 5", "score-text"));
      notes.append(line);
    }
    notes.append(textElement("h3", dish.name));
    const metadata = [...dish.categories];
    if (dish.price !== null) metadata.push("NT$ " + dish.price);
    if (dish.orderer) metadata.push("點餐者：" + dish.orderer);
    notes.append(textElement("p", metadata.join(" · ")));
    for (const [key, author] of [["me","我"],["partner","男友"]]) {
      if (dish.reviews[key]) notes.append(textElement("h4", author), textElement("p", dish.reviews[key]));
    }
    print.append(photo, notes);
    dishes.append(print);
  }
}

function setStep(showPreview) {
  form.hidden = showPreview;
  preview.hidden = !showPreview;
  const title = byId("page-title");
  title.textContent = showPreview ? "發布前預覽" : "新增一餐";
  feedback.replaceChildren();
  window.scrollTo(0, 0);
  title.focus({preventScroll:true});
}

function loginLink() {
  const link = textElement("a", "主人登入");
  const url = new URL(signInUrl || "/signin-with-chatgpt?return_to=%2Fnew-meal.html", location.href);
  if (url.origin === location.origin) link.href = url.href;
  link.target = "_top";
  return link;
}

function showAccessMessage(message, allowLogin) {
  const access = byId("access");
  access.replaceChildren(textElement("div", message));
  if (allowLogin) access.append(loginLink());
  access.hidden = false;
}

async function init() {
  if (location.protocol === "file:") {
    showAccessMessage("請從已上線的相簿網址開啟「新增一餐」，才能登入並發布給朋友。");
    return;
  }
  try {
    const response = await fetch("/api/album", {cache:"no-store"});
    if (!response.ok) throw new Error();
    const album = await response.json();
    signInUrl = album.signInUrl;
    if (!album.canEdit) {
      showAccessMessage("只有相簿主人可以新增紀錄。請用主人的帳號登入。", true);
      return;
    }
    categories = album.categories;
    restaurants = album.restaurants;
    visitId = crypto.randomUUID();
    newShopId = crypto.randomUUID();
    shopSelect.add(new Option("請選擇店家", ""));
    shopSelect.add(new Option("＋ 新增店家", "new"));
    for (const shop of restaurants) {
      const duplicate = restaurants.some(other => other.id !== shop.id && other.name === shop.name && other.city === shop.city && other.district === shop.district);
      const where = shop.city + shop.district + (duplicate && shop.address ? " · " + shop.address : "");
      shopSelect.add(new Option(shop.name + "（" + where + "）", shop.id));
    }
    for (const [id, key] of [["city-list","city"],["district-list","district"]]) {
      for (const value of new Set(restaurants.map(shop => shop[key]))) byId(id).append(new Option(value, value));
    }
    const today = new Date();
    byId("visit-date").value = [today.getFullYear(), String(today.getMonth()+1).padStart(2,"0"), String(today.getDate()).padStart(2,"0")].join("-");
    addDish();
    byId("access").hidden = true;
    form.hidden = false;
  } catch {
    showAccessMessage("目前無法讀取相簿。請檢查網路後重新整理。");
  }
}

shopSelect.addEventListener("change", applyShopChoice);
byId("add-dish").addEventListener("click", () => {
  if (dishList.children.length < maxDishes) addDish().querySelector(".dish-name").focus();
});
byId("back-edit").addEventListener("click", () => setStep(false));
form.addEventListener("submit", async event => {
  event.preventDefault();
  const submit = event.submitter || form.querySelector('[type="submit"]');
  submit.disabled = true;
  try {
    const shop = readShop();
    const dishes = await Promise.all([...dishList.children].map((card, i) => readDish(card, i + 1)));
    if (dishes.some((dish, i) => dishes.slice(0, i).some(first => sameName(first.name, dish.name)))) {
      throw new Error("這一餐有重複的菜名，請將同一道菜記在一起。");
    }
    pendingVisit = {id:visitId, date:byId("visit-date").value, shop, dishes};
    if (lastRejectedPayload && JSON.stringify(pendingVisit) !== lastRejectedPayload) {
      visitId = crypto.randomUUID();
      pendingVisit.id = visitId;
      lastRejectedPayload = null;
    }
    renderPreview(pendingVisit);
    setStep(true);
  } catch (error) {
    feedback.textContent = error.message || "請檢查輸入內容。";
    feedback.scrollIntoView({block:"nearest"});
  } finally {
    submit.disabled = false;
  }
});
byId("publish").addEventListener("click", async () => {
  if (publishing || !pendingVisit) return;
  publishing = true;
  byId("back-edit").disabled = byId("publish").disabled = true;
  feedback.textContent = "正在發布這一餐…";
  const checkingPreviousAttempt = outcomeUnknown;
  try {
    outcomeUnknown = true;
    const response = await fetch("/api/visits", {
      method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(pendingVisit)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const rejected = [400, 409, 413, 415, 422].includes(response.status);
      if (rejected) {
        outcomeUnknown = false;
        lastRejectedPayload = JSON.stringify(pendingVisit);
      }
      if (response.status === 401 || response.status === 403) {
        outcomeUnknown = checkingPreviousAttempt;
        feedback.textContent = "請用主人的帳號重新登入，再回本頁重試。 ";
        const link = loginLink();
        link.target = "_blank";
        link.rel = "noopener";
        feedback.append(link);
        return;
      }
      throw new Error(result.error || "發布失敗，內容已保留在本頁，請再試一次。");
    }
    if (!result.shopId || !result.dishId) throw new Error("未收到發布確認。");
    const query = new URLSearchParams({shop:result.shopId, dish:result.dishId});
    location.replace("index.html?" + query);
  } catch (error) {
    if (outcomeUnknown) {
      feedback.textContent = "還無法確認這一餐是否已發布。內容已保留，可按「重試發布」安全續傳，或先";
      const check = textElement("a", "開相簿查看");
      check.href = "index.html";
      check.target = "_blank";
      check.rel = "noopener";
      feedback.append(check, "。");
      byId("publish").textContent = "重試發布";
    } else {
      feedback.textContent = error.message;
    }
  } finally {
    publishing = false;
    // Keep an ambiguous retry byte-identical, even if the first response was lost.
    byId("back-edit").disabled = outcomeUnknown;
    byId("publish").disabled = false;
  }
});

init();
