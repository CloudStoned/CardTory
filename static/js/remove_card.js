document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.querySelector("#cardsTbody");

  tbody.addEventListener("click", function (e) {
    if (!e.target.classList.contains("remove-btn")) return;

    if (!confirm("Are you sure you want to remove this card?")) return;

    const button = e.target;
    const url = button.dataset.url;
    const row = button.closest("tr");

    fetch(url, {
      method: "POST",
      headers: {
        "X-CSRFToken": getCookie("csrftoken"),
        "X-Requested-With": "XMLHttpRequest"
      },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) row.remove();
            const tbody = document.querySelector("#cardsTbody");
        if (tbody.children.length === 0) {
            tbody.innerHTML = `
                <tr id="no-cards-row">
                    <td colspan="7" class="text-center text-muted">No cards found</td>
                </tr>`;
        }
        else alert("Error: " + data.error);
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
