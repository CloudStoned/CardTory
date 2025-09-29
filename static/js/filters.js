function getFilters() {
    return {
        search: document.querySelector("#mainSearchInput").value,
        type: document.querySelector("#filterType").value,
        rarity: document.querySelector("#filterRarity").value,
        color: document.querySelector("#filterColor").value,
        sort: document.querySelector("#sortBy").value,
        per_page: document.querySelector("#itemsPerPage").value,
        page: 1
    };
}

function filterCards() {
    const params = new URLSearchParams(getFilters()).toString();

    fetch(`/filter_cards/?${params}`, {
        headers: { "X-Requested-With": "XMLHttpRequest" }
    })
    .then(res => res.json())
    .then(data => {
        document.querySelector("#cardsTbody").innerHTML = data.table_html;
    })
    .catch(err => console.error(err));
}

// Attach event listeners
document.querySelector("#mainSearchInput").addEventListener("input", filterCards);
document.querySelector("#filterType").addEventListener("change", filterCards);
document.querySelector("#filterRarity").addEventListener("change", filterCards);
document.querySelector("#filterColor").addEventListener("change", filterCards);
document.querySelector("#sortBy").addEventListener("change", filterCards);
document.querySelector("#itemsPerPage").addEventListener("change", filterCards);
