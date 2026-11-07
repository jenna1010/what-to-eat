function showAlbumHome(albumRestaurants, albumCategories) {
  const city = document.querySelector("#city-filter");
  const district = document.querySelector("#district-filter");
  const category = document.querySelector("#category-filter");
  const drawButton = document.querySelector("#draw-button");
  const clearButton = document.querySelector("#clear-filters");
  const hint = document.querySelector("#draw-hint");
  const stack = document.querySelector("#print-stack");
  const result = document.querySelector("#draw-result");
  const resultPhoto = document.querySelector("#result-photo");
  const gallery = document.querySelector("#dish-gallery");
  let candidates = [];
  let previousId = null;

  function replaceOptions(select, values, firstLabel) {
    const previous = select.value;
    select.replaceChildren(new Option(firstLabel, ""));
    for (const value of new Set(values)) select.add(new Option(value, value));
    select.value = values.includes(previous) ? previous : "";
  }

  function updateDistricts() {
    const inCity = albumRestaurants.filter(shop => !city.value || shop.city === city.value);
    replaceOptions(district, inCity.map(shop => shop.district), "全部行政區");
  }

  function detailLink(shop, dish) {
    return "?" + new URLSearchParams({shop: shop.id, dish: dish.id}).toString();
  }

  function makeText(tag, className, text) {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = text;
    return element;
  }

  function dishCard(shop, dish) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = detailLink(shop, dish) + "#notes-title";
    link.setAttribute("aria-label", shop.name + "，" + dish.name + "，查看心得");

    const photo = document.createElement("img");
    photo.src = dish.photo;
    photo.alt = dish.alt || dish.name;
    photo.loading = "lazy";

    const caption = document.createElement("div");
    caption.className = "dish-caption";
    const byline = makeText("span", "dish-shop", shop.name);
    const name = makeText("strong", "dish-name", dish.name);
    const meta = document.createElement("div");
    meta.className = "dish-meta";
    if (dish.price != null) meta.append(makeText("span", "dish-price", "NT$ " + dish.price));
    if (dish.score != null) meta.append(makeText("span", "dish-score", "★ " + dish.score + " / 5"));
    caption.append(byline, name, meta);
    link.append(photo, caption);
    item.append(link);
    return item;
  }

  function renderGallery() {
    const cards = candidates.flatMap(({shop, dishes}) => dishes.map(dish => dishCard(shop, dish)));
    gallery.replaceChildren(...cards);
    document.querySelector("#match-count").textContent = cards.length + " 道餐點 · " + candidates.length + " 家店";
  }

  function showStack() {
    stack.replaceChildren();
    stack.hidden = !candidates.length;
    result.hidden = true;
    for (const {shop, dishes} of candidates.slice(0, 2)) {
      const print = document.createElement("span");
      print.className = "cover-print";
      const photo = document.createElement("img");
      photo.src = dishes[0].photo;
      photo.alt = "";
      print.append(photo, makeText("span", "cover-caption", shop.name));
      stack.append(print);
    }
  }

  function pick(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function draw() {
    if (!candidates.length) return;
    const pool = candidates.length > 1
      ? candidates.filter(({shop}) => shop.id !== previousId)
      : candidates;
    const {shop, dishes} = pick(pool);
    const dish = pick(dishes);
    previousId = shop.id;
    resultPhoto.src = dish.photo;
    resultPhoto.alt = dish.alt;
    result.dataset.shop = shop.id;
    document.querySelector("#result-location").textContent = shop.city + " · " + shop.district;
    document.querySelector("#result-name").textContent = shop.name;
    document.querySelector("#result-dish").textContent = dish.name;
    document.querySelector("#result-link").href = detailLink(shop, dish);
    const fromStack = document.activeElement === stack;
    stack.hidden = true;
    result.hidden = false;
    drawButton.textContent = "再翻一張";
    drawButton.hidden = candidates.length < 2;
    if (fromStack && !drawButton.hidden) drawButton.focus({preventScroll: true});
    hint.textContent = candidates.length === 1
      ? "只有這一家符合條件。放寬篩選可以抽到更多店。"
      : "翻到了" + shop.name + "！";
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      result.getAnimations().forEach(animation => animation.cancel());
      result.animate([
        {transform: "perspective(850px) rotateY(-75deg) rotate(-2deg)", opacity: 0.45},
        {transform: "perspective(850px) rotateY(0) rotate(-2deg)", opacity: 1}
      ], {duration: 330, easing: "ease-out"});
    }
  }

  function applyFilters() {
    previousId = null;
    candidates = [];
    for (const shop of albumRestaurants) {
      if (city.value && shop.city !== city.value) continue;
      if (district.value && shop.district !== district.value) continue;
      const dishes = shop.dishes.filter(dish => !category.value || dish.categories.includes(category.value));
      if (dishes.length) candidates.push({shop, dishes});
    }
    renderGallery();
    clearButton.hidden = !(city.value || district.value || category.value);
    drawButton.hidden = candidates.length < 2;
    drawButton.textContent = "今天吃什麼？";
    showStack();
    if (candidates.length === 1) {
      draw();
    } else {
      hint.textContent = candidates.length ? "" : "這個條件下還沒有紀錄。";
    }
  }

  replaceOptions(city, albumRestaurants.map(shop => shop.city), "全部縣市");
  updateDistricts();
  replaceOptions(category, albumCategories, "全部類型");
  city.addEventListener("change", () => {
    district.value = "";
    updateDistricts();
    applyFilters();
  });
  district.addEventListener("change", applyFilters);
  category.addEventListener("change", applyFilters);
  drawButton.addEventListener("click", draw);
  stack.addEventListener("click", draw);
  clearButton.addEventListener("click", () => {
    city.value = "";
    district.value = "";
    category.value = "";
    updateDistricts();
    applyFilters();
    city.focus();
  });
  applyFilters();
}
