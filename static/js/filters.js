function fetchCards(page = 1) {
    const search = document.querySelector("#mainSearchInput").value;
    const type = document.querySelector("#filterType").value;
    const rarity = document.querySelector("#filterRarity").value;
    const color = document.querySelector("#filterColor").value;
    const sort = document.querySelector("#sortBy").value;
    const per_page = document.querySelector("#itemsPerPage").value;

    const params = new URLSearchParams({
        search,
        type,
        rarity,
        color,
        sort,
        per_page,
        page
    });

    fetch("/filter_cards?search=abc", { headers: { "X-Requested-With": "XMLHttpRequest" } })
    .then(res => res.json())
    .then(data => {
        // Replace only tbody content
        document.querySelector("#cardsTbody").innerHTML = data.table_html;
    });
}

// Attach event listeners after DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    const elements = [
        "#mainSearchInput",
        "#filterType",
        "#filterRarity",
        "#filterColor",
        "#sortBy",
        "#itemsPerPage"
    ];

    elements.forEach(selector => {
        const el = document.querySelector(selector);
        if (el) el.addEventListener(el.tagName === "INPUT" ? "input" : "change", () => fetchCards());
    });
});
