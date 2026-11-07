function renderRating(rating, visit, canEdit) {
  let savedScore = visit.score;
  const group = document.createElement("div");
  group.className = "rating-options";
  if (canEdit) {
    group.setAttribute("role", "radiogroup");
    group.setAttribute("aria-label", "本次餐點評分，滿分五顆星");
  } else {
    group.setAttribute("aria-hidden", "true");
  }
  const caption = document.createElement("span");
  caption.className = "rating-caption";
  caption.textContent = canEdit ? "本次餐點評分 · 點左半顆可給半星" : "本次餐點評分";
  const number = document.createElement("span");
  number.className = "rating-number";
  const feedback = document.createElement("span");
  feedback.className = "rating-feedback";
  feedback.setAttribute("role", "status");
  const stars = [];
  const radios = [];

  function showScore(value) {
    stars.forEach((star, index) => {
      const fill = Math.min(1, Math.max(0, (value ?? 0) - index));
      star.style.setProperty("--star-fill", fill * 100 + "%");
    });
    for (const radio of radios) radio.checked = Number(radio.value) === value;
    number.textContent = value == null ? "未評分" : value + " / 5";
  }

  for (let position = 1; position <= 5; position++) {
    const cell = document.createElement("span");
    cell.className = "rating-cell";
    const glyph = document.createElement("span");
    glyph.className = "rating-glyph";
    glyph.textContent = "☆";
    glyph.setAttribute("aria-hidden", "true");
    cell.append(glyph);
    stars.push(glyph);

    if (canEdit) {
      for (const value of [position - 0.5, position]) {
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "visit-rating";
        input.value = String(value);
        input.setAttribute("aria-label", value + " 顆星");
        input.addEventListener("change", async () => {
          for (const radio of radios) radio.disabled = true;
          showScore(value);
          feedback.textContent = "儲存中…";
          try {
            await updateMealRecord(visit.visitId, {score: value});
            savedScore = value;
            const historyLink = document.querySelector("[data-active-visit]");
            if (historyLink) historyLink.textContent = historyLink.dataset.visitLabel + " · " + value + " 星";
            feedback.textContent = "評分已儲存";
          } catch (error) {
            showScore(savedScore);
            feedback.textContent = error.message;
          } finally {
            for (const radio of radios) radio.disabled = false;
          }
        });
        radios.push(input);
        cell.append(input);
      }
    }
    group.append(cell);
  }
  rating.append(caption, group, number, feedback);
  showScore(savedScore);
}
