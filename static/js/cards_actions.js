const addBtn = document.querySelector("#addCardBtn");
const modalContent = document.querySelector("#dynamicModalContent");

function openAddCardModal(url) {
    fetch(url, {
        headers: {"X-Requested-With": "XMLHttpRequest"} // AJAX header
    })
    .then(res => res.json())
    .then(data => {
        modalContent.innerHTML = data.html; // Inject form HTML
        const modal = new bootstrap.Modal(document.getElementById("dynamicModal"));
        modal.show();

        // Handle form submission
        const form = modalContent.querySelector("form");
        form.addEventListener("submit", function(e){
            e.preventDefault();
            const formData = new FormData(form);

            fetch(url, {
                method: "POST",
                headers: {"X-Requested-With": "XMLHttpRequest"},
                body: formData
            })
            .then(res => res.json())
            .then(resp => {
                if(resp.success){
                    // Add new row to table
                    document.querySelector("#cardsTbody").insertAdjacentHTML("afterbegin", resp.row_html);
                    modal.hide();
                } else {
                    // Show form with validation errors
                    modalContent.innerHTML = resp.html;
                }
            });
        });
    })
    .catch(err => console.error(err));
}

// Attach click listener
addBtn.addEventListener("click", () => openAddCardModal(addBtn.dataset.url));
