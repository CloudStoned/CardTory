let cards = [];
let filtered = [];
let currentPage = 1;
let itemsPerPage = 10;
let currentSort = { key: 'name', dir: 'asc' };
let activeFilters = { search: '', type: '', rarity: '', set: '' };
let autoPrice = false;
let saveImages = true;

// Elements
const tbody = document.getElementById('cardsTbody');
const paginationEl = document.getElementById('pagination');
const pageInfoEl = document.getElementById('pageInfo');
const totalItemsEl = document.getElementById('totalItems');
const resultCountEl = document.getElementById('resultCount');
const alertsContainer = document.getElementById('alertsContainer');

const mainSearchInput = document.getElementById('mainSearchInput');
const navbarSearchInput = document.getElementById('navbarSearchInput');
const filterType = document.getElementById('filterType');
const filterRarity = document.getElementById('filterRarity');
const filterSet = document.getElementById('filterSet');
const sortBy = document.getElementById('sortBy');
const itemsPerPageSelect = document.getElementById('itemsPerPage');

const btnImport = document.getElementById('btnImport');
const btnExport = document.getElementById('btnExport');
const importFileInput = document.getElementById('importFileInput');
const btnRefreshPrices = document.getElementById('btnRefreshPrices');

// Modals instances
let detailModal, formModal, deleteModal;

// Charts
let chartByType, chartByRarity, chartValueOverTime;

document.addEventListener('DOMContentLoaded', () => {
    // Bootstrap tooltips
    [...document.querySelectorAll('[data-bs-toggle="tooltip"]')].forEach(el => new bootstrap.Tooltip(el));

    // Modal instances
    detailModal = new bootstrap.Modal(document.getElementById('cardDetailModal'));
    formModal = new bootstrap.Modal(document.getElementById('cardFormModal'));
    deleteModal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));

    document.getElementById('year').textContent = new Date().getFullYear();

    // Load preferences
    autoPrice = JSON.parse(localStorage.getItem('autoPrice') || 'false');
    saveImages = JSON.parse(localStorage.getItem('saveImages') || 'true');
    document.getElementById('toggleAutoPrice').checked = autoPrice;
    document.getElementById('toggleSaveImages').checked = saveImages;

    // Load data
    loadCards();

    // Populate filters and sidebar
    refreshFilters();
    renderSidebar();

    // Initial render
    applyFiltersAndRender();
    if (autoPrice) simulateRefreshPrices();

    // Wire up events
    wireUpNavigation();
    wireUpFilters();
    wireUpImportExport();
    wireUpForm();
    wireUpSettings();
    wireUpSearchSync();
    initCharts();
    refreshReports();
});

function wireUpNavigation() {
    document.querySelectorAll('[data-section]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('data-section');
        showSection(target);
        document.querySelectorAll('.navbar .nav-link').forEach(l => l.classList.remove('active'));
        if (link.classList.contains('nav-link')) link.classList.add('active');
    });
    });
    document.querySelectorAll('[data-filter-all]').forEach(el => {
    el.addEventListener('click', (e) => {
        e.preventDefault();
        activeFilters = { search: '', type: '', rarity: '', set: '' };
        mainSearchInput.value = '';
        navbarSearchInput.value = '';
        filterType.value = '';
        filterRarity.value = '';
        filterSet.value = '';
        applyFiltersAndRender();
        closeOffcanvasIfOpen();
    });
    });
}

function showSection(id) {
    ['inventorySection', 'reportsSection', 'settingsSection'].forEach(s => {
    document.getElementById(s).classList.add('d-none');
    });
    document.getElementById(id).classList.remove('d-none');
    if (id === 'reportsSection') {
    refreshReports();
    }
}

function wireUpFilters() {
    mainSearchInput.addEventListener('input', () => {
    activeFilters.search = mainSearchInput.value.trim();
    navbarSearchInput.value = mainSearchInput.value;
    currentPage = 1;
    applyFiltersAndRender();
    });
    document.getElementById('navbarSearchBtn').addEventListener('click', () => {
    activeFilters.search = navbarSearchInput.value.trim();
    mainSearchInput.value = navbarSearchInput.value;
    currentPage = 1;
    showSection('inventorySection');
    applyFiltersAndRender();
    });
    filterType.addEventListener('change', () => { activeFilters.type = filterType.value; currentPage = 1; applyFiltersAndRender(); });
    filterRarity.addEventListener('change', () => { activeFilters.rarity = filterRarity.value; currentPage = 1; applyFiltersAndRender(); });
    filterSet.addEventListener('change', () => { activeFilters.set = filterSet.value; currentPage = 1; applyFiltersAndRender(); });
    sortBy.addEventListener('change', () => {
    const [key, dir] = sortBy.value.split(':');
    currentSort = { key, dir };
    applyFiltersAndRender();
    });
    itemsPerPageSelect.addEventListener('change', () => {
    itemsPerPage = parseInt(itemsPerPageSelect.value, 10) || 10;
    currentPage = 1;
    applyFiltersAndRender();
    });

    btnRefreshPrices.addEventListener('click', () => simulateRefreshPrices(true));
}

function wireUpImportExport() {
    btnImport.addEventListener('click', () => importFileInput.click());
    btnExport.addEventListener('click', () => exportCSV(cards));
    importFileInput.addEventListener('change', handleImportFile);

    // Settings section buttons
    document.getElementById('settingsExport').addEventListener('click', () => exportCSV(cards));
    const settingsImportBtn = document.getElementById('settingsImport');
    const settingsImportFile = document.getElementById('settingsImportFile');
    settingsImportBtn.addEventListener('click', () => settingsImportFile.click());
    settingsImportFile.addEventListener('change', (e) => handleImportFile(e, true));
}

function wireUpForm() {
    const imageInput = document.getElementById('image');
    const imagePreview = document.getElementById('imagePreview');
    imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
        imagePreview.src = reader.result;
        imagePreview.classList.remove('d-none');
        };
        reader.readAsDataURL(file);
    } else {
        imagePreview.classList.add('d-none');
    }
    });

    const form = document.getElementById('cardForm');
    form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
        e.stopPropagation();
        form.classList.add('was-validated');
        return;
    }
    const card = await gatherFormData();
    if (!card) return;
    if (card.id) {
        const idx = cards.findIndex(c => c.id === card.id);
        if (idx > -1) {
        cards[idx] = { ...cards[idx], ...card, updatedAt: Date.now() };
        showAlert('Card updated successfully', 'success');
        }
    } else {
        card.id = crypto.randomUUID ? crypto.randomUUID() : 'id_' + Math.random().toString(36).slice(2);
        card.createdAt = Date.now();
        card.updatedAt = Date.now();
        cards.push(card);
        showAlert('Card added to inventory', 'success');
    }
    saveCards();
    formModal.hide();
    form.reset();
    form.classList.remove('was-validated');
    imagePreview.classList.add('d-none');
    refreshFilters();
    renderSidebar();
    applyFiltersAndRender();
    refreshReports();
    });

    document.getElementById('btnDetailDelete').addEventListener('click', () => {
    const id = document.getElementById('cardId').value || document.getElementById('btnDetailDelete').dataset.id;
    if (!id) return;
    prepareDelete(id);
    });

    document.getElementById('btnDetailEdit').addEventListener('click', () => {
    const id = document.getElementById('btnDetailEdit').dataset.id;
    if (!id) return;
    detailModal.hide();
    openEditForm(id);
    });

    document.getElementById('btnDetailRefreshPrice').addEventListener('click', () => {
    const id = document.getElementById('btnDetailRefreshPrice').dataset.id;
    const card = cards.find(c => c.id === id);
    if (card) {
        card.marketValue = simulatePrice(card.marketValue);
        card.updatedAt = Date.now();
        saveCards();
        showAlert('Price refreshed for ' + (card.name || 'card'), 'info');
        fillDetailModal(card);
        applyFiltersAndRender();
        refreshReports();
    }
    });

    document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
    const id = document.getElementById('confirmDeleteBtn').dataset.id;
    if (!id) return;
    cards = cards.filter(c => c.id !== id);
    saveCards();
    showAlert('Card deleted', 'warning');
    deleteModal.hide();
    detailModal.hide();
    applyFiltersAndRender();
    refreshFilters();
    renderSidebar();
    refreshReports();
    });
}

function wireUpSettings() {
    const toggleAutoPrice = document.getElementById('toggleAutoPrice');
    const toggleSaveImages = document.getElementById('toggleSaveImages');
    toggleAutoPrice.addEventListener('change', () => {
    autoPrice = toggleAutoPrice.checked;
    localStorage.setItem('autoPrice', JSON.stringify(autoPrice));
    showAlert('Preference saved: Auto price refresh ' + (autoPrice ? 'enabled' : 'disabled'), 'info');
    });
    toggleSaveImages.addEventListener('change', () => {
    saveImages = toggleSaveImages.checked;
    localStorage.setItem('saveImages', JSON.stringify(saveImages));
    showAlert('Preference saved: Save images ' + (saveImages ? 'enabled' : 'disabled'), 'info');
    });

    document.getElementById('btnClearData').addEventListener('click', () => {
    if (confirm('This will clear all stored cards. Continue?')) {
        localStorage.removeItem('cards');
        cards = sampleData(); // keep sample for demo usability
        saveCards();
        applyFiltersAndRender();
        refreshFilters();
        renderSidebar();
        refreshReports();
        showAlert('All data cleared and demo data restored.', 'warning');
    }
    });
}

function wireUpSearchSync() {
    navbarSearchInput.addEventListener('input', () => {
    mainSearchInput.value = navbarSearchInput.value;
    });
}

// Data persistence
function loadCards() {
    try {
    const raw = localStorage.getItem('cards');
    if (raw) {
        cards = JSON.parse(raw);
    } else {
        cards = sampleData();
        saveCards();
    }
    } catch (e) {
    cards = sampleData();
    saveCards();
    }
}

function saveCards() {
    localStorage.setItem('cards', JSON.stringify(cards));
}

// Sample data
function sampleData() {
    const now = Date.now();
    return [
    {
        id: 'demo1',
        name: 'Pikachu',
        type: 'Game Card',
        rarity: 'Common',
        set: 'Base Set',
        edition: '1st Edition',
        condition: 'Near Mint',
        quantity: 2,
        uniqueId: 'PK-001',
        barcode: '1234567890',
        purchasePrice: 2.50,
        marketValue: 5.00,
        description: 'Iconic electric-type Pokémon card.',
        imageDataUrl: 'https://via.placeholder.com/300x420.png?text=Pikachu',
        createdAt: now - 1000 * 60 * 60 * 24 * 30,
        updatedAt: now - 1000 * 60 * 60 * 24 * 7
    },
    {
        id: 'demo2',
        name: 'Michael Jordan Rookie',
        type: 'Sports Card',
        rarity: 'Ultra Rare',
        set: '1986-87 Fleer',
        edition: 'Rookie',
        condition: 'Excellent',
        quantity: 1,
        uniqueId: 'MJ-ROOK',
        barcode: '0987654321',
        purchasePrice: 1000.00,
        marketValue: 2500.00,
        description: 'Legendary rookie card.',
        imageDataUrl: 'https://via.placeholder.com/300x420.png?text=Jordan',
        createdAt: now - 1000 * 60 * 60 * 24 * 120,
        updatedAt: now - 1000 * 60 * 60 * 24 * 3
    },
    {
        id: 'demo3',
        name: 'Blue-Eyes White Dragon',
        type: 'Game Card',
        rarity: 'Secret Rare',
        set: 'LOB',
        edition: 'Unlimited',
        condition: 'Good',
        quantity: 3,
        uniqueId: 'BEWD-001',
        barcode: '',
        purchasePrice: 50.00,
        marketValue: 120.00,
        description: 'Powerful dragon card.',
        imageDataUrl: 'https://via.placeholder.com/300x420.png?text=Blue-Eyes',
        createdAt: now - 1000 * 60 * 60 * 24 * 60,
        updatedAt: now - 1000 * 60 * 60 * 24 * 1
    },
    {
        id: 'demo4',
        name: 'Charizard',
        type: 'Game Card',
        rarity: 'Rare',
        set: 'Base Set',
        edition: 'Shadowless',
        condition: 'Lightly Played',
        quantity: 1,
        uniqueId: 'CH-004',
        barcode: '',
        purchasePrice: 150.00,
        marketValue: 350.00,
        description: 'Fan-favorite fire-type card.',
        imageDataUrl: 'https://via.placeholder.com/300x420.png?text=Charizard',
        createdAt: now - 1000 * 60 * 60 * 24 * 10,
        updatedAt: now - 1000 * 60 * 60 * 24 * 2
    }
    ];
}

// Filters and rendering
function applyFiltersAndRender() {
    // Filter
    filtered = cards.filter(c => {
    const s = activeFilters.search.toLowerCase();
    const matchesSearch = !s || [c.name, c.type, c.rarity, c.set, c.edition, c.condition, c.uniqueId, c.barcode]
        .filter(Boolean)
        .some(val => String(val).toLowerCase().includes(s));
    const matchesType = !activeFilters.type || c.type === activeFilters.type;
    const matchesRarity = !activeFilters.rarity || c.rarity === activeFilters.rarity;
    const matchesSet = !activeFilters.set || c.set === activeFilters.set;
    return matchesSearch && matchesType && matchesRarity && matchesSet;
    });

    // Sort
    filtered.sort((a, b) => compareBy(a, b, currentSort.key, currentSort.dir));

    // Render table
    renderTable();

    // Render pagination
    renderPagination();

    // Update counts
    resultCountEl.textContent = filtered.length;
    totalItemsEl.textContent = filtered.length;
}

function compareBy(a, b, key, dir) {
    const v1 = a[key];
    const v2 = b[key];
    let res = 0;
    if (typeof v1 === 'number' && typeof v2 === 'number') {
    res = v1 - v2;
    } else {
    res = String(v1 || '').localeCompare(String(v2 || ''), undefined, { numeric: true, sensitivity: 'base' });
    }
    return dir === 'asc' ? res : -res;
}

function renderTable() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = filtered.slice(start, end);
    pageInfoEl.textContent = filtered.length ? `${start + 1}-${Math.min(end, filtered.length)}` : '0-0';

    tbody.innerHTML = pageItems.map(c => {
    const img = c.imageDataUrl || 'https://via.placeholder.com/80x112?text=No+Image';
    const valueFmt = toCurrency((c.marketValue || 0) * (c.quantity || 0));
    return `
        <tr>
        <td style="width:80px">
            <img src="${img}" class="card-thumb" alt="${escapeHtml(c.name)}">
        </td>
        <td>
            <div class="fw-semibold">${escapeHtml(c.name)}</div>
            <div class="small text-muted d-sm-none">${escapeHtml(c.type || '')} · ${escapeHtml(c.rarity || '')}</div>
            <div class="small text-muted d-none d-sm-block d-lg-none">${escapeHtml(c.set || '')}</div>
        </td>
        <td class="d-none d-md-table-cell">${escapeHtml(c.type || '')}</td>
        <td class="d-none d-md-table-cell">${escapeHtml(c.rarity || '')}</td>
        <td class="d-none d-lg-table-cell">${escapeHtml(c.edition || '')}</td>
        <td class="d-none d-lg-table-cell">${escapeHtml(c.condition || '')}</td>
        <td>${c.quantity || 0}</td>
        <td class="text-end d-none d-sm-table-cell">${valueFmt}</td>
        <td class="text-end">
            <div class="btn-group">
            <button class="btn btn-sm btn-outline-secondary" data-action="view" data-id="${c.id}"><i class="bi bi-eye"></i></button>
            <button class="btn btn-sm btn-outline-primary" data-action="edit" data-id="${c.id}"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${c.id}"><i class="bi bi-trash"></i></button>
            </div>
        </td>
        </tr>
    `;
    }).join('');

    // row actions
    tbody.querySelectorAll('button[data-action]').forEach(btn => {
    const id = btn.getAttribute('data-id');
    const action = btn.getAttribute('data-action');
    btn.addEventListener('click', () => {
        if (action === 'view') openDetail(id);
        if (action === 'edit') openEditForm(id);
        if (action === 'delete') prepareDelete(id);
    });
    });
}

function renderPagination() {
    const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const pages = [];
    const addPage = (p, label = p, disabled = false, active = false) => {
    pages.push(`
        <li class="page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}">
        <a class="page-link" href="#" data-page="${p}">${label}</a>
        </li>
    `);
    };
    addPage(currentPage - 1, '&laquo;', currentPage === 1);
    const windowSize = 5;
    const start = Math.max(1, currentPage - Math.floor(windowSize / 2));
    const end = Math.min(totalPages, start + windowSize - 1);
    for (let p = start; p <= end; p++) addPage(p, p, false, p === currentPage);
    addPage(currentPage + 1, '&raquo;', currentPage === totalPages);

    paginationEl.innerHTML = pages.join('');
    paginationEl.querySelectorAll('a.page-link').forEach(a => {
    a.addEventListener('click', (e) => {
        e.preventDefault();
        const p = parseInt(a.getAttribute('data-page'), 10);
        const totalPagesInner = Math.ceil(filtered.length / itemsPerPage) || 1;
        if (p >= 1 && p <= totalPagesInner) {
        currentPage = p;
        renderTable();
        renderPagination();
        }
    });
    });
}

// Detail
function openDetail(id) {
    const card = cards.find(c => c.id === id);
    if (!card) return;
    fillDetailModal(card);
    detailModal.show();
}

function fillDetailModal(c) {
    document.getElementById('detailImage').src = c.imageDataUrl || 'https://via.placeholder.com/300x420?text=No+Image';
    document.getElementById('detailName').textContent = c.name || '';
    document.getElementById('detailSubtitle').textContent = [c.set, c.edition].filter(Boolean).join(' • ');
    document.getElementById('detailType').textContent = c.type || '';
    document.getElementById('detailRarity').textContent = c.rarity || '';
    document.getElementById('detailEdition').textContent = c.edition || '';
    document.getElementById('detailCondition').textContent = c.condition || '';
    document.getElementById('detailQuantity').textContent = c.quantity || 0;
    document.getElementById('detailUniqueId').textContent = c.uniqueId || '-';
    document.getElementById('detailPurchasePrice').textContent = toCurrency(c.purchasePrice || 0);
    document.getElementById('detailMarketValue').textContent = toCurrency(c.marketValue || 0);
    document.getElementById('detailDescription').textContent = c.description || '-';

    document.getElementById('btnDetailDelete').dataset.id = c.id;
    document.getElementById('btnDetailEdit').dataset.id = c.id;
    document.getElementById('btnDetailRefreshPrice').dataset.id = c.id;
    document.getElementById('cardId').value = c.id; // For delete fallback
}

// Form helpers
function openEditForm(id) {
    const c = cards.find(card => card.id === id);
    if (!c) return;
    const form = document.getElementById('cardForm');
    form.reset();
    form.classList.remove('was-validated');
    document.getElementById('cardFormModalLabel').textContent = 'Edit Card';
    document.getElementById('cardId').value = c.id;
    document.getElementById('name').value = c.name || '';
    document.getElementById('type').value = c.type || '';
    document.getElementById('rarity').value = c.rarity || '';
    document.getElementById('set').value = c.set || '';
    document.getElementById('edition').value = c.edition || '';
    document.getElementById('condition').value = c.condition || 'Mint';
    document.getElementById('quantity').value = c.quantity || 1;
    document.getElementById('uniqueId').value = c.uniqueId || '';
    document.getElementById('barcode').value = c.barcode || '';
    document.getElementById('purchasePrice').value = c.purchasePrice ?? 0;
    document.getElementById('marketValue').value = c.marketValue ?? 0;
    document.getElementById('description').value = c.description || '';
    const imagePreview = document.getElementById('imagePreview');
    if (c.imageDataUrl) {
    imagePreview.src = c.imageDataUrl;
    imagePreview.classList.remove('d-none');
    } else {
    imagePreview.classList.add('d-none');
    }
    formModal.show();
}

async function gatherFormData() {
    const id = document.getElementById('cardId').value || null;
    const imageInput = document.getElementById('image');
    let imageDataUrl = null;

    if (imageInput.files && imageInput.files[0]) {
    imageDataUrl = await fileToDataUrl(imageInput.files[0]);
    } else if (id) {
    const existing = cards.find(c => c.id === id);
    if (existing) imageDataUrl = existing.imageDataUrl || null;
    }

    const data = {
    id,
    name: document.getElementById('name').value.trim(),
    type: document.getElementById('type').value,
    rarity: document.getElementById('rarity').value,
    set: document.getElementById('set').value.trim(),
    edition: document.getElementById('edition').value.trim(),
    condition: document.getElementById('condition').value,
    quantity: Math.max(1, parseInt(document.getElementById('quantity').value, 10) || 1),
    uniqueId: document.getElementById('uniqueId').value.trim(),
    barcode: document.getElementById('barcode').value.trim(),
    purchasePrice: parseFloat(document.getElementById('purchasePrice').value) || 0,
    marketValue: parseFloat(document.getElementById('marketValue').value) || 0,
    description: document.getElementById('description').value.trim(),
    imageDataUrl: saveImages ? imageDataUrl : null
    };
    return data;
}

function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
    });
}

// Delete
function prepareDelete(id) {
    const card = cards.find(c => c.id === id);
    if (!card) return;
    document.getElementById('deleteTargetName').textContent = card.name || 'this card';
    document.getElementById('confirmDeleteBtn').dataset.id = id;
    deleteModal.show();
}

// Import/Export CSV
function exportCSV(data) {
    const headers = ['id','name','type','rarity','set','edition','condition','quantity','uniqueId','barcode','purchasePrice','marketValue','description','imageDataUrl','createdAt','updatedAt'];
    const rows = [headers.join(',')].concat(
    data.map(c => headers.map(h => csvEscape(c[h])).join(','))
    );
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'card-inventory.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showAlert('Exported CSV successfully.', 'success');
}

function handleImportFile(e, fromSettings = false) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
    try {
        const imported = parseCSV(reader.result);
        if (imported.length === 0) throw new Error('No rows found');
        // Merge by id (update existing, add new)
        let added = 0, updated = 0;
        imported.forEach(row => {
        if (!row.id) row.id = crypto.randomUUID ? crypto.randomUUID() : 'id_' + Math.random().toString(36).slice(2);
        const idx = cards.findIndex(c => c.id === row.id);
        // sanitize fields
        row.quantity = parseInt(row.quantity, 10) || 1;
        row.purchasePrice = parseFloat(row.purchasePrice) || 0;
        row.marketValue = parseFloat(row.marketValue) || 0;
        row.createdAt = row.createdAt ? Number(row.createdAt) : Date.now();
        row.updatedAt = Date.now();
        if (!saveImages) row.imageDataUrl = null;

        if (idx > -1) {
            cards[idx] = { ...cards[idx], ...row };
            updated++;
        } else {
            cards.push(row);
            added++;
        }
        });
        saveCards();
        refreshFilters();
        renderSidebar();
        applyFiltersAndRender();
        refreshReports();
        showAlert(`Import complete. Added ${added}, Updated ${updated}.`, 'success');
    } catch (err) {
        console.error(err);
        showAlert('Import failed: ' + err.message, 'danger');
    }
    };
    reader.readAsText(file);
}

function parseCSV(text) {
    // Simple CSV parser supporting quoted fields
    const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim().length);
    if (lines.length < 2) return [];
    const headers = splitCSVLine(lines[0]);
    return lines.slice(1).map(line => {
    const cols = splitCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => obj[h] = cols[i] ?? '');
    return obj;
    });
}

function splitCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' ) {
        if (inQuotes && line[i+1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
    } else {
        current += char;
    }
    }
    result.push(current);
    return result;
}

function csvEscape(val) {
    if (val === null || val === undefined) return '';
    const s = String(val);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
}

// Filters dropdown options and sidebar
function refreshFilters() {
    const types = unique(cards.map(c => c.type).filter(Boolean)).sort();
    const rarities = unique(cards.map(c => c.rarity).filter(Boolean)).sort();
    const sets = unique(cards.map(c => c.set).filter(Boolean)).sort();

    setOptions(filterType, [''].concat(types));
    setOptions(filterRarity, [''].concat(rarities));
    setOptions(filterSet, [''].concat(sets));
}

function setOptions(select, values) {
    const prev = select.value;
    select.innerHTML = values.map(v => `<option value="${escapeHtml(v)}">${v || 'All'}</option>`).join('');
    if ([...select.options].some(o => o.value === prev)) select.value = prev;
}

function renderSidebar() {
    const types = unique(cards.map(c => c.type).filter(Boolean)).sort();
    const sets = unique(cards.map(c => c.set).filter(Boolean)).sort();

    const mkList = (arr, kind) => arr.map(v => `<a href="#" class="list-group-item list-group-item-action py-2" data-sidebar-${kind}="${escapeHtml(v)}">${escapeHtml(v)}</a>`).join('');

    const sidebarTypes = document.getElementById('sidebar-types');
    const sidebarSets = document.getElementById('sidebar-sets');
    const sidebarTypesMobile = document.getElementById('sidebar-types-mobile');
    const sidebarSetsMobile = document.getElementById('sidebar-sets-mobile');

    sidebarTypes.innerHTML = mkList(types, 'type');
    sidebarSets.innerHTML = mkList(sets, 'set');
    sidebarTypesMobile.innerHTML = mkList(types, 'type');
    sidebarSetsMobile.innerHTML = mkList(sets, 'set');

    document.querySelectorAll('[data-sidebar-type]').forEach(a => {
    a.addEventListener('click', (e) => {
        e.preventDefault();
        filterType.value = a.getAttribute('data-sidebar-type');
        activeFilters.type = filterType.value;
        currentPage = 1;
        applyFiltersAndRender();
        closeOffcanvasIfOpen();
    });
    });
    document.querySelectorAll('[data-sidebar-set]').forEach(a => {
    a.addEventListener('click', (e) => {
        e.preventDefault();
        filterSet.value = a.getAttribute('data-sidebar-set');
        activeFilters.set = filterSet.value;
        currentPage = 1;
        applyFiltersAndRender();
        closeOffcanvasIfOpen();
    });
    });
}

function closeOffcanvasIfOpen() {
    const el = document.getElementById('offcanvasSidebar');
    const instance = bootstrap.Offcanvas.getInstance(el);
    if (instance) instance.hide();
}

// Reports and charts
function initCharts() {
    const ctxType = document.getElementById('chartByType');
    const ctxRarity = document.getElementById('chartByRarity');
    const ctxValue = document.getElementById('chartValueOverTime');

    chartByType = new Chart(ctxType, {
    type: 'doughnut',
    data: { labels: [], datasets: [{ data: [], backgroundColor: palette() }] },
    options: { plugins: { legend: { position: 'bottom' } } }
    });

    chartByRarity = new Chart(ctxRarity, {
    type: 'bar',
    data: { labels: [], datasets: [{ label: 'Count', data: [], backgroundColor: palette(8) }] },
    options: { scales: { y: { beginAtZero: true } } }
    });

    chartValueOverTime = new Chart(ctxValue, {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'Total Value', data: [], fill: true, tension: .3, borderColor: '#0d6efd', backgroundColor: 'rgba(13,110,253,.15)' }] },
    options: { scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } }
    });
}

function refreshReports() {
    const totalUnique = cards.length;
    const totalQuantity = cards.reduce((sum, c) => sum + (c.quantity || 0), 0);
    const totalValue = cards.reduce((sum, c) => sum + (c.marketValue || 0) * (c.quantity || 0), 0);
    document.getElementById('reportTotalUnique').textContent = totalUnique;
    document.getElementById('reportTotalQuantity').textContent = totalQuantity;
    document.getElementById('reportTotalValue').textContent = toCurrency(totalValue);

    // By type
    const byTypeMap = groupCount(cards, 'type');
    chartByType.data.labels = Object.keys(byTypeMap);
    chartByType.data.datasets[0].data = Object.values(byTypeMap);
    chartByType.update();

    // By rarity
    const byRarityMap = groupCount(cards, 'rarity');
    chartByRarity.data.labels = Object.keys(byRarityMap);
    chartByRarity.data.datasets[0].data = Object.values(byRarityMap);
    chartByRarity.update();

    // Value over time (by month)
    const byMonth = {};
    cards.forEach(c => {
    const d = new Date(c.createdAt || Date.now());
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const val = (c.marketValue || 0) * (c.quantity || 0);
    byMonth[key] = (byMonth[key] || 0) + val;
    });
    const labels = Object.keys(byMonth).sort();
    const data = labels.map(k => Math.round(byMonth[k] * 100) / 100);
    chartValueOverTime.data.labels = labels;
    chartValueOverTime.data.datasets[0].data = data;
    chartValueOverTime.update();
}

function groupCount(arr, key) {
    return arr.reduce((map, c) => {
    const k = c[key] || 'Unknown';
    map[k] = (map[k] || 0) + 1;
    return map;
    }, {});
}

// Price simulation
function simulateRefreshPrices(showAlertMsg = false) {
    cards.forEach(c => {
    c.marketValue = simulatePrice(c.marketValue);
    c.updatedAt = Date.now();
    });
    saveCards();
    applyFiltersAndRender();
    refreshReports();
    if (showAlertMsg) showAlert('Prices refreshed for all cards (simulated).', 'info');
}

function simulatePrice(current) {
    const base = Number(current) || 0;
    const change = (Math.random() * 0.2 - 0.1); // -10% to +10%
    const updated = Math.max(0, base * (1 + change));
    return Math.round(updated * 100) / 100;
}

// Utils
function toCurrency(n) {
    return (n || n === 0) ? '$' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '$0.00';
}

function unique(arr) {
    return [...new Set(arr)];
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function showAlert(message, type = 'info', timeout = 3500) {
    const id = 'alert_' + Math.random().toString(36).slice(2);
    const el = document.createElement('div');
    el.id = id;
    el.className = `alert alert-${type} alert-dismissible fade show shadow-sm`;
    el.role = 'alert';
    el.innerHTML = `
    <div>${escapeHtml(message)}</div>
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    alertsContainer.appendChild(el);
    if (timeout) {
    setTimeout(() => {
        const alert = bootstrap.Alert.getOrCreateInstance(el);
        alert.close();
    }, timeout);
    }
}

// Event delegation for Add Card nav
document.getElementById('navAddCard')?.addEventListener('click', () => {
    const form = document.getElementById('cardForm');
    form.reset();
    document.getElementById('cardFormModalLabel').textContent = 'Add Card';
    document.getElementById('imagePreview').classList.add('d-none');
    document.getElementById('cardId').value = '';
    form.classList.remove('was-validated');
});