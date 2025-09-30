document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".remove-btn").forEach(button => {
    button.addEventListener("click", function () {
      if (!confirm("Are you sure you want to remove this card?")) {
        return; // stop if user cancels
      }

      const url = this.dataset.url; // Django gave us the remove_card URL
      const row = this.closest("tr"); // grab the row

      fetch(url, {
        method: "POST",
        headers: {
          "X-CSRFToken": getCookie("csrftoken"), // CSRF token required
        },
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            row.remove(); // remove row directly
          } else {
            alert("Error: " + data.error);
          }
        });
    });
  });
});

// helper for CSRF
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.startsWith(name + "=")) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}
