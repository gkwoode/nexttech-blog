// Search bar
const toggleSearchButton = document.getElementById('toggle-search-button');
const searchField = document.getElementById('search-field');
const searchInput = searchField.querySelector('input');

toggleSearchButton.addEventListener('click', () => {
    searchField.classList.toggle('hidden');
    searchInput.value = '';
    if (!searchField.classList.contains('hidden')) {
        searchField.focus();
    }
});

searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.trim().toLowerCase();
    performSearch(searchTerm);
});

function performSearch(searchTerm) {
    // const searchResults = document.getElementById('search-results');
    // const searchResultItems = searchResults.querySelectorAll('li');
    // searchResultItems.forEach(item => {
    //     const itemText = item.textContent.trim().toLowerCase();
    //     if (itemText.includes(searchTerm)) {
    //         item.classList.remove('hidden');
    //     } else {
    //         item.classList.add('hidden');
    //     }
    // });
}

// Responsive navigation menu
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');
mobileMenuButton.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
});

// Active link
const currentPath = window.location.pathname;
const links = document.querySelectorAll('.nav-link');
links.forEach(link => {
    const linkPath = link.getAttribute('href');
    if (currentPath === linkPath) {
        link.classList.add('active-link');
    }
});