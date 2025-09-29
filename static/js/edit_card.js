document.addEventListener("DOMContentLoaded", () => {
    const modal = new bootstrap.Modal(document.getElementById("dynamicModal"));
    const modalContent = document.querySelector("#dynamicModalContent");

    // Delegate clicks inside the table body
    document.querySelector("#cardsTbody").addEventListener("click", (e) => {
        if (e.target.classList.contains("edit-btn")) {
            const url = e.target.dataset.url;

            // GET prefilled form
            fetch(url, { headers: { "X-Requested-With": "XMLHttpRequest" } })
                .then(res => res.json())
                .then(data => {
                    modalContent.innerHTML = data.html;
                    modal.show();
                    attachFormHandler(url);
                });
        }
    });

    function attachFormHandler(url) {
        const form = modalContent.querySelector("form");

        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const formData = new FormData(form);

            fetch(url, {
                method: "POST",
                headers: { "X-Requested-With": "XMLHttpRequest" },
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
                        attachFormHandler(url); // re-attach on failed validation
                    }
                });
        });
    }
});
