const views = Array.from(document.querySelectorAll(".view"));
const routeButtons = Array.from(document.querySelectorAll("[data-target]"));

function showView(name) {
  const viewName = views.some((view) => view.dataset.view === name) ? name : "home";

  for (const view of views) {
    view.classList.toggle("active", view.dataset.view === viewName);
  }

  for (const button of routeButtons) {
    button.classList.toggle("active", button.dataset.target === viewName);
  }

  if (location.hash !== `#${viewName}`) {
    history.replaceState(null, "", `#${viewName}`);
  }
}

for (const button of routeButtons) {
  button.addEventListener("click", () => showView(button.dataset.target));
}

window.addEventListener("hashchange", () => {
  showView(location.hash.replace("#", "") || "home");
});

showView(location.hash.replace("#", "") || "home");

window.NeuroLink = {
  showView
};
