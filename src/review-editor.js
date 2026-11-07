function renderReview(review, visit, canEdit) {
  const heading = review.querySelector("h3");
  const author = heading.textContent;
  const note = review.querySelector("p");
  const authorId = review.dataset.author;
  let savedNote = visit.reviews?.[authorId] ?? "";
  note.textContent = savedNote || "尚未填寫心得";
  if (!canEdit) return;

  const edit = document.createElement("button");
  edit.type = "button";
  edit.className = "edit-review";
  edit.textContent = "編輯";
  edit.setAttribute("aria-label", "編輯" + author + "的心得");
  heading.append(edit);

  const form = document.querySelector("#review-form").content.firstElementChild.cloneNode(true);
  const input = form.querySelector("textarea");
  input.setAttribute("aria-label", author + "的心得");
  const status = document.createElement("span");
  status.className = "review-status";
  status.setAttribute("role", "status");
  review.append(form, status);

  function finishEditing() {
    form.hidden = true;
    note.hidden = false;
    edit.hidden = false;
    edit.focus();
  }

  edit.addEventListener("click", () => {
    input.value = savedNote;
    status.textContent = "";
    edit.hidden = true;
    note.hidden = true;
    form.hidden = false;
    input.focus();
  });
  form.querySelector(".cancel").addEventListener("click", () => {
    status.textContent = "";
    finishEditing();
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const nextNote = input.value.trim();
    for (const control of form.elements) control.disabled = true;
    status.textContent = "儲存中…";
    try {
      await updateMealRecord(visit.visitId, {reviews: {[authorId]: nextNote}});
      savedNote = nextNote;
      note.textContent = savedNote || "尚未填寫心得";
      status.textContent = "心得已儲存";
      finishEditing();
    } catch (error) {
      status.textContent = error.message;
    } finally {
      for (const control of form.elements) control.disabled = false;
    }
  });
}
