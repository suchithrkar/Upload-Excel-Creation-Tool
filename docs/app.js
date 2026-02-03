const output = document.querySelector("#output");

const logPlaceholder = (message) => {
  output.textContent = message;
};

document
  .querySelector("#processRepairCases")
  .addEventListener("click", () => {
    logPlaceholder("Process Repair Cases clicked.");
  });

document
  .querySelector("#processClosedCases")
  .addEventListener("click", () => {
    logPlaceholder("Process Closed Cases clicked.");
  });

document.querySelector("#copySoOrders").addEventListener("click", () => {
  logPlaceholder("Copy SO Orders clicked.");
});

document
  .querySelector("#copyTrackingUrls")
  .addEventListener("click", () => {
    logPlaceholder("Copy Tracking URLs clicked.");
  });
