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
        } catch (err) {
            console.error("Error uploading photo:", err);
        }
    }
});
