document.addEventListener("DOMContentLoaded", () => {
  // Delete button handler
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const url = btn.getAttribute("data-url");

      if (confirm("Are you sure you want to delete this card?")) {
        fetch(url, {
          method: "POST",
          headers: {
            "X-CSRFToken": getCSRFToken(), // helper function
          }
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Remove row from table
            btn.closest("tr").remove();
          }
        });
      }
    });
  });
});

// Helper to get CSRF token
function getCSRFToken() {
  return document.querySelector("[name=csrfmiddlewaretoken]").value;
}
