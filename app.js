const views = Array.from(document.querySelectorAll(".view"));
const navButtons = Array.from(document.querySelectorAll(".dock button"));

function showView(name) {
  for (const view of views) {
    view.classList.toggle("active", view.dataset.view === name);
  }

  for (const button of navButtons) {
    button.classList.toggle("active", button.dataset.target === name);
  }
}

for (const button of navButtons) {
  button.addEventListener("click", () => showView(button.dataset.target));
}

window.NeuroLink = {
  showView
};
