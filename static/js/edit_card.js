document.addEventListener("DOMContentLoaded", () => {
    const editButtons = document.querySelectorAll(".edit-btn");
    const modal = new bootstrap.Modal(document.getElementById("dynamicModal"));
    const modalContent = document.querySelector("#dynamicModalContent");

    editButtons.forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const url = btn.dataset.url;

            // GET prefilled form
            fetch(url, { headers: {"X-Requested-With": "XMLHttpRequest"} })
                .then(res => res.json())
                .then(data => {
                    modalContent.innerHTML = data.html;
                    modal.show();
                    attachFormHandler(url);
                });
        });
    });

    function attachFormHandler(url) {
        const form = modalContent.querySelector("form");

        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const formData = new FormData(form);

            fetch(url, {
                method: "POST",
                headers: {"X-Requested-With": "XMLHttpRequest"},
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const row = document.querySelector(`#cardRow${data.id}`);
                    row.outerHTML = data.row_html;
                    modal.hide();
                } else {
                    modalContent.innerHTML = data.html;
                    attachFormHandler(url);
                }
            });
        });
    }
});
