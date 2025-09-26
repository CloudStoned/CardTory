document.addEventListener("DOMContentLoaded", () => {
  setupDeleteButtons();
  setupEditButtons();
});

// Helper to get CSRF token
function getCSRFToken() {
  return document.querySelector("[name=csrfmiddlewaretoken]").value;
}

// Delete buttons
function setupDeleteButtons() {
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const url = btn.getAttribute("data-url");

      if (confirm("Are you sure you want to delete this card?")) {
        fetch(url, {
          method: "POST",
          headers: {
            "X-CSRFToken": getCSRFToken(),
          }
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            btn.closest("tr").remove();
          }
        });
      }
    });
  });
}

// Edit buttons
function setupEditButtons() {
  const editButtons = document.querySelectorAll(".edit-btn");
  const modalElement = document.getElementById("editModal");
  const modalContent = document.getElementById("editModalContent");
  const editModal = new bootstrap.Modal(modalElement);

  editButtons.forEach(button => {
    button.addEventListener("click", () => {
      const url = button.dataset.url;

      fetch(url)
        .then(response => response.json())
        .then(data => {
          modalContent.innerHTML = data.html;
          editModal.show();

          const form = modalContent.querySelector("#editCardModal");
          form.addEventListener("submit", function (e) {
            e.preventDefault();

            fetch(url, {
              method: "POST",
              body: new FormData(form),
              headers: { "X-Requested-With": "XMLHttpRequest" }
            })
            .then(res => res.json())
            .then(result => {
              if (result.success) {
                location.reload();
              } else {
                modalContent.innerHTML = result.html;
              }
            });
          });
        });
    });
  });
}
