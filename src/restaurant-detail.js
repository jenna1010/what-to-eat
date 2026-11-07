function showRestaurantDetail(restaurants, canEdit) {
  const query = new URLSearchParams(location.search);
  const shop = restaurants.find((entry) => entry.id === query.get("shop"));
  const detail = document.querySelector("#restaurant-detail").content.firstElementChild.cloneNode(true);
  document.querySelector("#album-home").replaceWith(detail);
  const dish = query.has("dish")
    ? shop?.dishes.find((entry) => entry.id === query.get("dish"))
    : shop?.dishes[0];
  const visits = dish ? [dish, ...(dish.history ?? [])] : [];
  const visit = query.has("visit")
    ? visits.find((entry) => entry.visitId === query.get("visit"))
    : dish;

  if (!visit) {
    const message = document.createElement("h1");
    message.textContent = !shop ? "找不到這家店" : !dish ? "找不到這道餐點" : "找不到這筆造訪紀錄";
    detail.querySelector("article").replaceWith(message);
    document.title = message.textContent + "｜今天吃什麼？";
    return;
  }

  const title = detail.querySelector("#restaurant");
  if (shop.englishName) title.querySelector("span").textContent = shop.englishName;
  else title.querySelector("span").remove();
  title.append(shop.name);
  document.title = shop.name + " · " + dish.name + "｜今天吃什麼？";
  detail.querySelector(".location").textContent = [shop.city, shop.district].join("・") + " ／ " + (visit.categories ?? dish.categories).join("、");
  detail.querySelector(".address").textContent = shop.address;
  const selector = detail.querySelector(".dish-list");
  if (shop.dishes.length > 1) {
    for (const option of shop.dishes) {
      const link = document.createElement("a");
      link.href = "?" + new URLSearchParams({ shop: shop.id, dish: option.id });
      link.textContent = option.name;
      if (option.id === dish.id) link.setAttribute("aria-current", "page");
      selector.append(link, " ");
    }
    selector.hidden = false;
  }

  if (visits.length > 1) {
    const history = detail.querySelector(".visit-history");
    history.hidden = false;
    history.open = query.has("visit");
    visits.forEach((entry, i) => {
      const link = document.createElement("a");
      const parameters = new URLSearchParams({shop: shop.id, dish: dish.id});
      parameters.set("visit", entry.visitId);
      link.href = "?" + parameters;
      link.textContent = (entry.date || "日期未記錄") + (i === 0 ? " · 最新" : "") + (entry.score != null ? " · " + entry.score + " 星" : "");
      if (entry.visitId === visit.visitId) {
        link.setAttribute("aria-current", "page");
        link.dataset.activeVisit = "true";
        link.dataset.visitLabel = (entry.date || "日期未記錄") + (i === 0 ? " · 最新" : "");
      }
      const item = document.createElement("li");
      item.append(link);
      history.querySelector("ul").append(item);
    });
  }

  detail.querySelector(".spread").dataset.visitId = visit.visitId;
  const image = detail.querySelector(".photo-link img");
  image.src = visit.photo;
  image.alt = visit.alt || dish.name;
  detail.querySelector(".photo-link").href = visit.photo;
  detail.querySelector("figcaption strong").textContent = dish.name;
  detail.querySelector(".price").textContent = visit.price == null ? "" : "NT$ " + visit.price;
  const meta = detail.querySelector(".visit-meta");
  meta.textContent = [visit.date, visit.orderer && ("點餐者：" + visit.orderer)].filter(Boolean).join(" · ");
  meta.hidden = !meta.textContent;
  renderRating(detail.querySelector("#dish-rating"), visit, canEdit);
  for (const review of detail.querySelectorAll(".review")) {
    renderReview(review, visit, canEdit);
  }
}

async function updateMealRecord(visitId, patch) {
  let response;
  try {
    response = await fetch("/api/records/" + encodeURIComponent(visitId), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
  } catch {
    throw new Error("無法確認是否儲存，請檢查網路後再試一次。");
  }
  if (response.status === 401 || response.status === 403) {
    throw new Error("儲存需要主人登入。請在另一個分頁登入後再試一次。");
  }
  if (!response.ok) throw new Error("無法儲存這筆修改，請再試一次。");
}

function readLocalPreview() {
  const restaurants = structuredClone(albumRestaurants);
  try {
    for (const shop of restaurants) {
      for (const dish of shop.dishes) {
        const saved = Number(localStorage.getItem("meal-album:visit-rating:" + dish.visitId));
        if (Number.isInteger(saved * 2) && saved >= .5 && saved <= 5) dish.score = saved;
        for (const author of ["me", "partner"]) {
          const note = localStorage.getItem("meal-album:review:" + dish.visitId + ":" + author);
          if (note !== null) dish.reviews[author] = note;
        }
      }
    }
  } catch {
    // Local file access to browser storage depends on the browser.
  }
  return { restaurants, categories: albumCategories, canEdit: false };
}

async function openAlbum() {
  const loading = document.querySelector("#album-loading");
  try {
    let album;
    if (location.protocol === "file:") {
      album = readLocalPreview();
    } else {
      const response = await fetch("/api/album", { cache: "no-store" });
      if (!response.ok) throw new Error("album load");
      album = await response.json();
    }
    if (!Array.isArray(album.restaurants) || !Array.isArray(album.categories)) throw new Error("album data");
    if (!album.canEdit && album.signInUrl) {
      const login = document.querySelector("#owner-login");
      const url = new URL(album.signInUrl, location.href);
      if (url.origin === location.origin) {
        login.href = url.href;
        login.hidden = false;
      }
    }
    if (new URLSearchParams(location.search).has("shop")) {
      showRestaurantDetail(album.restaurants, album.canEdit === true);
    } else {
      showAlbumHome(album.restaurants, album.categories);
      document.querySelector("#album-home").hidden = false;
    }
    loading.hidden = true;
    if (location.hash === "#notes-title") {
      document.getElementById("notes-title")?.scrollIntoView({block: "start"});
    }
  } catch {
    loading.replaceChildren("相簿暫時無法讀取。 ");
    const retry = document.createElement("button");
    retry.type = "button";
    retry.textContent = "重新載入";
    retry.addEventListener("click", () => location.reload());
    loading.append(retry);
  }
}

document.addEventListener("DOMContentLoaded", openAlbum, { once: true });
window.addEventListener("pageshow", (event) => {
  if (event.persisted && location.protocol !== "file:" && !document.querySelector(".review-form:not([hidden])")) {
    location.reload();
  }
});
