document.addEventListener("change", async function(e) {
    if (e.target && e.target.id === "photoInput") {
        const input = e.target;
        if (input.files.length === 0) return;

        let formData = new FormData();
        formData.append("photo", input.files[0]);
        formData.append("csrfmiddlewaretoken", document.querySelector("[name=csrfmiddlewaretoken]").value);

        try {
            const response = await fetch("/add/", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();
            console.log("AI Result:", result);

            if (result.success && result.html) {
                // Inject prefilled form into modal
                const modalContent = document.querySelector("#dynamicModalContent");
                modalContent.innerHTML = result.html;

                // Rebind the form submit handler if needed
                attachFormHandler("/add/"); // make sure attachFormHandler is defined globally
            }

        } catch (err) {
            console.error("Error uploading photo:", err);
        }
    }
});
