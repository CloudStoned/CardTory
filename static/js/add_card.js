document.addEventListener("DOMContentLoaded", () => {
    const addCardBtn = document.querySelector("#addCardBtn");
    const modal = new bootstrap.Modal(document.getElementById("dynamicModal"));
    const modalContent = document.querySelector("#dynamicModalContent");

    // 1. Open modal with empty form
    addCardBtn.addEventListener("click", () => {
        const url = addCardBtn.dataset.url;

        fetch(url, { headers: {"X-Requested-With": "XMLHttpRequest"} })
            .then(res => res.json())
            .then(data => {
                modalContent.innerHTML = data.html;
                modal.show();
                attachFormHandler(url);
            });
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
                        // Add new row to table
                        const tbody = document.querySelector("#cardsTbody");
                        const emptyRow = tbody.querySelector("#no-cards-row");
                        if (emptyRow) emptyRow.remove();

                        tbody.insertAdjacentHTML("afterbegin", data.row_html);
                        modal.hide();
                    } else {
                        modalContent.innerHTML = data.html;
                        attachFormHandler(url); // rebind if validation failed
                    }
                });
        });
    }
});