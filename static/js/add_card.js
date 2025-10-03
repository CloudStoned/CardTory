document.addEventListener("DOMContentLoaded", () => {
    const addCardBtn = document.querySelector("#addCardBtn");
    const modalEl = document.getElementById("dynamicModal");
    const modal = new bootstrap.Modal(modalEl);
    const modalContent = document.querySelector("#dynamicModalContent");

    // 1️⃣ Open modal with empty form
    addCardBtn.addEventListener("click", () => {
        const url = addCardBtn.dataset.url;

        fetch(url, { headers: { "X-Requested-With": "XMLHttpRequest" } })
            .then(res => res.json())
            .then(data => {
                modalContent.innerHTML = data.html;
                modal.show();
                attachFormHandler(url);
            });
    });

    function attachFormHandler(url) {
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
                    const tbody = document.querySelector("#cardsTbody");

                    // Remove "no cards" row if exists
                    const emptyRow = tbody.querySelector("#no-cards-row");
                    if (emptyRow) emptyRow.remove();

                    // Insert new card row
                    tbody.insertAdjacentHTML("afterbegin", data.row_html);

                    // Hide modal after success
                    modal.hide();
                } else {
                    // Re-inject form if validation failed
                    modalContent.innerHTML = data.html;
                    attachFormHandler(url); // Rebind listeners
                }
            })
            .catch(err => console.error(err));
        });
    }
});