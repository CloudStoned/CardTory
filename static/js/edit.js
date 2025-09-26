document.addEventListener("DOMContentLoaded", () => {
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

          // Handle form submission dynamically
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
                  location.reload(); // refresh table
                } else {
                  modalContent.innerHTML = result.html; // re-render form with errors
                }
              });
          });
        });
    });
  });
});
