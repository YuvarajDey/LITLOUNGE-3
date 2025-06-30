// General JavaScript for LitLounge

document.addEventListener('DOMContentLoaded', function() {
    console.log('LITLOUNGE-3 JavaScript loaded');

    // --- Global Variables & Initial Setup ---
    let allBooksData = []; // Cache for all book data
    let currentUserData = null; // To store the logged-in user's data (simulated)

    // --- Global Helper Functions ---
    async function fetchAllBooks() {
        if (allBooksData.length === 0) { // Only fetch if not already loaded
            try {
                const response = await fetch('data/books.json');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                allBooksData = await response.json();
            } catch (error) {
                console.error("Failed to load books data:", error);
                allBooksData = []; // Ensure it's an array even on error
            }
        }
        return allBooksData;
    }

    async function fetchUserData(userId = "user1") { // Default to user1 for demo
        // In a real app, userId would come from session/auth
        if (!currentUserData || currentUserData.id !== userId) {
            try {
                const response = await fetch('data/users.json');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const users = await response.json();
                currentUserData = users.find(user => user.id === userId);
                if (!currentUserData) {
                    console.warn(`User with ID ${userId} not found. Using default empty user.`);
                    // Provide a default structure if user not found, to prevent errors
                    currentUserData = {
                        id: userId,
                        username: "Guest",
                        profileImage: "images/user_avatar_placeholder.png",
                        readingLists: { currentlyReading: [], favorites: [], wantToRead: [] },
                        library: { saved: [], rented: [], subscribed: [] },
                        preferences: { favoriteGenres: [], notifications: false, darkMode: false },
                        readingStats: { booksReadThisMonth: 0, pagesReadThisWeek: 0, readingStreak: "0 days" }
                    };
                }
            } catch (error) {
                console.error("Failed to load user data:", error);
                currentUserData = null;
            }
        }
        return currentUserData;
    }

    function createBookCard(book, linkToSinglePage = false) {
        const rating = typeof book.rating === 'number' ? book.rating.toFixed(1) : 'N/A';
        const badgeClass = book.accessBadge ? book.accessBadge.toLowerCase() : 'free';
        const linkStart = linkToSinglePage ? `<a href="single.html?id=${book.id}" class="book-card-link">` : '';
        const linkEnd = linkToSinglePage ? '</a>' : '';

        return `
            <div class="book-card" data-book-id="${book.id}">
                ${linkStart}
                <img src="${book.coverImage || 'images/placeholder_cover.png'}" alt="${book.title}" class="book-cover" onerror="this.onerror=null;this.src='images/placeholder_cover.png';">
                <h3 class="book-title">${book.title}</h3>
                ${linkEnd}
                <p class="book-author">${book.author}</p>
                <div class="rating">⭐ ${rating}</div>
                <span class="access-badge ${badgeClass}">${book.accessBadge}</span>
                <button class="add-to-list">Add to List</button>
            </div>
        `;
    }

    function createBookCardForStore(book) { // Also used by Dashboard
        const rating = typeof book.rating === 'number' ? book.rating.toFixed(1) : 'N/A';
        const badgeClass = book.accessBadge ? book.accessBadge.toLowerCase() : 'free';

        return `
            <div class="book-card" data-book-id="${book.id}">
                <a href="single.html?id=${book.id}" class="book-card-link">
                    <img src="${book.coverImage || 'images/placeholder_cover.png'}" alt="${book.title}" class="book-cover" onerror="this.onerror=null;this.src='images/placeholder_cover.png';">
                    <h3 class="book-title">${book.title}</h3>
                </a>
                <p class="book-author">${book.author}</p>
                <div class="rating">⭐ ${rating}</div>
                <span class="access-badge ${badgeClass}">${book.accessBadge}</span>
                <button class="add-to-list">Add to List</button>
            </div>
        `;
    }

    // --- Navigation Active State ---
    function updateActiveNav() {
        const currentPage = window.location.pathname.split("/").pop() || "index.html"; // Default to index.html if path is just "/"
        document.querySelectorAll('header nav a').forEach(link => {
            link.classList.remove('active-nav-main');
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active-nav-main');
            }
        });
    }


    // --- Homepage Specific Functions ---
    function initCarousel(carouselElement, carouselInnerElement) {
        if (!carouselElement || !carouselInnerElement || !carouselInnerElement.children.length) return;

        let currentIndex = 0;
        const items = Array.from(carouselInnerElement.children); // Convert HTMLCollection to Array
        const totalItems = items.length;
        if (totalItems === 0) return;

        let itemWidth = items[0].offsetWidth + parseInt(getComputedStyle(items[0]).marginRight) + parseInt(getComputedStyle(items[0]).marginLeft) ;

        const prevButton = document.createElement('button');
        prevButton.innerHTML = '&laquo;';
        prevButton.classList.add('carousel-prev-btn');
        Object.assign(prevButton.style, { position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: '10', padding: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', cursor: 'pointer' });


        const nextButton = document.createElement('button');
        nextButton.innerHTML = '&raquo;';
        nextButton.classList.add('carousel-next-btn');
        Object.assign(nextButton.style, { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: '10', padding: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', cursor: 'pointer' });

        carouselElement.appendChild(prevButton);
        carouselElement.appendChild(nextButton);

        function updateCarousel() {
            if (items.length === 0) return; // Prevent error if items are not yet loaded or empty
            itemWidth = items[0].offsetWidth + parseInt(getComputedStyle(items[0]).marginRight) + parseInt(getComputedStyle(items[0]).marginLeft);
            const containerWidth = carouselElement.offsetWidth;
            const itemsVisible = Math.floor(containerWidth / itemWidth) || 1; // Ensure at least 1 to avoid division by zero or NaN
            const maxIndex = totalItems > itemsVisible ? totalItems - itemsVisible : 0;

            if (currentIndex > maxIndex) currentIndex = maxIndex;
            if (currentIndex < 0) currentIndex = 0;

            const newTransformValue = -currentIndex * itemWidth;
            carouselInnerElement.style.transform = `translateX(${newTransformValue}px)`;
            prevButton.disabled = currentIndex === 0;
            nextButton.disabled = currentIndex === maxIndex;
        }

        prevButton.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateCarousel();
            }
        });

        nextButton.addEventListener('click', () => {
            const containerWidth = carouselElement.offsetWidth;
            const itemsVisible = Math.floor(containerWidth / itemWidth) || 1;
            if (currentIndex < totalItems - itemsVisible) {
                currentIndex++;
                updateCarousel();
            }
        });

        updateCarousel();
        window.addEventListener('resize', updateCarousel);
    }

    async function loadHomepageContent() {
        try {
            const books = await fetchAllBooks();

            const featuredCarouselEl = document.querySelector('#hero .carousel');
            const trendingGrid = document.getElementById('trending-grid');
            const editorsGrid = document.getElementById('editors-grid');
            const hotPressGrid = document.getElementById('hot-press-grid');
            const genreGrid = document.getElementById('genre-grid');
            const personalizedGrid = document.getElementById('personalized-grid');

            if (featuredCarouselEl) {
                const carouselInner = document.createElement('div');
                carouselInner.classList.add('carousel-inner');
                books.filter(b => b.featured).slice(0, 5).forEach(book => {
                    carouselInner.innerHTML += createBookCard(book, true);
                });
                featuredCarouselEl.innerHTML = '';
                featuredCarouselEl.appendChild(carouselInner);

                // Wait for images to load before initializing carousel to get correct item widths
                let images = carouselInner.querySelectorAll('img');
                let loadedImages = 0;
                if (images.length === 0) {
                    initCarousel(featuredCarouselEl, carouselInner); // No images, init directly
                } else {
                    images.forEach(img => {
                        if (img.complete) {
                            loadedImages++;
                        } else {
                            img.onload = img.onerror = () => {
                                loadedImages++;
                                if (loadedImages === images.length) {
                                    initCarousel(featuredCarouselEl, carouselInner);
                                }
                            };
                        }
                    });
                    if (loadedImages === images.length && images.length > 0) { // All images were already cached
                         initCarousel(featuredCarouselEl, carouselInner);
                    }
                }
            }

            if (trendingGrid) {
                trendingGrid.innerHTML = '';
                books.filter(b => b.trending).slice(0, 6).forEach(book => {
                    trendingGrid.innerHTML += createBookCard(book, true);
                });
            }

            if (editorsGrid) {
                editorsGrid.innerHTML = '';
                books.filter(b => b.editorsChoice).slice(0, 6).forEach(book => {
                    editorsGrid.innerHTML += createBookCard(book, true);
                });
            }

            if (hotPressGrid) {
                hotPressGrid.innerHTML = '';
                books.filter(b => b.hotOffPress).slice(0, 6).forEach(book => {
                    hotPressGrid.innerHTML += createBookCard(book, true);
                });
            }

            if (genreGrid) {
                genreGrid.innerHTML = '';
                const uniqueGenres = [...new Set(books.map(b => b.genre).filter(g => g))].slice(0, 6);
                uniqueGenres.forEach(genre => {
                    genreGrid.innerHTML += createGenreItem(genre);
                });
            }

            if (personalizedGrid) {
                personalizedGrid.innerHTML = '';
                books.filter(b => b.rating >= 4.5).slice(0, 3).forEach(book => {
                    personalizedGrid.innerHTML += createBookCard(book, true);
                });
            }

        } catch (error) {
            console.error("Failed to load books for homepage:", error);
            const grids = document.querySelectorAll('.book-grid, .carousel, .genre-grid');
            grids.forEach(grid => {
                if(grid) grid.innerHTML = `<p>Error loading content. Please try again later.</p>`;
            });
        }
    }

    function createGenreItem(genre) {
        return `
            <div class="genre-item" data-genre="${genre.toLowerCase()}">
                ${genre}
            </div>
        `;
    }

    // --- Single Book Page Specific Functions ---
    async function loadSingleBookPageContent() {
        const bookDetailContent = document.getElementById('book-detail-content');
        const relatedBooksGrid = document.getElementById('related-books-grid');
        if (!bookDetailContent || !relatedBooksGrid) return;

        const params = new URLSearchParams(window.location.search);
        const bookId = params.get('id');

        if (!bookId) {
            bookDetailContent.innerHTML = "<p>Book ID not provided. Cannot display details.</p>";
            relatedBooksGrid.innerHTML = "";
            return;
        }

        try {
            const books = await fetchAllBooks();

            const currentBook = books.find(book => book.id === bookId);

            if (!currentBook) {
                bookDetailContent.innerHTML = `<p>Book with ID ${bookId} not found.</p>`;
                relatedBooksGrid.innerHTML = "";
                return;
            }

            displayBookDetails(currentBook, bookDetailContent);
            displayRelatedBooks(currentBook, books, relatedBooksGrid);

        } catch (error) {
            console.error("Failed to load single book page content:", error);
            bookDetailContent.innerHTML = `<p>Error loading book details. Please try again later.</p>`;
            relatedBooksGrid.innerHTML = "";
        }
    }

    function displayBookDetails(book, container) {
        const rating = typeof book.rating === 'number' ? book.rating.toFixed(1) : 'N/A';
        const badgeClass = book.accessBadge ? book.accessBadge.toLowerCase() : 'free';

        let reviewsHTML = '<h3>Reviews</h3><div class="reviews-list">';
        if (book.reviews && book.reviews.length > 0) {
            book.reviews.forEach(review => {
                reviewsHTML += `
                    <div class="review-item">
                        <p class="review-user">${review.user || 'Anonymous'}</p>
                        <p class="review-rating">Rating: ${'⭐'.repeat(Math.round(review.rating || 0))} (${review.rating || 'N/A'})</p>
                        <p class="review-comment">${review.comment}</p>
                    </div>
                `;
            });
        } else {
            reviewsHTML += '<p>No reviews yet for this book.</p>';
        }
        reviewsHTML += '</div>';

        const authorBio = book.authorBio || `More information about ${book.author} is coming soon. This is a placeholder bio.`;

        container.innerHTML = `
            <div class="book-cover-container">
                <img src="${book.coverImage || 'images/placeholder_cover.png'}" alt="${book.title}" class="book-cover-high-res" onerror="this.onerror=null;this.src='images/placeholder_cover.png';">
            </div>
            <div class="book-info">
                <h2 class="book-main-title">${book.title}</h2>
                <p class="book-main-author">${book.author}
                    <a href="#" class="author-bio-link" data-author="${book.author}">(see bio)</a>
                </p>
                <span class="access-badge-single access-badge ${badgeClass}">${book.accessBadge}</span>
                <div class="rating" style="margin-bottom: 15px;">Overall Rating: ⭐ ${rating} (${book.reviews ? book.reviews.length : 0} reviews)</div>

                <p class="book-description">${book.description || 'No description available.'}</p>

                <div class="author-bio-section" style="display:none;">
                    <h3>About ${book.author}</h3>
                    <p class="author-bio-text">${authorBio}</p>
                </div>

                <div class="book-sample-preview">
                    <h3>Sample Preview</h3>
                    <div class="book-sample-preview-text">
                        ${book.sample || 'No sample available.'}
                    </div>
                </div>
                <div class="book-reviews">
                    ${reviewsHTML}
                </div>
                 <button class="add-to-list" data-book-id="${book.id}" style="margin-top: 20px; padding: 10px 15px;">Add to List</button>
            </div>
        `;

        const authorBioLink = container.querySelector('.author-bio-link');
        if(authorBioLink) {
            authorBioLink.addEventListener('click', (e) => {
                e.preventDefault();
                const bioSection = container.querySelector('.author-bio-section');
                if(bioSection) {
                    bioSection.style.display = bioSection.style.display === 'none' ? 'block' : 'none';
                }
            });
        }
    }

    function displayRelatedBooks(currentBook, allBooksParam, container) {
        container.innerHTML = '';
        const related = allBooksParam.filter(book =>
            book.genre === currentBook.genre && book.id !== currentBook.id
        ).slice(0, 4);

        if (related.length > 0) {
            related.forEach(book => {
                container.innerHTML += createBookCardForStore(book);
            });
        } else {
            const popularFallback = allBooksParam.filter(book => book.id !== currentBook.id && (book.rating || 0) >= 4.5).slice(0,4);
            if (popularFallback.length > 0) {
                 popularFallback.forEach(book => {
                    container.innerHTML += createBookCardForStore(book);
                });
            } else {
                container.innerHTML = '<p>No related books found at this time.</p>';
            }
        }
    }
    // --- End of Single Book Page Specific Functions ---

    // --- Store Page Specific Functions ---
    let allBooksStore = [];

    async function loadStorePageContent() {
        try {
            allBooksStore = await fetchAllBooks();
            populateStoreBooks(allBooksStore);
            populateGenreFilterStore(allBooksStore);
            setupStoreEventListeners();
        } catch (error) {
            console.error("Failed to load store page content:", error);
            const storeGrid = document.getElementById('store-book-grid');
            if (storeGrid) storeGrid.innerHTML = `<p>Error loading books. Please try again later.</p>`;
        }
    }

    function populateStoreBooks(booksToDisplay) {
        const storeGrid = document.getElementById('store-book-grid');
        if (!storeGrid) return;

        storeGrid.innerHTML = '';
        if (booksToDisplay.length === 0) {
            storeGrid.innerHTML = '<p>No books match your criteria.</p>';
            return;
        }
        booksToDisplay.forEach(book => {
            const bookCardHTML = createBookCardForStore(book);
            storeGrid.innerHTML += bookCardHTML;
        });
    }

    function populateGenreFilterStore(books) {
        const genreFilterList = document.getElementById('genre-filter-list');
        if (!genreFilterList) return;

        const uniqueGenres = [...new Set(books.map(book => book.genre).filter(g => g))].sort();
        genreFilterList.innerHTML = '';
        uniqueGenres.forEach(genre => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<label><input type="checkbox" name="genre" value="${genre.toLowerCase()}"> ${genre}</label>`;
            genreFilterList.appendChild(listItem);
        });
    }

    function setupStoreEventListeners() {
        const searchBar = document.getElementById('search-bar');
        const sortDropdown = document.getElementById('sort-dropdown');
        const applyFiltersBtn = document.getElementById('apply-filters-btn');
        const ratingFilter = document.getElementById('rating-filter');

        if (searchBar) {
            searchBar.addEventListener('input', performSearchAndFilterAndSort);
        }
        if (sortDropdown) {
            sortDropdown.addEventListener('change', performSearchAndFilterAndSort);
        }
        if (ratingFilter) {
            ratingFilter.addEventListener('change', performSearchAndFilterAndSort);
        }
        const genreFilterList = document.getElementById('genre-filter-list');
        if (genreFilterList) {
             genreFilterList.addEventListener('change', function(event) {
                if (event.target.name === 'genre' && event.target.type === 'checkbox') {
                    performSearchAndFilterAndSort();
                }
            });
        }
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', performSearchAndFilterAndSort);
        }
    }

    function performSearchAndFilterAndSort() {
        let filteredBooks = [...allBooksStore];

        const searchTerm = document.getElementById('search-bar')?.value.toLowerCase() || '';
        if (searchTerm) {
            filteredBooks = filteredBooks.filter(book =>
                book.title.toLowerCase().includes(searchTerm) ||
                book.author.toLowerCase().includes(searchTerm) ||
                (book.genre && book.genre.toLowerCase().includes(searchTerm))
            );
        }

        const selectedGenres = Array.from(document.querySelectorAll('#genre-filter-list input[name="genre"]:checked'))
                                    .map(cb => cb.value);
        if (selectedGenres.length > 0) {
            filteredBooks = filteredBooks.filter(book => book.genre && selectedGenres.includes(book.genre.toLowerCase()));
        }

        const minRating = parseFloat(document.getElementById('rating-filter')?.value || '0');
        if (minRating > 0) {
            filteredBooks = filteredBooks.filter(book => book.rating !== undefined && book.rating >= minRating);
        }

        const sortBy = document.getElementById('sort-dropdown')?.value || 'newest';
        switch (sortBy) {
            case 'popular':
                filteredBooks.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'title-asc':
                filteredBooks.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'title-desc':
                filteredBooks.sort((a, b) => b.title.localeCompare(a.title));
                break;
            case 'newest':
            default:
                 filteredBooks.sort((a, b) => parseInt(b.id || 0) - parseInt(a.id || 0));
                break;
        }
        populateStoreBooks(filteredBooks);
    }
    // --- End of Store Page Specific Functions ---

    // --- Charts Page Specific Functions ---
    async function loadChartsPageContent() {
        const readersChoiceList = document.getElementById('readers-choice-list');
        const criticsPicksList = document.getElementById('critics-picks-list');
        const timelessClassicsList = document.getElementById('timeless-classics-list');

        if (!readersChoiceList || !criticsPicksList || !timelessClassicsList) {
            console.warn("One or more chart list containers not found on charts page.");
            return;
        }

        try {
            let booksData = await fetchAllBooks(); // Ensure books are loaded

            if (booksData.length === 0) {
                throw new Error("No books data available to populate charts.");
            }

            // Reader's Choice: Highly rated (e.g., top 5 by rating)
            const readersChoiceBooks = [...booksData].sort((a,b) => (b.rating || 0) - (a.rating || 0)).slice(0, 5);
            populateChartList(readersChoiceBooks, readersChoiceList, true, "Reader's Choice");

            // Critic's Picks: Books flagged as "editorsChoice" (e.g., top 5)
            const criticsPicksBooks = booksData.filter(b => b.editorsChoice === true).slice(0, 5);
            populateChartList(criticsPicksBooks, criticsPicksList, false, "Critic's Pick");

            // Timeless Classics: (Simulated) e.g., older books (lower ID) with good ratings (e.g. >= 4.0)
            const timelessClassicsBooks = [...booksData]
                                            .filter(b => (b.rating || 0) >= 4.0)
                                            .sort((a,b) => parseInt(a.id || '9999') - parseInt(b.id || '9999'))
                                            .slice(0, 5);
            populateChartList(timelessClassicsBooks, timelessClassicsList, false, "Timeless Classic");

            setupChartsEventListeners();

        } catch (error) {
            console.error("Failed to load charts page content:", error);
            if(readersChoiceList) readersChoiceList.innerHTML = `<p>Error loading Reader's Choice: ${error.message}</p>`;
            if(criticsPicksList) criticsPicksList.innerHTML = `<p>Error loading Critic's Picks: ${error.message}</p>`;
            if(timelessClassicsList) timelessClassicsList.innerHTML = `<p>Error loading Timeless Classics: ${error.message}</p>`;
        }
    }

    function populateChartList(books, container, showVoting, chartNameForTooltip) {
        container.innerHTML = '';
        if (!books || books.length === 0) {
            container.innerHTML = `<p>No books to display in the ${chartNameForTooltip} chart currently.</p>`;
            return;
        }
        books.forEach((book, index) => {
            container.innerHTML += createChartItem(book, index + 1, showVoting, chartNameForTooltip);
        });
    }

    function createChartItem(book, rank, showVoting, chartNameForTooltip) {
        const voteButtonHTML = showVoting ? `<button class="vote-button" data-book-id="${book.id}" aria-label="Vote for ${book.title}">Vote</button>` : '';
        const shareButtonHTML = `<a href="#" class="share-button" data-book-id="${book.id}" title="Share ${book.title}" aria-label="Share ${book.title}">Share</a>`;
        const tooltipText = `${chartNameForTooltip} - Rank #${rank}: ${book.title}`;
        const tooltipSpanHTML = `<span class="tooltip-text">${tooltipText}</span>`;


        return `
            <div class="chart-item" data-book-id="${book.id}">
                <span class="chart-item-rank" title="${tooltipText}" aria-label="Rank ${rank}">${rank}</span>
                <img src="${book.coverImage || 'images/placeholder_cover.png'}" alt="Cover of ${book.title}" class="chart-item-cover" onerror="this.src='images/placeholder_cover.png'; this.alt='Placeholder cover image';">
                <div class="chart-item-info">
                    <h3><a href="single.html?id=${book.id}">${book.title}</a></h3>
                    <p>by ${book.author}</p>
                    <div class="rating">⭐ ${typeof book.rating === 'number' ? book.rating.toFixed(1) : 'N/A'}</div>
                </div>
                <div class="chart-item-actions">
                    ${voteButtonHTML}
                    ${shareButtonHTML}
                </div>
                ${tooltipSpanHTML}
            </div>
        `;
    }

    function setupChartsEventListeners() {
        const chartsPageContainer = document.querySelector('.charts-page');
        if (!chartsPageContainer) return;

        chartsPageContainer.addEventListener('click', function(event) {
            const target = event.target;

            if (target.classList.contains('vote-button') && !target.disabled) {
                const bookId = target.dataset.bookId;
                console.log(`Vote cast for book ID: ${bookId} (dummy action)`);
                target.textContent = 'Voted!';
                target.classList.add('voted');
                target.disabled = true;
                alert(`You voted for Book ID ${bookId}! (This is a dummy action)`);
            }

            if (target.classList.contains('share-button')) {
                event.preventDefault();
                const bookId = target.dataset.bookId;
                const chartItem = target.closest('.chart-item');
                let bookTitle = 'this book';
                if (chartItem) {
                    const titleElement = chartItem.querySelector('.chart-item-info h3 a');
                    if (titleElement) bookTitle = titleElement.textContent;
                }
                console.log(`Share button clicked for book ID: ${bookId} - ${bookTitle} (dummy action)`);
                alert(`Share '${bookTitle}' (ID: ${bookId}) - (Dummy link, no actual sharing implemented)`);
            }
        });
    }
    // --- End of Charts Page Specific Functions ---

    // --- Single Book Page Specific Functions ---
>>>>>>> REPLACE
```
```javascript
document.addEventListener('DOMContentLoaded', function() {
    console.log('LITLOUNGE-3 JavaScript loaded');

    // --- Global Variables & Initial Setup ---
    let allBooksData = []; // Cache for all book data
    let currentUserData = null; // To store the logged-in user's data (simulated)

    // --- Global Helper Functions ---
    async function fetchAllBooks() {
        if (allBooksData.length === 0) { // Only fetch if not already loaded
            try {
                const response = await fetch('data/books.json');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                allBooksData = await response.json();
            } catch (error) {
                console.error("Failed to load books data:", error);
                allBooksData = []; // Ensure it's an array even on error
            }
        }
        return allBooksData;
    }

    async function fetchUserData(userId = "user1") { // Default to user1 for demo
        // In a real app, userId would come from session/auth
        if (!currentUserData || currentUserData.id !== userId) {
            try {
                const response = await fetch('data/users.json');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const users = await response.json();
                currentUserData = users.find(user => user.id === userId);
                if (!currentUserData) {
                    console.warn(`User with ID ${userId} not found. Using default empty user.`);
                    // Provide a default structure if user not found, to prevent errors
                    currentUserData = {
                        id: userId,
                        username: "Guest",
                        profileImage: "images/user_avatar_placeholder.png",
                        readingLists: { currentlyReading: [], favorites: [], wantToRead: [] },
                        library: { saved: [], rented: [], subscribed: [] },
                        preferences: { favoriteGenres: [], notifications: false, darkMode: false },
                        readingStats: { booksReadThisMonth: 0, pagesReadThisWeek: 0, readingStreak: "0 days" }
                    };
                }
            } catch (error) {
                console.error("Failed to load user data:", error);
                currentUserData = null;
            }
        }
        return currentUserData;
    }

    function createBookCard(book, linkToSinglePage = false) {
        const rating = typeof book.rating === 'number' ? book.rating.toFixed(1) : 'N/A';
        const badgeClass = book.accessBadge ? book.accessBadge.toLowerCase() : 'free';
        const linkStart = linkToSinglePage ? `<a href="single.html?id=${book.id}" class="book-card-link">` : '';
        const linkEnd = linkToSinglePage ? '</a>' : '';

        return `
            <div class="book-card" data-book-id="${book.id}">
                ${linkStart}
                <img src="${book.coverImage || 'images/placeholder_cover.png'}" alt="${book.title}" class="book-cover" onerror="this.onerror=null;this.src='images/placeholder_cover.png';">
                <h3 class="book-title">${book.title}</h3>
                ${linkEnd}
                <p class="book-author">${book.author}</p>
                <div class="rating">⭐ ${rating}</div>
                <span class="access-badge ${badgeClass}">${book.accessBadge}</span>
                <button class="add-to-list">Add to List</button>
            </div>
        `;
    }

    // Modified book card for store/dashboard where links are always needed
    function createBookCardForStore(book) {
        const rating = typeof book.rating === 'number' ? book.rating.toFixed(1) : 'N/A';
        const badgeClass = book.accessBadge ? book.accessBadge.toLowerCase() : 'free';

        return `
            <div class="book-card" data-book-id="${book.id}">
                <a href="single.html?id=${book.id}" class="book-card-link">
                    <img src="${book.coverImage || 'images/placeholder_cover.png'}" alt="${book.title}" class="book-cover" onerror="this.onerror=null;this.src='images/placeholder_cover.png';">
                    <h3 class="book-title">${book.title}</h3>
                </a>
                <p class="book-author">${book.author}</p>
                <div class="rating">⭐ ${rating}</div>
                <span class="access-badge ${badgeClass}">${book.accessBadge}</span>
                <button class="add-to-list">Add to List</button>
            </div>
        `;
    }

    // --- Navigation Active State ---
    function updateActiveNav() {
        const currentPage = window.location.pathname.split("/").pop() || "index.html"; // Default to index.html if path is just "/"
        document.querySelectorAll('header nav a').forEach(link => {
            link.classList.remove('active-nav-main');
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active-nav-main');
            }
        });
    }


    // --- Homepage Specific Functions ---
    function initCarousel(carouselElement, carouselInnerElement) {
        if (!carouselElement || !carouselInnerElement || !carouselInnerElement.children.length) return;

        let currentIndex = 0;
        const items = Array.from(carouselInnerElement.children); // Convert HTMLCollection to Array
        const totalItems = items.length;
        if (totalItems === 0) return;

        let itemWidth = items[0].offsetWidth + parseInt(getComputedStyle(items[0]).marginRight) + parseInt(getComputedStyle(items[0]).marginLeft) ;

        const prevButton = document.createElement('button');
        prevButton.innerHTML = '&laquo;';
        prevButton.classList.add('carousel-prev-btn');
        Object.assign(prevButton.style, { position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: '10', padding: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', cursor: 'pointer' });


        const nextButton = document.createElement('button');
        nextButton.innerHTML = '&raquo;';
        nextButton.classList.add('carousel-next-btn');
        Object.assign(nextButton.style, { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: '10', padding: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', cursor: 'pointer' });

        carouselElement.appendChild(prevButton);
        carouselElement.appendChild(nextButton);

        function updateCarousel() {
            if (items.length === 0) return; // Prevent error if items are not yet loaded or empty
            itemWidth = items[0].offsetWidth + parseInt(getComputedStyle(items[0]).marginRight) + parseInt(getComputedStyle(items[0]).marginLeft);
            const containerWidth = carouselElement.offsetWidth;
            const itemsVisible = Math.floor(containerWidth / itemWidth) || 1; // Ensure at least 1 to avoid division by zero or NaN
            const maxIndex = totalItems > itemsVisible ? totalItems - itemsVisible : 0;

            if (currentIndex > maxIndex) currentIndex = maxIndex;
            if (currentIndex < 0) currentIndex = 0;

            const newTransformValue = -currentIndex * itemWidth;
            carouselInnerElement.style.transform = `translateX(${newTransformValue}px)`;
            prevButton.disabled = currentIndex === 0;
            nextButton.disabled = currentIndex === maxIndex;
        }

        prevButton.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateCarousel();
            }
        });

        nextButton.addEventListener('click', () => {
            const containerWidth = carouselElement.offsetWidth;
            const itemsVisible = Math.floor(containerWidth / itemWidth) || 1;
            if (currentIndex < totalItems - itemsVisible) {
                currentIndex++;
                updateCarousel();
            }
        });

        updateCarousel();
        window.addEventListener('resize', updateCarousel);
    }

    async function loadHomepageContent() {
        try {
            const books = await fetchAllBooks(); // Use global fetchAllBooks

            const featuredCarouselEl = document.querySelector('#hero .carousel');
            const trendingGrid = document.getElementById('trending-grid');
            const editorsGrid = document.getElementById('editors-grid');
            const hotPressGrid = document.getElementById('hot-press-grid');
            const genreGrid = document.getElementById('genre-grid');
            const personalizedGrid = document.getElementById('personalized-grid');


            if (featuredCarouselEl) {
                const carouselInner = document.createElement('div');
                carouselInner.classList.add('carousel-inner');
                books.filter(b => b.featured).slice(0, 5).forEach(book => {
                    carouselInner.innerHTML += createBookCard(book, true);
                });
                featuredCarouselEl.innerHTML = '';
                featuredCarouselEl.appendChild(carouselInner);

                // Ensure images are loaded before initializing carousel to get correct item widths
                let images = carouselInner.querySelectorAll('img');
                let loadedImages = 0;
                if (images.length === 0) {
                    initCarousel(featuredCarouselEl, carouselInner); // No images, init directly
                } else {
                    images.forEach(img => {
                        if (img.complete) {
                            loadedImages++;
                        } else {
                            img.onload = img.onerror = () => {
                                loadedImages++;
                                if (loadedImages === images.length) {
                                    initCarousel(featuredCarouselEl, carouselInner);
                                }
                            };
                        }
                    });
                    if (loadedImages === images.length && images.length > 0) { // All images were already cached
                         initCarousel(featuredCarouselEl, carouselInner);
                    }
                }
            }

            if (trendingGrid) {
                trendingGrid.innerHTML = '';
                books.filter(b => b.trending).slice(0, 6).forEach(book => {
                    trendingGrid.innerHTML += createBookCard(book, true);
                });
            }

            if (editorsGrid) {
                editorsGrid.innerHTML = '';
                books.filter(b => b.editorsChoice).slice(0, 6).forEach(book => {
                    editorsGrid.innerHTML += createBookCard(book, true);
                });
            }

            if (hotPressGrid) {
                hotPressGrid.innerHTML = '';
                books.filter(b => b.hotOffPress).slice(0, 6).forEach(book => {
                    hotPressGrid.innerHTML += createBookCard(book, true);
                });
            }

            if (genreGrid) {
                genreGrid.innerHTML = '';
                const uniqueGenres = [...new Set(books.map(b => b.genre).filter(g => g))].slice(0, 6);
                uniqueGenres.forEach(genre => {
                    genreGrid.innerHTML += createGenreItem(genre);
                });
            }

            if (personalizedGrid) {
                personalizedGrid.innerHTML = '';
                books.filter(b => b.rating >= 4.5).slice(0, 3).forEach(book => {
                    personalizedGrid.innerHTML += createBookCard(book, true);
                });
            }

        } catch (error) {
            console.error("Failed to load books for homepage:", error);
            const grids = document.querySelectorAll('.book-grid, .carousel, .genre-grid');
            grids.forEach(grid => {
                if(grid) grid.innerHTML = `<p>Error loading content. Please try again later.</p>`;
            });
        }
    }

    function createGenreItem(genre) {
        return `
            <div class="genre-item" data-genre="${genre.toLowerCase()}">
                ${genre}
            </div>
        `;
    }

    // --- Single Book Page Specific Functions ---
    async function loadSingleBookPageContent() {
        const bookDetailContent = document.getElementById('book-detail-content');
        const relatedBooksGrid = document.getElementById('related-books-grid');
        if (!bookDetailContent || !relatedBooksGrid) return;

        const params = new URLSearchParams(window.location.search);
        const bookId = params.get('id');

        if (!bookId) {
            bookDetailContent.innerHTML = "<p>Book ID not provided. Cannot display details.</p>";
            relatedBooksGrid.innerHTML = "";
            return;
        }

        try {
            const books = await fetchAllBooks();

            const currentBook = books.find(book => book.id === bookId);

            if (!currentBook) {
                bookDetailContent.innerHTML = `<p>Book with ID ${bookId} not found.</p>`;
                relatedBooksGrid.innerHTML = "";
                return;
            }

            displayBookDetails(currentBook, bookDetailContent);
            displayRelatedBooks(currentBook, books, relatedBooksGrid);

        } catch (error) {
            console.error("Failed to load single book page content:", error);
            bookDetailContent.innerHTML = `<p>Error loading book details. Please try again later.</p>`;
            relatedBooksGrid.innerHTML = "";
        }
    }

    function displayBookDetails(book, container) {
        const rating = typeof book.rating === 'number' ? book.rating.toFixed(1) : 'N/A';
        const badgeClass = book.accessBadge ? book.accessBadge.toLowerCase() : 'free';

        let reviewsHTML = '<h3>Reviews</h3><div class="reviews-list">';
        if (book.reviews && book.reviews.length > 0) {
            book.reviews.forEach(review => {
                reviewsHTML += `
                    <div class="review-item">
                        <p class="review-user">${review.user || 'Anonymous'}</p>
                        <p class="review-rating">Rating: ${'⭐'.repeat(Math.round(review.rating || 0))} (${review.rating || 'N/A'})</p>
                        <p class="review-comment">${review.comment}</p>
                    </div>
                `;
            });
        } else {
            reviewsHTML += '<p>No reviews yet for this book.</p>';
        }
        reviewsHTML += '</div>';

        const authorBio = book.authorBio || `More information about ${book.author} is coming soon. This is a placeholder bio.`;

        container.innerHTML = `
            <div class="book-cover-container">
                <img src="${book.coverImage || 'images/placeholder_cover.png'}" alt="${book.title}" class="book-cover-high-res" onerror="this.onerror=null;this.src='images/placeholder_cover.png';">
            </div>
            <div class="book-info">
                <h2 class="book-main-title">${book.title}</h2>
                <p class="book-main-author">${book.author}
                    <a href="#" class="author-bio-link" data-author="${book.author}">(see bio)</a>
                </p>
                <span class="access-badge-single access-badge ${badgeClass}">${book.accessBadge}</span>
                <div class="rating" style="margin-bottom: 15px;">Overall Rating: ⭐ ${rating} (${book.reviews ? book.reviews.length : 0} reviews)</div>

                <p class="book-description">${book.description || 'No description available.'}</p>

                <div class="author-bio-section" style="display:none;">
                    <h3>About ${book.author}</h3>
                    <p class="author-bio-text">${authorBio}</p>
                </div>

                <div class="book-sample-preview">
                    <h3>Sample Preview</h3>
                    <div class="book-sample-preview-text">
                        ${book.sample || 'No sample available.'}
                    </div>
                </div>
                <div class="book-reviews">
                    ${reviewsHTML}
                </div>
                 <button class="add-to-list" data-book-id="${book.id}" style="margin-top: 20px; padding: 10px 15px;">Add to List</button>
                 <!-- Add more buttons like "Read Now", "Rent", "Buy" as needed -->
            </div>
        `;

        const authorBioLink = container.querySelector('.author-bio-link');
        if(authorBioLink) {
            authorBioLink.addEventListener('click', (e) => {
                e.preventDefault();
                const bioSection = container.querySelector('.author-bio-section');
                if(bioSection) {
                    bioSection.style.display = bioSection.style.display === 'none' ? 'block' : 'none';
                }
            });
        }
    }

    function displayRelatedBooks(currentBook, allBooksParam, container) {
        container.innerHTML = '';
        const related = allBooksParam.filter(book =>
            book.genre === currentBook.genre && book.id !== currentBook.id
        ).slice(0, 4);

        if (related.length > 0) {
            related.forEach(book => {
                // Using createBookCardForStore to ensure related books also link to their single pages
                container.innerHTML += createBookCardForStore(book);
            });
        } else {
            const popularFallback = allBooksParam.filter(book => book.id !== currentBook.id && (book.rating || 0) >= 4.5).slice(0,4);
            if (popularFallback.length > 0) {
                 popularFallback.forEach(book => {
                    container.innerHTML += createBookCardForStore(book);
                });
            } else {
                container.innerHTML = '<p>No related books found at this time.</p>';
            }
        }
    }
    // --- End of Single Book Page Specific Functions ---

    // --- Store Page Specific Functions ---
    let allBooksStore = []; // To store all books fetched for client-side filtering/sorting on store page

    async function loadStorePageContent() {
        try {
            allBooksStore = await fetchAllBooks();
            populateStoreBooks(allBooksStore);
            populateGenreFilterStore(allBooksStore);
            setupStoreEventListeners();
        } catch (error) {
            console.error("Failed to load store page content:", error);
            const storeGrid = document.getElementById('store-book-grid');
            if (storeGrid) storeGrid.innerHTML = `<p>Error loading books. Please try again later.</p>`;
        }
    }

    function populateStoreBooks(booksToDisplay) {
        const storeGrid = document.getElementById('store-book-grid');
        if (!storeGrid) return;

        storeGrid.innerHTML = '';
        if (booksToDisplay.length === 0) {
            storeGrid.innerHTML = '<p>No books match your criteria.</p>';
            return;
        }
        booksToDisplay.forEach(book => {
            const bookCardHTML = createBookCardForStore(book);
            storeGrid.innerHTML += bookCardHTML;
        });
    }

    function populateGenreFilterStore(books) {
        const genreFilterList = document.getElementById('genre-filter-list');
        if (!genreFilterList) return;

        const uniqueGenres = [...new Set(books.map(book => book.genre).filter(g => g))].sort();
        genreFilterList.innerHTML = '';
        uniqueGenres.forEach(genre => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<label><input type="checkbox" name="genre" value="${genre.toLowerCase()}"> ${genre}</label>`;
            genreFilterList.appendChild(listItem);
        });
    }

    function setupStoreEventListeners() {
        const searchBar = document.getElementById('search-bar');
        const sortDropdown = document.getElementById('sort-dropdown');
        const applyFiltersBtn = document.getElementById('apply-filters-btn');
        const ratingFilter = document.getElementById('rating-filter');

        if (searchBar) {
            searchBar.addEventListener('input', performSearchAndFilterAndSort);
        }
        if (sortDropdown) {
            sortDropdown.addEventListener('change', performSearchAndFilterAndSort);
        }
        if (ratingFilter) {
            ratingFilter.addEventListener('change', performSearchAndFilterAndSort);
        }
        const genreFilterList = document.getElementById('genre-filter-list');
        if (genreFilterList) {
             genreFilterList.addEventListener('change', function(event) {
                if (event.target.name === 'genre' && event.target.type === 'checkbox') {
                    performSearchAndFilterAndSort();
                }
            });
        }
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', performSearchAndFilterAndSort);
        }
    }

    function performSearchAndFilterAndSort() {
        let filteredBooks = [...allBooksStore];

        const searchTerm = document.getElementById('search-bar')?.value.toLowerCase() || '';
        if (searchTerm) {
            filteredBooks = filteredBooks.filter(book =>
                book.title.toLowerCase().includes(searchTerm) ||
                book.author.toLowerCase().includes(searchTerm) ||
                (book.genre && book.genre.toLowerCase().includes(searchTerm))
            );
        }

        const selectedGenres = Array.from(document.querySelectorAll('#genre-filter-list input[name="genre"]:checked'))
                                    .map(cb => cb.value);
        if (selectedGenres.length > 0) {
            filteredBooks = filteredBooks.filter(book => book.genre && selectedGenres.includes(book.genre.toLowerCase()));
        }

        const minRating = parseFloat(document.getElementById('rating-filter')?.value || '0');
        if (minRating > 0) {
            filteredBooks = filteredBooks.filter(book => book.rating !== undefined && book.rating >= minRating);
        }

        const sortBy = document.getElementById('sort-dropdown')?.value || 'newest';
        switch (sortBy) {
            case 'popular':
                filteredBooks.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'title-asc':
                filteredBooks.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'title-desc':
                filteredBooks.sort((a, b) => b.title.localeCompare(a.title));
                break;
            case 'newest':
            default:
                 filteredBooks.sort((a, b) => parseInt(b.id || 0) - parseInt(a.id || 0));
                break;
        }
        populateStoreBooks(filteredBooks);
    }
    // --- End of Store Page Specific Functions ---

    // --- Charts Page Specific Functions ---
    async function loadChartsPageContent() {
        const readersChoiceList = document.getElementById('readers-choice-list');
        const criticsPicksList = document.getElementById('critics-picks-list');
        const timelessClassicsList = document.getElementById('timeless-classics-list');

        if (!readersChoiceList || !criticsPicksList || !timelessClassicsList) {
            console.warn("One or more chart list containers not found on charts page.");
            return;
        }

        try {
            let booksData = await fetchAllBooks(); // Ensure books are loaded

            if (booksData.length === 0) {
                throw new Error("No books data available to populate charts.");
            }

            // Reader's Choice: Highly rated (e.g., top 5 by rating)
            const readersChoiceBooks = [...booksData].sort((a,b) => (b.rating || 0) - (a.rating || 0)).slice(0, 5);
            populateChartList(readersChoiceBooks, readersChoiceList, true, "Reader's Choice");

            // Critic's Picks: Books flagged as "editorsChoice" (e.g., top 5)
            const criticsPicksBooks = booksData.filter(b => b.editorsChoice === true).slice(0, 5);
            populateChartList(criticsPicksBooks, criticsPicksList, false, "Critic's Pick");

            // Timeless Classics: (Simulated) e.g., older books (lower ID) with good ratings (e.g. >= 4.0)
            const timelessClassicsBooks = [...booksData]
                                            .filter(b => (b.rating || 0) >= 4.0)
                                            .sort((a,b) => parseInt(a.id || '9999') - parseInt(b.id || '9999'))
                                            .slice(0, 5);
            populateChartList(timelessClassicsBooks, timelessClassicsList, false, "Timeless Classic");

            setupChartsEventListeners();

        } catch (error) {
            console.error("Failed to load charts page content:", error);
            if(readersChoiceList) readersChoiceList.innerHTML = `<p>Error loading Reader's Choice: ${error.message}</p>`;
            if(criticsPicksList) criticsPicksList.innerHTML = `<p>Error loading Critic's Picks: ${error.message}</p>`;
            if(timelessClassicsList) timelessClassicsList.innerHTML = `<p>Error loading Timeless Classics: ${error.message}</p>`;
        }
    }

    function populateChartList(books, container, showVoting, chartNameForTooltip) {
        container.innerHTML = '';
        if (!books || books.length === 0) {
            container.innerHTML = `<p>No books to display in the ${chartNameForTooltip} chart currently.</p>`;
            return;
        }
        books.forEach((book, index) => {
            container.innerHTML += createChartItem(book, index + 1, showVoting, chartNameForTooltip);
        });
    }

    function createChartItem(book, rank, showVoting, chartNameForTooltip) {
        const voteButtonHTML = showVoting ? `<button class="vote-button" data-book-id="${book.id}" aria-label="Vote for ${book.title}">Vote</button>` : '';
        const shareButtonHTML = `<a href="#" class="share-button" data-book-id="${book.id}" title="Share ${book.title}" aria-label="Share ${book.title}">Share</a>`;
        const tooltipText = `${chartNameForTooltip} - Rank #${rank}: ${book.title}`;
        // The tooltip is attached to the rank span itself via title attribute for simplicity, CSS handles the styled tooltip via sibling selector
        const tooltipSpanHTML = `<span class="tooltip-text">${tooltipText}</span>`;


        return `
            <div class="chart-item" data-book-id="${book.id}">
                <span class="chart-item-rank" title="${tooltipText}" aria-label="Rank ${rank}">${rank}</span>
                <img src="${book.coverImage || 'images/placeholder_cover.png'}" alt="Cover of ${book.title}" class="chart-item-cover" onerror="this.src='images/placeholder_cover.png'; this.alt='Placeholder cover image';">
                <div class="chart-item-info">
                    <h3><a href="single.html?id=${book.id}">${book.title}</a></h3>
                    <p>by ${book.author}</p>
                    <div class="rating">⭐ ${typeof book.rating === 'number' ? book.rating.toFixed(1) : 'N/A'}</div>
                </div>
                <div class="chart-item-actions">
                    ${voteButtonHTML}
                    ${shareButtonHTML}
                </div>
                ${tooltipSpanHTML}
            </div>
        `;
    }

    function setupChartsEventListeners() {
        // Use event delegation on the .charts-page for dynamically added buttons
        const chartsPageContainer = document.querySelector('.charts-page');
        if (!chartsPageContainer) return;

        chartsPageContainer.addEventListener('click', function(event) {
            const target = event.target;

            if (target.classList.contains('vote-button') && !target.disabled) {
                const bookId = target.dataset.bookId;
                console.log(`Vote cast for book ID: ${bookId} (dummy action)`);
                target.textContent = 'Voted!';
                target.classList.add('voted');
                target.disabled = true;
                alert(`You voted for Book ID ${bookId}! (This is a dummy action)`);
            }

            if (target.classList.contains('share-button')) {
                event.preventDefault();
                const bookId = target.dataset.bookId;
                const chartItem = target.closest('.chart-item');
                let bookTitle = 'this book';
                if (chartItem) {
                    const titleElement = chartItem.querySelector('.chart-item-info h3 a');
                    if (titleElement) bookTitle = titleElement.textContent;
                }
                console.log(`Share button clicked for book ID: ${bookId} - ${bookTitle} (dummy action)`);
                alert(`Share '${bookTitle}' (ID: ${bookId}) - (Dummy link, no actual sharing implemented)`);
            }
        });
    }
    // --- End of Charts Page Specific Functions ---

    // --- Single Book Page Specific Functions ---
>>>>>>> REPLACE
```
```javascript
document.addEventListener('DOMContentLoaded', function() {
    console.log('LITLOUNGE-3 JavaScript loaded');

    // --- Global Variables & Initial Setup ---
    let allBooksData = []; // Cache for all book data
    let currentUserData = null; // To store the logged-in user's data (simulated)

    // --- Global Helper Functions ---
    async function fetchAllBooks() {
        if (allBooksData.length === 0) { // Only fetch if not already loaded
            try {
                const response = await fetch('data/books.json');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                allBooksData = await response.json();
            } catch (error) {
                console.error("Failed to load books data:", error);
                allBooksData = []; // Ensure it's an array even on error
            }
        }
        return allBooksData;
    }

    async function fetchUserData(userId = "user1") { // Default to user1 for demo
        // In a real app, userId would come from session/auth
        if (!currentUserData || currentUserData.id !== userId) {
            try {
                const response = await fetch('data/users.json');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const users = await response.json();
                currentUserData = users.find(user => user.id === userId);
                if (!currentUserData) {
                    console.warn(`User with ID ${userId} not found. Using default empty user.`);
                    // Provide a default structure if user not found, to prevent errors
                    currentUserData = {
                        id: userId,
                        username: "Guest",
                        profileImage: "images/user_avatar_placeholder.png",
                        readingLists: { currentlyReading: [], favorites: [], wantToRead: [] },
                        library: { saved: [], rented: [], subscribed: [] },
                        preferences: { favoriteGenres: [], notifications: false, darkMode: false },
                        readingStats: { booksReadThisMonth: 0, pagesReadThisWeek: 0, readingStreak: "0 days" }
                    };
                }
            } catch (error) {
                console.error("Failed to load user data:", error);
                currentUserData = null;
            }
        }
        return currentUserData;
    }

    function createBookCard(book, linkToSinglePage = false) {
        const rating = typeof book.rating === 'number' ? book.rating.toFixed(1) : 'N/A';
        const badgeClass = book.accessBadge ? book.accessBadge.toLowerCase() : 'free';
        const linkStart = linkToSinglePage ? `<a href="single.html?id=${book.id}" class="book-card-link">` : '';
        const linkEnd = linkToSinglePage ? '</a>' : '';

        return `
            <div class="book-card" data-book-id="${book.id}">
                ${linkStart}
                <img src="${book.coverImage || 'images/placeholder_cover.png'}" alt="${book.title}" class="book-cover" onerror="this.onerror=null;this.src='images/placeholder_cover.png';">
                <h3 class="book-title">${book.title}</h3>
                ${linkEnd}
                <p class="book-author">${book.author}</p>
                <div class="rating">⭐ ${rating}</div>
                <span class="access-badge ${badgeClass}">${book.accessBadge}</span>
                <button class="add-to-list">Add to List</button>
            </div>
        `;
    }

    // Modified book card for store/dashboard where links are always needed
    function createBookCardForStore(book) {
        const rating = typeof book.rating === 'number' ? book.rating.toFixed(1) : 'N/A';
        const badgeClass = book.accessBadge ? book.accessBadge.toLowerCase() : 'free';

        return `
            <div class="book-card" data-book-id="${book.id}">
                <a href="single.html?id=${book.id}" class="book-card-link">
                    <img src="${book.coverImage || 'images/placeholder_cover.png'}" alt="${book.title}" class="book-cover" onerror="this.onerror=null;this.src='images/placeholder_cover.png';">
                    <h3 class="book-title">${book.title}</h3>
                </a>
                <p class="book-author">${book.author}</p>
                <div class="rating">⭐ ${rating}</div>
                <span class="access-badge ${badgeClass}">${book.accessBadge}</span>
                <button class="add-to-list">Add to List</button>
            </div>
        `;
    }

    // --- Navigation Active State ---
    function updateActiveNav() {
        const currentPage = window.location.pathname.split("/").pop() || "index.html"; // Default to index.html if path is just "/"
        document.querySelectorAll('header nav a').forEach(link => {
            link.classList.remove('active-nav-main');
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active-nav-main');
            }
        });
    }


    // --- Homepage Specific Functions ---
    function initCarousel(carouselElement, carouselInnerElement) {
        if (!carouselElement || !carouselInnerElement || !carouselInnerElement.children.length) return;

        let currentIndex = 0;
        const items = Array.from(carouselInnerElement.children); // Convert HTMLCollection to Array
        const totalItems = items.length;
        if (totalItems === 0) return;

        let itemWidth = items[0].offsetWidth + parseInt(getComputedStyle(items[0]).marginRight) + parseInt(getComputedStyle(items[0]).marginLeft) ;

        const prevButton = document.createElement('button');
        prevButton.innerHTML = '&laquo;';
        prevButton.classList.add('carousel-prev-btn');
        Object.assign(prevButton.style, { position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: '10', padding: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', cursor: 'pointer' });


        const nextButton = document.createElement('button');
        nextButton.innerHTML = '&raquo;';
        nextButton.classList.add('carousel-next-btn');
        Object.assign(nextButton.style, { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: '10', padding: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', cursor: 'pointer' });

        carouselElement.appendChild(prevButton);
        carouselElement.appendChild(nextButton);

        function updateCarousel() {
            if (items.length === 0) return; // Prevent error if items are not yet loaded or empty
            itemWidth = items[0].offsetWidth + parseInt(getComputedStyle(items[0]).marginRight) + parseInt(getComputedStyle(items[0]).marginLeft);
            const containerWidth = carouselElement.offsetWidth;
            const itemsVisible = Math.floor(containerWidth / itemWidth) || 1; // Ensure at least 1 to avoid division by zero or NaN
            const maxIndex = totalItems > itemsVisible ? totalItems - itemsVisible : 0;

            if (currentIndex > maxIndex) currentIndex = maxIndex;
            if (currentIndex < 0) currentIndex = 0;

            const newTransformValue = -currentIndex * itemWidth;
            carouselInnerElement.style.transform = `translateX(${newTransformValue}px)`;
            prevButton.disabled = currentIndex === 0;
            nextButton.disabled = currentIndex === maxIndex;
        }

        prevButton.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateCarousel();
            }
        });

        nextButton.addEventListener('click', () => {
            const containerWidth = carouselElement.offsetWidth;
            const itemsVisible = Math.floor(containerWidth / itemWidth) || 1;
            if (currentIndex < totalItems - itemsVisible) {
                currentIndex++;
                updateCarousel();
            }
        });

        updateCarousel();
        window.addEventListener('resize', updateCarousel);
    }

    async function loadHomepageContent() {
        try {
            const books = await fetchAllBooks(); // Use global fetchAllBooks

            const featuredCarouselEl = document.querySelector('#hero .carousel');
            const trendingGrid = document.getElementById('trending-grid');
            const editorsGrid = document.getElementById('editors-grid');
            const hotPressGrid = document.getElementById('hot-press-grid');
            const genreGrid = document.getElementById('genre-grid');
            const personalizedGrid = document.getElementById('personalized-grid');


            if (featuredCarouselEl) {
                const carouselInner = document.createElement('div');
                carouselInner.classList.add('carousel-inner');
                books.filter(b => b.featured).slice(0, 5).forEach(book => {
                    carouselInner.innerHTML += createBookCard(book, true);
                });
                featuredCarouselEl.innerHTML = '';
                featuredCarouselEl.appendChild(carouselInner);

                // Ensure images are loaded before initializing carousel to get correct item widths
                let images = carouselInner.querySelectorAll('img');
                let loadedImages = 0;
                if (images.length === 0) {
                    initCarousel(featuredCarouselEl, carouselInner); // No images, init directly
                } else {
                    images.forEach(img => {
                        if (img.complete) {
                            loadedImages++;
                        } else {
                            img.onload = img.onerror = () => {
                                loadedImages++;
                                if (loadedImages === images.length) {
                                    initCarousel(featuredCarouselEl, carouselInner);
                                }
                            };
                        }
                    });
                    if (loadedImages === images.length && images.length > 0) { // All images were already cached
                         initCarousel(featuredCarouselEl, carouselInner);
                    }
                }
            }

            if (trendingGrid) {
                trendingGrid.innerHTML = '';
                books.filter(b => b.trending).slice(0, 6).forEach(book => {
                    trendingGrid.innerHTML += createBookCard(book, true);
                });
            }

            if (editorsGrid) {
                editorsGrid.innerHTML = '';
                books.filter(b => b.editorsChoice).slice(0, 6).forEach(book => {
                    editorsGrid.innerHTML += createBookCard(book, true);
                });
            }

            if (hotPressGrid) {
                hotPressGrid.innerHTML = '';
                books.filter(b => b.hotOffPress).slice(0, 6).forEach(book => {
                    hotPressGrid.innerHTML += createBookCard(book, true);
                });
            }

            if (genreGrid) {
                genreGrid.innerHTML = '';
                const uniqueGenres = [...new Set(books.map(b => b.genre).filter(g => g))].slice(0, 6);
                uniqueGenres.forEach(genre => {
                    genreGrid.innerHTML += createGenreItem(genre);
                });
            }

            if (personalizedGrid) {
                personalizedGrid.innerHTML = '';
                books.filter(b => b.rating >= 4.5).slice(0, 3).forEach(book => {
                    personalizedGrid.innerHTML += createBookCard(book, true);
                });
            }

        } catch (error) {
            console.error("Failed to load books for homepage:", error);
            const grids = document.querySelectorAll('.book-grid, .carousel, .genre-grid');
            grids.forEach(grid => {
                if(grid) grid.innerHTML = `<p>Error loading content. Please try again later.</p>`;
            });
        }
    }

    function createGenreItem(genre) {
        return `
            <div class="genre-item" data-genre="${genre.toLowerCase()}">
                ${genre}
            </div>
        `;
    }

    // --- Single Book Page Specific Functions ---
    async function loadSingleBookPageContent() {
        const bookDetailContent = document.getElementById('book-detail-content');
        const relatedBooksGrid = document.getElementById('related-books-grid');
        if (!bookDetailContent || !relatedBooksGrid) return;

        const params = new URLSearchParams(window.location.search);
        const bookId = params.get('id');

        if (!bookId) {
            bookDetailContent.innerHTML = "<p>Book ID not provided. Cannot display details.</p>";
            relatedBooksGrid.innerHTML = "";
            return;
        }

        try {
            // In a real app, allBooksData might be globally available or managed by a state system
            // For now, re-fetch if not already loaded, or assume it's loaded by another part of the script.
            // To be safe for this isolated page load:
            let booksData = [];
            if (typeof allBooksStore !== 'undefined' && allBooksStore.length > 0) { // Check if store page already loaded it
                booksData = allBooksStore;
            } else if (typeof allBooks !== 'undefined' && allBooks.length > 0) { // Check if homepage already loaded it (less likely for single page)
                 booksData = allBooks; // 'allBooks' is used by homepage, 'allBooksStore' by store page
            } else {
                const response = await fetch('data/books.json');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                booksData = await response.json();
            }

            const currentBook = booksData.find(book => book.id === bookId);

            if (!currentBook) {
                bookDetailContent.innerHTML = `<p>Book with ID ${bookId} not found.</p>`;
                relatedBooksGrid.innerHTML = "";
                return;
            }

            displayBookDetails(currentBook, bookDetailContent);
            displayRelatedBooks(currentBook, booksData, relatedBooksGrid);

        } catch (error) {
            console.error("Failed to load single book page content:", error);
            bookDetailContent.innerHTML = `<p>Error loading book details. Please try again later.</p>`;
            relatedBooksGrid.innerHTML = "";
        }
    }

    function displayBookDetails(book, container) {
        const rating = typeof book.rating === 'number' ? book.rating.toFixed(1) : 'N/A';
        const badgeClass = book.accessBadge ? book.accessBadge.toLowerCase() : 'free';

        let reviewsHTML = '<h3>Reviews</h3><div class="reviews-list">';
        if (book.reviews && book.reviews.length > 0) {
            book.reviews.forEach(review => {
                reviewsHTML += `
                    <div class="review-item">
                        <p class="review-user">${review.user || 'Anonymous'}</p>
                        <p class="review-rating">Rating: ${'⭐'.repeat(Math.round(review.rating || 0))} (${review.rating || 'N/A'})</p>
                        <p class="review-comment">${review.comment}</p>
                    </div>
                `;
            });
        } else {
            reviewsHTML += '<p>No reviews yet for this book.</p>';
        }
        reviewsHTML += '</div>';

        const authorBio = book.authorBio || `More information about ${book.author} is coming soon. This is a placeholder bio.`;

        container.innerHTML = `
            <div class="book-cover-container">
                <img src="${book.coverImage || 'images/placeholder_cover.png'}" alt="${book.title}" class="book-cover-high-res" onerror="this.onerror=null;this.src='images/placeholder_cover.png';">
            </div>
            <div class="book-info">
                <h2 class="book-main-title">${book.title}</h2>
                <p class="book-main-author">${book.author}
                    <a href="#" class="author-bio-link" data-author="${book.author}">(see bio)</a>
                </p>
                <span class="access-badge-single access-badge ${badgeClass}">${book.accessBadge}</span>
                <div class="rating" style="margin-bottom: 15px;">Overall Rating: ⭐ ${rating} (${book.reviews ? book.reviews.length : 0} reviews)</div>

                <p class="book-description">${book.description || 'No description available.'}</p>

                <div class="author-bio-section" style="display:none;">
                    <h3>About ${book.author}</h3>
                    <p class="author-bio-text">${authorBio}</p>
                </div>

                <div class="book-sample-preview">
                    <h3>Sample Preview</h3>
                    <div class="book-sample-preview-text">
                        ${book.sample || 'No sample available.'}
                    </div>
                </div>
                <div class="book-reviews">
                    ${reviewsHTML}
                </div>
                 <button class="add-to-list" data-book-id="${book.id}" style="margin-top: 20px; padding: 10px 15px;">Add to List</button>
                 <!-- Add more buttons like "Read Now", "Rent", "Buy" as needed -->
            </div>
        `;

        const authorBioLink = container.querySelector('.author-bio-link');
        if(authorBioLink) {
            authorBioLink.addEventListener('click', (e) => {
                e.preventDefault();
                const bioSection = container.querySelector('.author-bio-section');
                if(bioSection) {
                    bioSection.style.display = bioSection.style.display === 'none' ? 'block' : 'none';
                }
            });
        }
    }

    function displayRelatedBooks(currentBook, allBooksParam, container) {
        container.innerHTML = '';
        const related = allBooksParam.filter(book =>
            book.genre === currentBook.genre && book.id !== currentBook.id
        ).slice(0, 4);

        if (related.length > 0) {
            related.forEach(book => {
                // Using createBookCardForStore to ensure related books also link to their single pages
                container.innerHTML += createBookCardForStore(book);
            });
        } else {
            const popularFallback = allBooksParam.filter(book => book.id !== currentBook.id && (book.rating || 0) >= 4.5).slice(0,4);
            if (popularFallback.length > 0) {
                 popularFallback.forEach(book => {
                    container.innerHTML += createBookCardForStore(book);
                });
            } else {
                container.innerHTML = '<p>No related books found at this time.</p>';
            }
        }
    }
    // --- End of Single Book Page Specific Functions ---

    // --- Store Page Specific Functions ---
    let allBooksStore = []; // To store all books fetched for client-side filtering/sorting on store page

    async function loadStorePageContent() {
        try {
            // Use fetchAllBooks to ensure data is loaded and cached if needed
            allBooksStore = await fetchAllBooks();
            populateStoreBooks(allBooksStore);
            populateGenreFilterStore(allBooksStore);
            setupStoreEventListeners();
        } catch (error) {
            console.error("Failed to load store page content:", error);
            const storeGrid = document.getElementById('store-book-grid');
            if (storeGrid) storeGrid.innerHTML = `<p>Error loading books. Please try again later.</p>`;
        }
    }

    function populateStoreBooks(booksToDisplay) {
        const storeGrid = document.getElementById('store-book-grid');
        if (!storeGrid) return;

        storeGrid.innerHTML = ''; // Clear current books or loading message
        if (booksToDisplay.length === 0) {
            storeGrid.innerHTML = '<p>No books match your criteria.</p>';
            return;
        }
        booksToDisplay.forEach(book => {
            // Modify createBookCard to add a link to single.html
            const bookCardHTML = createBookCardForStore(book); // Use a modified card function
            storeGrid.innerHTML += bookCardHTML;
        });
    }

    // createBookCardForStore is now a global helper, no need to redefine if it's the same.

    function populateGenreFilterStore(books) {
        const genreFilterList = document.getElementById('genre-filter-list');
        if (!genreFilterList) return;

        const uniqueGenres = [...new Set(books.map(book => book.genre).filter(g => g))].sort(); // Filter out undefined/null genres and sort
        genreFilterList.innerHTML = ''; // Clear static/default genres
        uniqueGenres.forEach(genre => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<label><input type="checkbox" name="genre" value="${genre.toLowerCase()}"> ${genre}</label>`;
            genreFilterList.appendChild(listItem);
        });
    }

    function setupStoreEventListeners() {
        const searchBar = document.getElementById('search-bar');
        const sortDropdown = document.getElementById('sort-dropdown');
        const applyFiltersBtn = document.getElementById('apply-filters-btn');
        const ratingFilter = document.getElementById('rating-filter');

        if (searchBar) {
            searchBar.addEventListener('input', performSearchAndFilterAndSort);
        }
        if (sortDropdown) {
            sortDropdown.addEventListener('change', performSearchAndFilterAndSort);
        }
        if (ratingFilter) {
            ratingFilter.addEventListener('change', performSearchAndFilterAndSort);
        }
        const genreFilterList = document.getElementById('genre-filter-list');
        if (genreFilterList) {
             genreFilterList.addEventListener('change', function(event) {
                if (event.target.name === 'genre' && event.target.type === 'checkbox') {
                    performSearchAndFilterAndSort();
                }
            });
        }
        // If using Apply Filters button:
        if (applyFiltersBtn) { // This button might be removed if live filtering is preferred
            applyFiltersBtn.addEventListener('click', performSearchAndFilterAndSort);
        }
    }

    function performSearchAndFilterAndSort() {
        let filteredBooks = [...allBooksStore];

        const searchTerm = document.getElementById('search-bar')?.value.toLowerCase() || '';
        if (searchTerm) {
            filteredBooks = filteredBooks.filter(book =>
                book.title.toLowerCase().includes(searchTerm) ||
                book.author.toLowerCase().includes(searchTerm) ||
                (book.genre && book.genre.toLowerCase().includes(searchTerm))
            );
        }

        const selectedGenres = Array.from(document.querySelectorAll('#genre-filter-list input[name="genre"]:checked'))
                                    .map(cb => cb.value);
        if (selectedGenres.length > 0) {
            filteredBooks = filteredBooks.filter(book => book.genre && selectedGenres.includes(book.genre.toLowerCase()));
        }

        const minRating = parseFloat(document.getElementById('rating-filter')?.value || '0');
        if (minRating > 0) {
            filteredBooks = filteredBooks.filter(book => book.rating !== undefined && book.rating >= minRating);
        }

        const sortBy = document.getElementById('sort-dropdown')?.value || 'newest';
        switch (sortBy) {
            case 'popular':
                filteredBooks.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'title-asc':
                filteredBooks.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'title-desc':
                filteredBooks.sort((a, b) => b.title.localeCompare(a.title));
                break;
            case 'newest':
            default:
                 filteredBooks.sort((a, b) => parseInt(b.id || 0) - parseInt(a.id || 0));
                break;
        }
        populateStoreBooks(filteredBooks);
    }
    // --- End of Store Page Specific Functions ---

    // --- Charts Page Specific Functions ---
    async function loadChartsPageContent() {
        const readersChoiceList = document.getElementById('readers-choice-list');
        const criticsPicksList = document.getElementById('critics-picks-list');
        const timelessClassicsList = document.getElementById('timeless-classics-list');

        if (!readersChoiceList || !criticsPicksList || !timelessClassicsList) {
            console.warn("One or more chart list containers not found on charts page.");
            return;
        }

        try {
            let booksData = await fetchAllBooks(); // Ensure books are loaded

            if (booksData.length === 0) {
                throw new Error("No books data available to populate charts.");
            }

            // Reader's Choice: Highly rated (e.g., top 5 by rating)
            const readersChoiceBooks = [...booksData].sort((a,b) => (b.rating || 0) - (a.rating || 0)).slice(0, 5);
            populateChartList(readersChoiceBooks, readersChoiceList, true, "Reader's Choice");

            // Critic's Picks: Books flagged as "editorsChoice" (e.g., top 5)
            const criticsPicksBooks = booksData.filter(b => b.editorsChoice === true).slice(0, 5);
            populateChartList(criticsPicksBooks, criticsPicksList, false, "Critic's Pick");

            // Timeless Classics: (Simulated) e.g., older books (lower ID) with good ratings (e.g. >= 4.0)
            const timelessClassicsBooks = [...booksData]
                                            .filter(b => (b.rating || 0) >= 4.0)
                                            .sort((a,b) => parseInt(a.id || '9999') - parseInt(b.id || '9999'))
                                            .slice(0, 5);
            populateChartList(timelessClassicsBooks, timelessClassicsList, false, "Timeless Classic");

            setupChartsEventListeners();

        } catch (error) {
            console.error("Failed to load charts page content:", error);
            if(readersChoiceList) readersChoiceList.innerHTML = `<p>Error loading Reader's Choice: ${error.message}</p>`;
            if(criticsPicksList) criticsPicksList.innerHTML = `<p>Error loading Critic's Picks: ${error.message}</p>`;
            if(timelessClassicsList) timelessClassicsList.innerHTML = `<p>Error loading Timeless Classics: ${error.message}</p>`;
        }
    }

    function populateChartList(books, container, showVoting, chartNameForTooltip) {
        container.innerHTML = '';
        if (!books || books.length === 0) {
            container.innerHTML = `<p>No books to display in the ${chartNameForTooltip} chart currently.</p>`;
            return;
        }
        books.forEach((book, index) => {
            container.innerHTML += createChartItem(book, index + 1, showVoting, chartNameForTooltip);
        });
    }

    function createChartItem(book, rank, showVoting, chartNameForTooltip) {
        const voteButtonHTML = showVoting ? `<button class="vote-button" data-book-id="${book.id}" aria-label="Vote for ${book.title}">Vote</button>` : '';
        const shareButtonHTML = `<a href="#" class="share-button" data-book-id="${book.id}" title="Share ${book.title}" aria-label="Share ${book.title}">Share</a>`;
        const tooltipText = `${chartNameForTooltip} - Rank #${rank}: ${book.title}`;
        // The tooltip is attached to the rank span itself via title attribute for simplicity, CSS handles the styled tooltip via sibling selector
        const tooltipSpanHTML = `<span class="tooltip-text">${tooltipText}</span>`;


        return `
            <div class="chart-item" data-book-id="${book.id}">
                <span class="chart-item-rank" title="${tooltipText}" aria-label="Rank ${rank}">${rank}</span>
                <img src="${book.coverImage || 'images/placeholder_cover.png'}" alt="Cover of ${book.title}" class="chart-item-cover" onerror="this.src='images/placeholder_cover.png'; this.alt='Placeholder cover image';">
                <div class="chart-item-info">
                    <h3><a href="single.html?id=${book.id}">${book.title}</a></h3>
                    <p>by ${book.author}</p>
                    <div class="rating">⭐ ${typeof book.rating === 'number' ? book.rating.toFixed(1) : 'N/A'}</div>
                </div>
                <div class="chart-item-actions">
                    ${voteButtonHTML}
                    ${shareButtonHTML}
                </div>
                ${tooltipSpanHTML}
            </div>
        `;
    }

    function setupChartsEventListeners() {
        // Use event delegation on the .charts-page for dynamically added buttons
        const chartsPageContainer = document.querySelector('.charts-page');
        if (!chartsPageContainer) return;

        chartsPageContainer.addEventListener('click', function(event) {
            const target = event.target;

            if (target.classList.contains('vote-button') && !target.disabled) {
                const bookId = target.dataset.bookId;
                console.log(`Vote cast for book ID: ${bookId} (dummy action)`);
                target.textContent = 'Voted!';
                target.classList.add('voted');
                target.disabled = true;
                alert(`You voted for Book ID ${bookId}! (This is a dummy action)`);
            }

            if (target.classList.contains('share-button')) {
                event.preventDefault();
                const bookId = target.dataset.bookId;
                const chartItem = target.closest('.chart-item');
                let bookTitle = 'this book';
                if (chartItem) {
                    const titleElement = chartItem.querySelector('.chart-item-info h3 a');
                    if (titleElement) bookTitle = titleElement.textContent;
                }
                console.log(`Share button clicked for book ID: ${bookId} - ${bookTitle} (dummy action)`);
                alert(`Share '${bookTitle}' (ID: ${bookId}) - (Dummy link, no actual sharing implemented)`);
            }
        });
    }
    // --- End of Charts Page Specific Functions ---

    // --- Single Book Page Specific Functions ---
>>>>>>> REPLACE
```
```javascript
document.addEventListener('DOMContentLoaded', function() {
    console.log('LITLOUNGE-3 JavaScript loaded');

    // --- Global Variables & Initial Setup ---
    let allBooksData = []; // Cache for all book data
    let currentUserData = null; // To store the logged-in user's data (simulated)

    // --- Global Helper Functions ---
    async function fetchAllBooks() {
        if (allBooksData.length === 0) { // Only fetch if not already loaded
            try {
                const response = await fetch('data/books.json');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                allBooksData = await response.json();
            } catch (error) {
                console.error("Failed to load books data:", error);
                allBooksData = []; // Ensure it's an array even on error
            }
        }
        return allBooksData;
    }

    async function fetchUserData(userId = "user1") { // Default to user1 for demo
        // In a real app, userId would come from session/auth
        if (!currentUserData || currentUserData.id !== userId) {
            try {
                const response = await fetch('data/users.json');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const users = await response.json();
                currentUserData = users.find(user => user.id === userId);
                if (!currentUserData) {
                    console.warn(`User with ID ${userId} not found. Using default empty user.`);
                    // Provide a default structure if user not found, to prevent errors
                    currentUserData = {
                        id: userId,
                        username: "Guest",
                        profileImage: "images/user_avatar_placeholder.png",
                        readingLists: { currentlyReading: [], favorites: [], wantToRead: [] },
                        library: { saved: [], rented: [], subscribed: [] },
                        preferences: { favoriteGenres: [], notifications: false, darkMode: false },
                        readingStats: { booksReadThisMonth: 0, pagesReadThisWeek: 0, readingStreak: "0 days" }
                    };
                }
            } catch (error) {
                console.error("Failed to load user data:", error);
                currentUserData = null;
            }
        }
        return currentUserData;
    }

    function createBookCard(book, linkToSinglePage = false) {
        const rating = typeof book.rating === 'number' ? book.rating.toFixed(1) : 'N/A';
        const badgeClass = book.accessBadge ? book.accessBadge.toLowerCase() : 'free';
        const linkStart = linkToSinglePage ? `<a href="single.html?id=${book.id}" class="book-card-link">` : '';
        const linkEnd = linkToSinglePage ? '</a>' : '';

        return `
            <div class="book-card" data-book-id="${book.id}">
                ${linkStart}
                <img src="${book.coverImage || 'images/placeholder_cover.png'}" alt="${book.title}" class="book-cover" onerror="this.onerror=null;this.src='images/placeholder_cover.png';">
                <h3 class="book-title">${book.title}</h3>
                ${linkEnd}
                <p class="book-author">${book.author}</p>
                <div class="rating">⭐ ${rating}</div>
                <span class="access-badge ${badgeClass}">${book.accessBadge}</span>
                <button class="add-to-list">Add to List</button>
            </div>
        `;
    }

    // Modified book card for store/dashboard where links are always needed
    function createBookCardForStore(book) {
        const rating = typeof book.rating === 'number' ? book.rating.toFixed(1) : 'N/A';
        const badgeClass = book.accessBadge ? book.accessBadge.toLowerCase() : 'free';

        return `
            <div class="book-card" data-book-id="${book.id}">
                <a href="single.html?id=${book.id}" class="book-card-link">
                    <img src="${book.coverImage || 'images/placeholder_cover.png'}" alt="${book.title}" class="book-cover" onerror="this.onerror=null;this.src='images/placeholder_cover.png';">
                    <h3 class="book-title">${book.title}</h3>
                </a>
                <p class="book-author">${book.author}</p>
                <div class="rating">⭐ ${rating}</div>
                <span class="access-badge ${badgeClass}">${book.accessBadge}</span>
                <button class="add-to-list">Add to List</button>
            </div>
        `;
    }

    // --- Navigation Active State ---
    function updateActiveNav() {
        const currentPage = window.location.pathname.split("/").pop() || "index.html"; // Default to index.html if path is just "/"
        document.querySelectorAll('header nav a').forEach(link => {
            link.classList.remove('active-nav-main');
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active-nav-main');
            }
        });
    }


    // --- Homepage Specific Functions ---
    function initCarousel(carouselElement, carouselInnerElement) {
        if (!carouselElement || !carouselInnerElement || !carouselInnerElement.children.length) return;

        let currentIndex = 0;
        const items = Array.from(carouselInnerElement.children); // Convert HTMLCollection to Array
        const totalItems = items.length;
        if (totalItems === 0) return;

        let itemWidth = items[0].offsetWidth + parseInt(getComputedStyle(items[0]).marginRight) + parseInt(getComputedStyle(items[0]).marginLeft) ;

        const prevButton = document.createElement('button');
        prevButton.innerHTML = '&laquo;';
        prevButton.classList.add('carousel-prev-btn');
        Object.assign(prevButton.style, { position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: '10', padding: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', cursor: 'pointer' });


        const nextButton = document.createElement('button');
        nextButton.innerHTML = '&raquo;';
        nextButton.classList.add('carousel-next-btn');
        Object.assign(nextButton.style, { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: '10', padding: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', cursor: 'pointer' });

        carouselElement.appendChild(prevButton);
        carouselElement.appendChild(nextButton);

        function updateCarousel() {
            if (items.length === 0) return; // Prevent error if items are not yet loaded or empty
            itemWidth = items[0].offsetWidth + parseInt(getComputedStyle(items[0]).marginRight) + parseInt(getComputedStyle(items[0]).marginLeft);
            const containerWidth = carouselElement.offsetWidth;
            const itemsVisible = Math.floor(containerWidth / itemWidth) || 1; // Ensure at least 1 to avoid division by zero or NaN
            const maxIndex = totalItems > itemsVisible ? totalItems - itemsVisible : 0;

            if (currentIndex > maxIndex) currentIndex = maxIndex;
            if (currentIndex < 0) currentIndex = 0;

            const newTransformValue = -currentIndex * itemWidth;
            carouselInnerElement.style.transform = `translateX(${newTransformValue}px)`;
            prevButton.disabled = currentIndex === 0;
            nextButton.disabled = currentIndex === maxIndex;
        }

        prevButton.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateCarousel();
            }
        });

        nextButton.addEventListener('click', () => {
            const containerWidth = carouselElement.offsetWidth;
            const itemsVisible = Math.floor(containerWidth / itemWidth) || 1;
            if (currentIndex < totalItems - itemsVisible) {
                currentIndex++;
                updateCarousel();
            }
        });

        updateCarousel();
        window.addEventListener('resize', updateCarousel);
    }

    async function loadHomepageContent() {
        try {
            const books = await fetchAllBooks(); // Use global fetchAllBooks

            const featuredCarouselEl = document.querySelector('#hero .carousel');
            const trendingGrid = document.getElementById('trending-grid');
            const editorsGrid = document.getElementById('editors-grid');
            const hotPressGrid = document.getElementById('hot-press-grid');
            const genreGrid = document.getElementById('genre-grid');
            const personalizedGrid = document.getElementById('personalized-grid');


            if (featuredCarouselEl) {
                const carouselInner = document.createElement('div');
                carouselInner.classList.add('carousel-inner');
                books.filter(b => b.featured).slice(0, 5).forEach(book => {
                    carouselInner.innerHTML += createBookCard(book, true);
                });
                featuredCarouselEl.innerHTML = '';
                featuredCarouselEl.appendChild(carouselInner);

                // Ensure images are loaded before initializing carousel to get correct item widths
                let images = carouselInner.querySelectorAll('img');
                let loadedImages = 0;
                if (images.length === 0) {
                    initCarousel(featuredCarouselEl, carouselInner); // No images, init directly
                } else {
                    images.forEach(img => {
                        if (img.complete) {
                            loadedImages++;
                        } else {
                            img.onload = img.onerror = () => {
                                loadedImages++;
                                if (loadedImages === images.length) {
                                    initCarousel(featuredCarouselEl, carouselInner);
                                }
                            };
                        }
                    });
                    if (loadedImages === images.length && images.length > 0) { // All images were already cached
                         initCarousel(featuredCarouselEl, carouselInner);
                    }
                }
            }

            if (trendingGrid) {
                trendingGrid.innerHTML = '';
                books.filter(b => b.trending).slice(0, 6).forEach(book => {
                    trendingGrid.innerHTML += createBookCard(book, true);
                });
            }

            if (editorsGrid) {
                editorsGrid.innerHTML = '';
                books.filter(b => b.editorsChoice).slice(0, 6).forEach(book => {
                    editorsGrid.innerHTML += createBookCard(book, true);
                });
            }

            if (hotPressGrid) {
                hotPressGrid.innerHTML = '';
                books.filter(b => b.hotOffPress).slice(0, 6).forEach(book => {
                    hotPressGrid.innerHTML += createBookCard(book, true);
                });
            }

            if (genreGrid) {
                genreGrid.innerHTML = '';
                const uniqueGenres = [...new Set(books.map(b => b.genre).filter(g => g))].slice(0, 6);
                uniqueGenres.forEach(genre => {
                    genreGrid.innerHTML += createGenreItem(genre);
                });
            }

            if (personalizedGrid) {
                personalizedGrid.innerHTML = '';
                books.filter(b => b.rating >= 4.5).slice(0, 3).forEach(book => {
                    personalizedGrid.innerHTML += createBookCard(book, true);
                });
            }

        } catch (error) {
            console.error("Failed to load books for homepage:", error);
            const grids = document.querySelectorAll('.book-grid, .carousel, .genre-grid');
            grids.forEach(grid => {
                if(grid) grid.innerHTML = `<p>Error loading content. Please try again later.</p>`;
            });
        }
    }

    function createGenreItem(genre) {
        return `
            <div class="genre-item" data-genre="${genre.toLowerCase()}">
                ${genre}
            </div>
        `;
    }

    // --- Single Book Page Specific Functions ---
    async function loadSingleBookPageContent() {
        const bookDetailContent = document.getElementById('book-detail-content');
        const relatedBooksGrid = document.getElementById('related-books-grid');
        if (!bookDetailContent || !relatedBooksGrid) return;

        const params = new URLSearchParams(window.location.search);
        const bookId = params.get('id');

        if (!bookId) {
            bookDetailContent.innerHTML = "<p>Book ID not provided. Cannot display details.</p>";
            relatedBooksGrid.innerHTML = "";
            return;
        }

        try {
            const books = await fetchAllBooks();

            const currentBook = books.find(book => book.id === bookId);

            if (!currentBook) {
                bookDetailContent.innerHTML = `<p>Book with ID ${bookId} not found.</p>`;
                relatedBooksGrid.innerHTML = "";
                return;
            }

            displayBookDetails(currentBook, bookDetailContent);
            displayRelatedBooks(currentBook, books, relatedBooksGrid);

        } catch (error) {
            console.error("Failed to load single book page content:", error);
            bookDetailContent.innerHTML = `<p>Error loading book details. Please try again later.</p>`;
            relatedBooksGrid.innerHTML = "";
        }
    }

    function displayBookDetails(book, container) {
        const rating = typeof book.rating === 'number' ? book.rating.toFixed(1) : 'N/A';
        const badgeClass = book.accessBadge ? book.accessBadge.toLowerCase() : 'free';

        let reviewsHTML = '<h3>Reviews</h3><div class="reviews-list">';
        if (book.reviews && book.reviews.length > 0) {
            book.reviews.forEach(review => {
                reviewsHTML += `
                    <div class="review-item">
                        <p class="review-user">${review.user || 'Anonymous'}</p>
                        <p class="review-rating">Rating: ${'⭐'.repeat(Math.round(review.rating || 0))} (${review.rating || 'N/A'})</p>
                        <p class="review-comment">${review.comment}</p>
                    </div>
                `;
            });
        } else {
            reviewsHTML += '<p>No reviews yet for this book.</p>';
        }
        reviewsHTML += '</div>';

        const authorBio = book.authorBio || `More information about ${book.author} is coming soon. This is a placeholder bio.`;

        container.innerHTML = `
            <div class="book-cover-container">
                <img src="${book.coverImage || 'images/placeholder_cover.png'}" alt="${book.title}" class="book-cover-high-res" onerror="this.onerror=null;this.src='images/placeholder_cover.png';">
            </div>
            <div class="book-info">
                <h2 class="book-main-title">${book.title}</h2>
                <p class="book-main-author">${book.author}
                    <a href="#" class="author-bio-link" data-author="${book.author}">(see bio)</a>
                </p>
                <span class="access-badge-single access-badge ${badgeClass}">${book.accessBadge}</span>
                <div class="rating" style="margin-bottom: 15px;">Overall Rating: ⭐ ${rating} (${book.reviews ? book.reviews.length : 0} reviews)</div>

                <p class="book-description">${book.description || 'No description available.'}</p>

                <div class="author-bio-section" style="display:none;">
                    <h3>About ${book.author}</h3>
                    <p class="author-bio-text">${authorBio}</p>
                </div>

                <div class="book-sample-preview">
                    <h3>Sample Preview</h3>
                    <div class="book-sample-preview-text">
                        ${book.sample || 'No sample available.'}
                    </div>
                </div>
                <div class="book-reviews">
                    ${reviewsHTML}
                </div>
                 <button class="add-to-list" data-book-id="${book.id}" style="margin-top: 20px; padding: 10px 15px;">Add to List</button>
                 <!-- Add more buttons like "Read Now", "Rent", "Buy" as needed -->
            </div>
        `;

        const authorBioLink = container.querySelector('.author-bio-link');
        if(authorBioLink) {
            authorBioLink.addEventListener('click', (e) => {
                e.preventDefault();
                const bioSection = container.querySelector('.author-bio-section');
                if(bioSection) {
                    bioSection.style.display = bioSection.style.display === 'none' ? 'block' : 'none';
                }
            });
        }
    }

    function displayRelatedBooks(currentBook, allBooksParam, container) {
        container.innerHTML = '';
        const related = allBooksParam.filter(book =>
            book.genre === currentBook.genre && book.id !== currentBook.id
        ).slice(0, 4);

        if (related.length > 0) {
            related.forEach(book => {
                // Using createBookCardForStore to ensure related books also link to their single pages
                container.innerHTML += createBookCardForStore(book);
            });
        } else {
            const popularFallback = allBooksParam.filter(book => book.id !== currentBook.id && (book.rating || 0) >= 4.5).slice(0,4);
            if (popularFallback.length > 0) {
                 popularFallback.forEach(book => {
                    container.innerHTML += createBookCardForStore(book);
                });
            } else {
                container.innerHTML = '<p>No related books found at this time.</p>';
            }
        }
    }
    // --- End of Single Book Page Specific Functions ---


    // --- Store Page Specific Functions ---
    let allBooksStore = []; // To store all books fetched for client-side filtering/sorting on store page

    async function loadStorePageContent() {
        try {
            // Use fetchAllBooks to ensure data is loaded and cached if needed
            allBooksStore = await fetchAllBooks();
            populateStoreBooks(allBooksStore);
            populateGenreFilterStore(allBooksStore);
            setupStoreEventListeners();
        } catch (error) {
            console.error("Failed to load store page content:", error);
            const storeGrid = document.getElementById('store-book-grid');
            if (storeGrid) storeGrid.innerHTML = `<p>Error loading books. Please try again later.</p>`;
        }
    }

    function populateStoreBooks(booksToDisplay) {
        const storeGrid = document.getElementById('store-book-grid');
        if (!storeGrid) return;

        storeGrid.innerHTML = ''; // Clear current books or loading message
        if (booksToDisplay.length === 0) {
            storeGrid.innerHTML = '<p>No books match your criteria.</p>';
            return;
        }
        booksToDisplay.forEach(book => {
            // Modify createBookCard to add a link to single.html
            const bookCardHTML = createBookCardForStore(book); // Use a modified card function
            storeGrid.innerHTML += bookCardHTML;
        });
    }

    // createBookCardForStore is now a global helper, no need to redefine if it's the same.

    function populateGenreFilterStore(books) {
        const genreFilterList = document.getElementById('genre-filter-list');
        if (!genreFilterList) return;

        const uniqueGenres = [...new Set(books.map(book => book.genre).filter(g => g))].sort(); // Filter out undefined/null genres and sort
        genreFilterList.innerHTML = ''; // Clear static/default genres
        uniqueGenres.forEach(genre => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<label><input type="checkbox" name="genre" value="${genre.toLowerCase()}"> ${genre}</label>`;
            genreFilterList.appendChild(listItem);
        });
    }

    function setupStoreEventListeners() {
        const searchBar = document.getElementById('search-bar');
        const sortDropdown = document.getElementById('sort-dropdown');
        const applyFiltersBtn = document.getElementById('apply-filters-btn');
        const ratingFilter = document.getElementById('rating-filter');

        if (searchBar) {
            searchBar.addEventListener('input', performSearchAndFilterAndSort);
        }
        if (sortDropdown) {
            sortDropdown.addEventListener('change', performSearchAndFilterAndSort);
        }
        if (ratingFilter) {
            ratingFilter.addEventListener('change', performSearchAndFilterAndSort);
        }
        const genreFilterList = document.getElementById('genre-filter-list');
        if (genreFilterList) {
             genreFilterList.addEventListener('change', function(event) {
                if (event.target.name === 'genre' && event.target.type === 'checkbox') {
                    performSearchAndFilterAndSort();
                }
            });
        }
        // If using Apply Filters button:
        if (applyFiltersBtn) { // This button might be removed if live filtering is preferred
            applyFiltersBtn.addEventListener('click', performSearchAndFilterAndSort);
        }
    }

    function performSearchAndFilterAndSort() {
        let filteredBooks = [...allBooksStore];

        const searchTerm = document.getElementById('search-bar')?.value.toLowerCase() || '';
        if (searchTerm) {
            filteredBooks = filteredBooks.filter(book =>
                book.title.toLowerCase().includes(searchTerm) ||
                book.author.toLowerCase().includes(searchTerm) ||
                (book.genre && book.genre.toLowerCase().includes(searchTerm))
            );
        }

        const selectedGenres = Array.from(document.querySelectorAll('#genre-filter-list input[name="genre"]:checked'))
                                    .map(cb => cb.value);
        if (selectedGenres.length > 0) {
            filteredBooks = filteredBooks.filter(book => book.genre && selectedGenres.includes(book.genre.toLowerCase()));
        }

        const minRating = parseFloat(document.getElementById('rating-filter')?.value || '0');
        if (minRating > 0) {
            filteredBooks = filteredBooks.filter(book => book.rating !== undefined && book.rating >= minRating);
        }

        const sortBy = document.getElementById('sort-dropdown')?.value || 'newest';
        switch (sortBy) {
            case 'popular':
                filteredBooks.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'title-asc':
                filteredBooks.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'title-desc':
                filteredBooks.sort((a, b) => b.title.localeCompare(a.title));
                break;
            case 'newest':
            default:
                 filteredBooks.sort((a, b) => parseInt(b.id || 0) - parseInt(a.id || 0));
                break;
        }
        populateStoreBooks(filteredBooks);
    }
    // --- End of Store Page Specific Functions ---

    // --- Charts Page Specific Functions ---
    async function loadChartsPageContent() {
        const readersChoiceList = document.getElementById('readers-choice-list');
        const criticsPicksList = document.getElementById('critics-picks-list');
        const timelessClassicsList = document.getElementById('timeless-classics-list');

        if (!readersChoiceList || !criticsPicksList || !timelessClassicsList) {
            console.warn("One or more chart list containers not found on charts page.");
            return;
        }

        try {
            let booksData = await fetchAllBooks(); // Ensure books are loaded

            if (booksData.length === 0) {
                throw new Error("No books data available to populate charts.");
            }

            // Reader's Choice: Highly rated (e.g., top 5 by rating)
            const readersChoiceBooks = [...booksData].sort((a,b) => (b.rating || 0) - (a.rating || 0)).slice(0, 5);
            populateChartList(readersChoiceBooks, readersChoiceList, true, "Reader's Choice");

            // Critic's Picks: Books flagged as "editorsChoice" (e.g., top 5)
            const criticsPicksBooks = booksData.filter(b => b.editorsChoice === true).slice(0, 5);
            populateChartList(criticsPicksBooks, criticsPicksList, false, "Critic's Pick");

            // Timeless Classics: (Simulated) e.g., older books (lower ID) with good ratings (e.g. >= 4.0)
            const timelessClassicsBooks = [...booksData]
                                            .filter(b => (b.rating || 0) >= 4.0)
                                            .sort((a,b) => parseInt(a.id || '9999') - parseInt(b.id || '9999'))
                                            .slice(0, 5);
            populateChartList(timelessClassicsBooks, timelessClassicsList, false, "Timeless Classic");

            setupChartsEventListeners();

        } catch (error) {
            console.error("Failed to load charts page content:", error);
            if(readersChoiceList) readersChoiceList.innerHTML = `<p>Error loading Reader's Choice: ${error.message}</p>`;
            if(criticsPicksList) criticsPicksList.innerHTML = `<p>Error loading Critic's Picks: ${error.message}</p>`;
            if(timelessClassicsList) timelessClassicsList.innerHTML = `<p>Error loading Timeless Classics: ${error.message}</p>`;
        }
    }

    function populateChartList(books, container, showVoting, chartNameForTooltip) {
        container.innerHTML = '';
        if (!books || books.length === 0) {
            container.innerHTML = `<p>No books to display in the ${chartNameForTooltip} chart currently.</p>`;
            return;
        }
        books.forEach((book, index) => {
            container.innerHTML += createChartItem(book, index + 1, showVoting, chartNameForTooltip);
        });
    }

    function createChartItem(book, rank, showVoting, chartNameForTooltip) {
        const voteButtonHTML = showVoting ? `<button class="vote-button" data-book-id="${book.id}" aria-label="Vote for ${book.title}">Vote</button>` : '';
        const shareButtonHTML = `<a href="#" class="share-button" data-book-id="${book.id}" title="Share ${book.title}" aria-label="Share ${book.title}">Share</a>`;
        const tooltipText = `${chartNameForTooltip} - Rank #${rank}: ${book.title}`;
        // The tooltip is attached to the rank span itself via title attribute for simplicity, CSS handles the styled tooltip via sibling selector
        const tooltipSpanHTML = `<span class="tooltip-text">${tooltipText}</span>`;


        return `
            <div class="chart-item" data-book-id="${book.id}">
                <span class="chart-item-rank" title="${tooltipText}" aria-label="Rank ${rank}">${rank}</span>
                <img src="${book.coverImage || 'images/placeholder_cover.png'}" alt="Cover of ${book.title}" class="chart-item-cover" onerror="this.src='images/placeholder_cover.png'; this.alt='Placeholder cover image';">
                <div class="chart-item-info">
                    <h3><a href="single.html?id=${book.id}">${book.title}</a></h3>
                    <p>by ${book.author}</p>
                    <div class="rating">⭐ ${typeof book.rating === 'number' ? book.rating.toFixed(1) : 'N/A'}</div>
                </div>
                <div class="chart-item-actions">
                    ${voteButtonHTML}
                    ${shareButtonHTML}
                </div>
                ${tooltipSpanHTML}
            </div>
        `;
    }

    function setupChartsEventListeners() {
        // Use event delegation on the .charts-page for dynamically added buttons
        const chartsPageContainer = document.querySelector('.charts-page');
        if (!chartsPageContainer) return;

        chartsPageContainer.addEventListener('click', function(event) {
            const target = event.target;

            if (target.classList.contains('vote-button') && !target.disabled) {
                const bookId = target.dataset.bookId;
                console.log(`Vote cast for book ID: ${bookId} (dummy action)`);
                target.textContent = 'Voted!';
                target.classList.add('voted');
                target.disabled = true;
                alert(`You voted for Book ID ${bookId}! (This is a dummy action)`);
            }

            if (target.classList.contents('share-button')) {
                event.preventDefault();
                const bookId = target.dataset.bookId;
                const chartItem = target.closest('.chart-item');
                let bookTitle = 'this book';
                if (chartItem) {
                    const titleElement = chartItem.querySelector('.chart-item-info h3 a');
                    if (titleElement) bookTitle = titleElement.textContent;
                }
                console.log(`Share button clicked for book ID: ${bookId} - ${bookTitle} (dummy action)`);
                alert(`Share '${bookTitle}' (ID: ${bookId}) - (Dummy link, no actual sharing implemented)`);
            }
        });
    }
    // --- End of Charts Page Specific Functions ---

    // --- Single Book Page Specific Functions ---
>>>>>>> REPLACE
```
```javascript
document.addEventListener('DOMContentLoaded', function() {
    console.log('LITLOUNGE-3 JavaScript loaded');

    // --- Global Variables & Initial Setup ---
    let allBooksData = []; // Cache for all book data
    let currentUserData = null; // To store the logged-in user's data (simulated)

    // --- Global Helper Functions ---
    async function fetchAllBooks() {
        if (allBooksData.length === 0) { // Only fetch if not already loaded
            try {
                const response = await fetch('data/books.json');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                allBooksData = await response.json();
            } catch (error) {
                console.error("Failed to load books data:", error);
                allBooksData = []; // Ensure it's an array even on error
            }
        }
        return allBooksData;
    }

    async function fetchUserData(userId = "user1") { // Default to user1 for demo
        // In a real app, userId would come from session/auth
        if (!currentUserData || currentUserData.id !== userId) {
            try {
                const response = await fetch('data/users.json');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const users = await response.json();
                currentUserData = users.find(user => user.id === userId);
                if (!currentUserData) {
                    console.warn(`User with ID ${userId} not found. Using default empty user.`);
                    // Provide a default structure if user not found, to prevent errors
                    currentUserData = {
                        id: userId,
                        username: "Guest",
                        profileImage: "images/user_avatar_placeholder.png",
                        readingLists: { currentlyReading: [], favorites: [], wantToRead: [] },
                        library: { saved: [], rented: [], subscribed: [] },
                        preferences: { favoriteGenres: [], notifications: false, darkMode: false },
                        readingStats: { booksReadThisMonth: 0, pagesReadThisWeek: 0, readingStreak: "0 days" }
                    };
                }
            } catch (error) {
                console.error("Failed to load user data:", error);
                currentUserData = null;
            }
        }
        return currentUserData;
    }

    function createBookCard(book, linkToSinglePage = false) {
        const rating = typeof book.rating === 'number' ? book.rating.toFixed(1) : 'N/A';
        const badgeClass = book.accessBadge ? book.accessBadge.toLowerCase() : 'free';
        const linkStart = linkToSinglePage ? `<a href="single.html?id=${book.id}" class="book-card-link">` : '';
        const linkEnd = linkToSinglePage ? '</a>' : '';

        return `
            <div class="book-card" data-book-id="${book.id}">
                ${linkStart}
                <img src="${book.coverImage || 'images/placeholder_cover.png'}" alt="${book.title}" class="book-cover" onerror="this.onerror=null;this.src='images/placeholder_cover.png';">
                <h3 class="book-title">${book.title}</h3>
                ${linkEnd}
                <p class="book-author">${book.author}</p>
                <div class="rating">⭐ ${rating}</div>
                <span class="access-badge ${badgeClass}">${book.accessBadge}</span>
                <button class="add-to-list">Add to List</button>
            </div>
        `;
    }

    // Modified book card for store/dashboard where links are always needed
    function createBookCardForStore(book) {
        const rating = typeof book.rating === 'number' ? book.rating.toFixed(1) : 'N/A';
        const badgeClass = book.accessBadge ? book.accessBadge.toLowerCase() : 'free';

        return `
            <div class="book-card" data-book-id="${book.id}">
                <a href="single.html?id=${book.id}" class="book-card-link">
                    <img src="${book.coverImage || 'images/placeholder_cover.png'}" alt="${book.title}" class="book-cover" onerror="this.onerror=null;this.src='images/placeholder_cover.png';">
                    <h3 class="book-title">${book.title}</h3>
                </a>
                <p class="book-author">${book.author}</p>
                <div class="rating">⭐ ${rating}</div>
                <span class="access-badge ${badgeClass}">${book.accessBadge}</span>
                <button class="add-to-list">Add to List</button>
            </div>
        `;
    }

    // --- Navigation Active State ---
    function updateActiveNav() {
        const currentPage = window.location.pathname.split("/").pop() || "index.html"; // Default to index.html if path is just "/"
        document.querySelectorAll('header nav a').forEach(link => {
            link.classList.remove('active-nav-main');
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active-nav-main');
            }
        });
    }


    // --- Homepage Specific Functions ---
    function initCarousel(carouselElement, carouselInnerElement) {
        if (!carouselElement || !carouselInnerElement || !carouselInnerElement.children.length) return;

        let currentIndex = 0;
        const items = Array.from(carouselInnerElement.children); // Convert HTMLCollection to Array
        const totalItems = items.length;
        if (totalItems === 0) return;

        let itemWidth = items[0].offsetWidth + parseInt(getComputedStyle(items[0]).marginRight) + parseInt(getComputedStyle(items[0]).marginLeft) ;

        const prevButton = document.createElement('button');
        prevButton.innerHTML = '&laquo;';
        prevButton.classList.add('carousel-prev-btn');
        Object.assign(prevButton.style, { position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: '10', padding: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', cursor: 'pointer' });


        const nextButton = document.createElement('button');
        nextButton.innerHTML = '&raquo;';
        nextButton.classList.add('carousel-next-btn');
        Object.assign(nextButton.style, { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: '10', padding: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', cursor: 'pointer' });

        carouselElement.appendChild(prevButton);
        carouselElement.appendChild(nextButton);

        function updateCarousel() {
            if (items.length === 0) return; // Prevent error if items are not yet loaded or empty
            itemWidth = items[0].offsetWidth + parseInt(getComputedStyle(items[0]).marginRight) + parseInt(getComputedStyle(items[0]).marginLeft);
            const containerWidth = carouselElement.offsetWidth;
            const itemsVisible = Math.floor(containerWidth / itemWidth) || 1; // Ensure at least 1 to avoid division by zero or NaN
            const maxIndex = totalItems > itemsVisible ? totalItems - itemsVisible : 0;

            if (currentIndex > maxIndex) currentIndex = maxIndex;
            if (currentIndex < 0) currentIndex = 0;

            const newTransformValue = -currentIndex * itemWidth;
            carouselInnerElement.style.transform = `translateX(${newTransformValue}px)`;
            prevButton.disabled = currentIndex === 0;
            nextButton.disabled = currentIndex === maxIndex;
        }

        prevButton.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateCarousel();
            }
        });

        nextButton.addEventListener('click', () => {
            const containerWidth = carouselElement.offsetWidth;
            const itemsVisible = Math.floor(containerWidth / itemWidth) || 1;
            if (currentIndex < totalItems - itemsVisible) {
                currentIndex++;
                updateCarousel();
            }
        });

        updateCarousel();
        window.addEventListener('resize', updateCarousel);
    }

    async function loadHomepageContent() {
        try {
            const books = await fetchAllBooks(); // Use global fetchAllBooks

            const featuredCarouselEl = document.querySelector('#hero .carousel');
            const trendingGrid = document.getElementById('trending-grid');
            const editorsGrid = document.getElementById('editors-grid');
            const hotPressGrid = document.getElementById('hot-press-grid');
            const genreGrid = document.getElementById('genre-grid');
            const personalizedGrid = document.getElementById('personalized-grid');


            if (featuredCarouselEl) {
                const carouselInner = document.createElement('div');
                carouselInner.classList.add('carousel-inner');
                books.filter(b => b.featured).slice(0, 5).forEach(book => {
                    carouselInner.innerHTML += createBookCard(book, true);
                });
                featuredCarouselEl.innerHTML = '';
                featuredCarouselEl.appendChild(carouselInner);

                // Ensure images are loaded before initializing carousel to get correct item widths
                let images = carouselInner.querySelectorAll('img');
                let loadedImages = 0;
                if (images.length === 0) {
                    initCarousel(featuredCarouselEl, carouselInner); // No images, init directly
                } else {
                    images.forEach(img => {
                        if (img.complete) {
                            loadedImages++;
                        } else {
                            img.onload = img.onerror = () => {
                                loadedImages++;
                                if (loadedImages === images.length) {
                                    initCarousel(featuredCarouselEl, carouselInner);
                                }
                            };
                        }
                    });
                    if (loadedImages === images.length && images.length > 0) { // All images were already cached
                         initCarousel(featuredCarouselEl, carouselInner);
                    }
                }
            }

            if (trendingGrid) {
                trendingGrid.innerHTML = '';
                books.filter(b => b.trending).slice(0, 6).forEach(book => {
                    trendingGrid.innerHTML += createBookCard(book, true);
                });
            }

            if (editorsGrid) {
                editorsGrid.innerHTML = '';
                books.filter(b => b.editorsChoice).slice(0, 6).forEach(book => {
                    editorsGrid.innerHTML += createBookCard(book, true);
                });
            }

            if (hotPressGrid) {
                hotPressGrid.innerHTML = '';
                books.filter(b => b.hotOffPress).slice(0, 6).forEach(book => {
                    hotPressGrid.innerHTML += createBookCard(book, true);
                });
            }

            if (genreGrid) {
                genreGrid.innerHTML = '';
                const uniqueGenres = [...new Set(books.map(b => b.genre).filter(g => g))].slice(0, 6);
                uniqueGenres.forEach(genre => {
                    genreGrid.innerHTML += createGenreItem(genre);
                });
            }

            if (personalizedGrid) {
                personalizedGrid.innerHTML = '';
                books.filter(b => b.rating >= 4.5).slice(0, 3).forEach(book => {
                    personalizedGrid.innerHTML += createBookCard(book, true);
                });
            }

        } catch (error) {
            console.error("Failed to load books for homepage:", error);
            const grids = document.querySelectorAll('.book-grid, .carousel, .genre-grid');
            grids.forEach(grid => {
                if(grid) grid.innerHTML = `<p>Error loading content. Please try again later.</p>`;
            });
        }
    }

    function createGenreItem(genre) {
        return `
            <div class="genre-item" data-genre="${genre.toLowerCase()}">
                ${genre}
            </div>
        `;
    }

    // --- Single Book Page Specific Functions ---
    async function loadSingleBookPageContent() {
        const bookDetailContent = document.getElementById('book-detail-content');
        const relatedBooksGrid = document.getElementById('related-books-grid');
        if (!bookDetailContent || !relatedBooksGrid) return;

        const params = new URLSearchParams(window.location.search);
        const bookId = params.get('id');

        if (!bookId) {
            bookDetailContent.innerHTML = "<p>Book ID not provided. Cannot display details.</p>";
            relatedBooksGrid.innerHTML = "";
            return;
        }

        try {
            const books = await fetchAllBooks();

            const currentBook = books.find(book => book.id === bookId);

            if (!currentBook) {
                bookDetailContent.innerHTML = `<p>Book with ID ${bookId} not found.</p>`;
                relatedBooksGrid.innerHTML = "";
                return;
            }

            displayBookDetails(currentBook, bookDetailContent);
            displayRelatedBooks(currentBook, books, relatedBooksGrid);

        } catch (error) {
            console.error("Failed to load single book page content:", error);
            bookDetailContent.innerHTML = `<p>Error loading book details. Please try again later.</p>`;
            relatedBooksGrid.innerHTML = "";
        }
    }

    function displayBookDetails(book, container) {
        const rating = typeof book.rating === 'number' ? book.rating.toFixed(1) : 'N/A';
        const badgeClass = book.accessBadge ? book.accessBadge.toLowerCase() : 'free';

        let reviewsHTML = '<h3>Reviews</h3><div class="reviews-list">';
        if (book.reviews && book.reviews.length > 0) {
            book.reviews.forEach(review => {
                reviewsHTML += `
                    <div class="review-item">
                        <p class="review-user">${review.user || 'Anonymous'}</p>
                        <p class="review-rating">Rating: ${'⭐'.repeat(Math.round(review.rating || 0))} (${review.rating || 'N/A'})</p>
                        <p class="review-comment">${review.comment}</p>
                    </div>
                `;
            });
        } else {
            reviewsHTML += '<p>No reviews yet for this book.</p>';
        }
        reviewsHTML += '</div>';

        const authorBio = book.authorBio || `More information about ${book.author} is coming soon. This is a placeholder bio.`;

        container.innerHTML = `
            <div class="book-cover-container">
                <img src="${book.coverImage || 'images/placeholder_cover.png'}" alt="${book.title}" class="book-cover-high-res" onerror="this.onerror=null;this.src='images/placeholder_cover.png';">
            </div>
            <div class="book-info">
                <h2 class="book-main-title">${book.title}</h2>
                <p class="book-main-author">${book.author}
                    <a href="#" class="author-bio-link" data-author="${book.author}">(see bio)</a>
                </p>
                <span class="access-badge-single access-badge ${badgeClass}">${book.accessBadge}</span>
                <div class="rating" style="margin-bottom: 15px;">Overall Rating: ⭐ ${rating} (${book.reviews ? book.reviews.length : 0} reviews)</div>

                <p class="book-description">${book.description || 'No description available.'}</p>

                <div class="author-bio-section" style="display:none;">
                    <h3>About ${book.author}</h3>
                    <p class="author-bio-text">${authorBio}</p>
                </div>

                <div class="book-sample-preview">
                    <h3>Sample Preview</h3>
                    <div class="book-sample-preview-text">
                        ${book.sample || 'No sample available.'}
                    </div>
                </div>
                <div class="book-reviews">
                    ${reviewsHTML}
                </div>
                 <button class="add-to-list" data-book-id="${book.id}" style="margin-top: 20px; padding: 10px 15px;">Add to List</button>
                 <!-- Add more buttons like "Read Now", "Rent", "Buy" as needed -->
            </div>
        `;

        const authorBioLink = container.querySelector('.author-bio-link');
        if(authorBioLink) {
            authorBioLink.addEventListener('click', (e) => {
                e.preventDefault();
                const bioSection = container.querySelector('.author-bio-section');
                if(bioSection) {
                    bioSection.style.display = bioSection.style.display === 'none' ? 'block' : 'none';
                }
            });
        }
    }

    function displayRelatedBooks(currentBook, allBooksParam, container) {
        container.innerHTML = '';
        const related = allBooksParam.filter(book =>
            book.genre === currentBook.genre && book.id !== currentBook.id
        ).slice(0, 4);

        if (related.length > 0) {
            related.forEach(book => {
                // Using createBookCardForStore to ensure related books also link to their single pages
                container.innerHTML += createBookCardForStore(book);
            });
        } else {
            const popularFallback = allBooksParam.filter(book => book.id !== currentBook.id && (book.rating || 0) >= 4.5).slice(0,4);
            if (popularFallback.length > 0) {
                 popularFallback.forEach(book => {
                    container.innerHTML += createBookCardForStore(book);
                });
            } else {
                container.innerHTML = '<p>No related books found at this time.</p>';
            }
        }
    }
    // --- End of Single Book Page Specific Functions ---

    // --- Store Page Specific Functions ---
    let allBooksStore = []; // To store all books fetched for client-side filtering/sorting on store page

    async function loadStorePageContent() {
        try {
            // Use fetchAllBooks to ensure data is loaded and cached if needed
            allBooksStore = await fetchAllBooks();
            populateStoreBooks(allBooksStore);
            populateGenreFilterStore(allBooksStore);
            setupStoreEventListeners();
        } catch (error) {
            console.error("Failed to load store page content:", error);
            const storeGrid = document.getElementById('store-book-grid');
            if (storeGrid) storeGrid.innerHTML = `<p>Error loading books. Please try again later.</p>`;
        }
    }

    function populateStoreBooks(booksToDisplay) {
        const storeGrid = document.getElementById('store-book-grid');
        if (!storeGrid) return;

        storeGrid.innerHTML = ''; // Clear current books or loading message
        if (booksToDisplay.length === 0) {
            storeGrid.innerHTML = '<p>No books match your criteria.</p>';
            return;
        }
        booksToDisplay.forEach(book => {
            // Modify createBookCard to add a link to single.html
            const bookCardHTML = createBookCardForStore(book); // Use a modified card function
            storeGrid.innerHTML += bookCardHTML;
        });
    }

    // createBookCardForStore is now a global helper, no need to redefine if it's the same.

    function populateGenreFilterStore(books) {
        const genreFilterList = document.getElementById('genre-filter-list');
        if (!genreFilterList) return;

        const uniqueGenres = [...new Set(books.map(book => book.genre).filter(g => g))].sort(); // Filter out undefined/null genres and sort
        genreFilterList.innerHTML = ''; // Clear static/default genres
        uniqueGenres.forEach(genre => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<label><input type="checkbox" name="genre" value="${genre.toLowerCase()}"> ${genre}</label>`;
            genreFilterList.appendChild(listItem);
        });
    }

    function setupStoreEventListeners() {
        const searchBar = document.getElementById('search-bar');
        const sortDropdown = document.getElementById('sort-dropdown');
        const applyFiltersBtn = document.getElementById('apply-filters-btn');
        const ratingFilter = document.getElementById('rating-filter');

        if (searchBar) {
            searchBar.addEventListener('input', performSearchAndFilterAndSort);
        }
        if (sortDropdown) {
            sortDropdown.addEventListener('change', performSearchAndFilterAndSort);
        }
        if (ratingFilter) {
            ratingFilter.addEventListener('change', performSearchAndFilterAndSort);
        }
        const genreFilterList = document.getElementById('genre-filter-list');
        if (genreFilterList) {
             genreFilterList.addEventListener('change', function(event) {
                if (event.target.name === 'genre' && event.target.type === 'checkbox') {
                    performSearchAndFilterAndSort();
                }
            });
        }
        // If using Apply Filters button:
        if (applyFiltersBtn) { // This button might be removed if live filtering is preferred
            applyFiltersBtn.addEventListener('click', performSearchAndFilterAndSort);
        }
    }

    function performSearchAndFilterAndSort() {
        let filteredBooks = [...allBooksStore];

        const searchTerm = document.getElementById('search-bar')?.value.toLowerCase() || '';
        if (searchTerm) {
            filteredBooks = filteredBooks.filter(book =>
                book.title.toLowerCase().includes(searchTerm) ||
                book.author.toLowerCase().includes(searchTerm) ||
                (book.genre && book.genre.toLowerCase().includes(searchTerm))
            );
        }

        const selectedGenres = Array.from(document.querySelectorAll('#genre-filter-list input[name="genre"]:checked'))
                                    .map(cb => cb.value);
        if (selectedGenres.length > 0) {
            filteredBooks = filteredBooks.filter(book => book.genre && selectedGenres.includes(book.genre.toLowerCase()));
        }

        const minRating = parseFloat(document.getElementById('rating-filter')?.value || '0');
        if (minRating > 0) {
            filteredBooks = filteredBooks.filter(book => book.rating !== undefined && book.rating >= minRating);
        }

        const sortBy = document.getElementById('sort-dropdown')?.value || 'newest';
        switch (sortBy) {
            case 'popular':
                filteredBooks.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'title-asc':
                filteredBooks.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'title-desc':
                filteredBooks.sort((a, b) => b.title.localeCompare(a.title));
                break;
            case 'newest':
            default:
                 filteredBooks.sort((a, b) => parseInt(b.id || 0) - parseInt(a.id || 0));
                break;
        }
        populateStoreBooks(filteredBooks);
    }
    // --- End of Store Page Specific Functions ---

    // --- Charts Page Specific Functions ---
    async function loadChartsPageContent() {
        const readersChoiceList = document.getElementById('readers-choice-list');
        const criticsPicksList = document.getElementById('critics-picks-list');
        const timelessClassicsList = document.getElementById('timeless-classics-list');

        if (!readersChoiceList || !criticsPicksList || !timelessClassicsList) {
            console.warn("One or more chart list containers not found on charts page.");
            return;
        }

        try {
            let booksData = await fetchAllBooks(); // Ensure books are loaded

            if (booksData.length === 0) {
                throw new Error("No books data available to populate charts.");
            }

            // Reader's Choice: Highly rated (e.g., top 5 by rating)
            const readersChoiceBooks = [...booksData].sort((a,b) => (b.rating || 0) - (a.rating || 0)).slice(0, 5);
            populateChartList(readersChoiceBooks, readersChoiceList, true, "Reader's Choice");

            // Critic's Picks: Books flagged as "editorsChoice" (e.g., top 5)
            const criticsPicksBooks = booksData.filter(b => b.editorsChoice === true).slice(0, 5);
            populateChartList(criticsPicksBooks, criticsPicksList, false, "Critic's Pick");

            // Timeless Classics: (Simulated) e.g., older books (lower ID) with good ratings (e.g. >= 4.0)
            const timelessClassicsBooks = [...booksData]
                                            .filter(b => (b.rating || 0) >= 4.0)
                                            .sort((a,b) => parseInt(a.id || '9999') - parseInt(b.id || '9999'))
                                            .slice(0, 5);
            populateChartList(timelessClassicsBooks, timelessClassicsList, false, "Timeless Classic");

            setupChartsEventListeners();

        } catch (error) {
            console.error("Failed to load charts page content:", error);
            if(readersChoiceList) readersChoiceList.innerHTML = `<p>Error loading Reader's Choice: ${error.message}</p>`;
            if(criticsPicksList) criticsPicksList.innerHTML = `<p>Error loading Critic's Picks: ${error.message}</p>`;
            if(timelessClassicsList) timelessClassicsList.innerHTML = `<p>Error loading Timeless Classics: ${error.message}</p>`;
        }
    }

    function populateChartList(books, container, showVoting, chartNameForTooltip) {
        container.innerHTML = '';
        if (!books || books.length === 0) {
            container.innerHTML = `<p>No books to display in the ${chartNameForTooltip} chart currently.</p>`;
            return;
        }
        books.forEach((book, index) => {
            container.innerHTML += createChartItem(book, index + 1, showVoting, chartNameForTooltip);
        });
    }

    function createChartItem(book, rank, showVoting, chartNameForTooltip) {
        const voteButtonHTML = showVoting ? `<button class="vote-button" data-book-id="${book.id}" aria-label="Vote for ${book.title}">Vote</button>` : '';
        const shareButtonHTML = `<a href="#" class="share-button" data-book-id="${book.id}" title="Share ${book.title}" aria-label="Share ${book.title}">Share</a>`;
        const tooltipText = `${chartNameForTooltip} - Rank #${rank}: ${book.title}`;
        // The tooltip is attached to the rank span itself via title attribute for simplicity, CSS handles the styled tooltip via sibling selector
        const tooltipSpanHTML = `<span class="tooltip-text">${tooltipText}</span>`;


        return `
            <div class="chart-item" data-book-id="${book.id}">
                <span class="chart-item-rank" title="${tooltipText}" aria-label="Rank ${rank}">${rank}</span>
                <img src="${book.coverImage || 'images/placeholder_cover.png'}" alt="Cover of ${book.title}" class="chart-item-cover" onerror="this.src='images/placeholder_cover.png'; this.alt='Placeholder cover image';">
                <div class="chart-item-info">
                    <h3><a href="single.html?id=${book.id}">${book.title}</a></h3>
                    <p>by ${book.author}</p>
                    <div class="rating">⭐ ${typeof book.rating === 'number' ? book.rating.toFixed(1) : 'N/A'}</div>
                </div>
                <div class="chart-item-actions">
                    ${voteButtonHTML}
                    ${shareButtonHTML}
                </div>
                ${tooltipSpanHTML}
            </div>
        `;
    }

    function setupChartsEventListeners() {
        // Use event delegation on the .charts-page for dynamically added buttons
        const chartsPageContainer = document.querySelector('.charts-page');
        if (!chartsPageContainer) return;

        chartsPageContainer.addEventListener('click', function(event) {
            const target = event.target;

            if (target.classList.contains('vote-button') && !target.disabled) {
                const bookId = target.dataset.bookId;
                console.log(`Vote cast for book ID: ${bookId} (dummy action)`);
                target.textContent = 'Voted!';
                target.classList.add('voted');
                target.disabled = true;
                alert(`You voted for Book ID ${bookId}! (This is a dummy action)`);
            }

            if (target.classList.contains('share-button')) {
                event.preventDefault();
                const bookId = target.dataset.bookId;
                const chartItem = target.closest('.chart-item');
                let bookTitle = 'this book';
                if (chartItem) {
                    const titleElement = chartItem.querySelector('.chart-item-info h3 a');
                    if (titleElement) bookTitle = titleElement.textContent;
                }
                console.log(`Share button clicked for book ID: ${bookId} - ${bookTitle} (dummy action)`);
                alert(`Share '${bookTitle}' (ID: ${bookId}) - (Dummy link, no actual sharing implemented)`);
            }
        });
    }
    // --- End of Charts Page Specific Functions ---

    // --- Single Book Page Specific Functions ---
>>>>>>> REPLACE
```
```javascript
document.addEventListener('DOMContentLoaded', function() {
    console.log('LITLOUNGE-3 JavaScript loaded');

    // --- Global Variables & Initial Setup ---
    let allBooksData = []; // Cache for all book data
    let currentUserData = null; // To store the logged-in user's data (simulated)

    // --- Global Helper Functions ---
    async function fetchAllBooks() {
        if (allBooksData.length === 0) { // Only fetch if not already loaded
            try {
                const response = await fetch('data/books.json');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                allBooksData = await response.json();
            } catch (error) {
                console.error("Failed to load books data:", error);
                allBooksData = []; // Ensure it's an array even on error
            }
        }
        return allBooksData;
    }

    async function fetchUserData(userId = "user1") { // Default to user1 for demo
        // In a real app, userId would come from session/auth
        if (!currentUserData || currentUserData.id !== userId) {
            try {
                const response = await fetch('data/users.json');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const users = await response.json();
                currentUserData = users.find(user => user.id === userId);
                if (!currentUserData) {
                    console.warn(`User with ID ${userId} not found. Using default empty user.`);
                    // Provide a default structure if user not found, to prevent errors
                    currentUserData = {
                        id: userId,
                        username: "Guest",
                        profileImage: "images/user_avatar_placeholder.png",
                        readingLists: { currentlyReading: [], favorites: [], wantToRead: [] },
                        library: { saved: [], rented: [], subscribed: [] },
                        preferences: { favoriteGenres: [], notifications: false, darkMode: false },
                        readingStats: { booksReadThisMonth: 0, pagesReadThisWeek: 0, readingStreak: "0 days" }
                    };
                }
            } catch (error) {
                console.error("Failed to load user data:", error);
                currentUserData = null;
            }
        }
        return currentUserData;
    }

    function createBookCard(book, linkToSinglePage = false) {
        const rating = typeof book.rating === 'number' ? book.rating.toFixed(1) : 'N/A';
        const badgeClass = book.accessBadge ? book.accessBadge.toLowerCase() : 'free';
        const linkStart = linkToSinglePage ? `<a href="single.html?id=${book.id}" class="book-card-link">` : '';
        const linkEnd = linkToSinglePage ? '</a>' : '';

        return `
            <div class="book-card" data-book-id="${book.id}">
                ${linkStart}
                <img src="${book.coverImage || 'images/placeholder_cover.png'}" alt="${book.title}" class="book-cover" onerror="this.onerror=null;this.src='images/placeholder_cover.png';">
                <h3 class="book-title">${book.title}</h3>
                ${linkEnd}
                <p class="book-author">${book.author}</p>
                <div class="rating">⭐ ${rating}</div>
                <span class="access-badge ${badgeClass}">${book.accessBadge}</span>
                <button class="add-to-list">Add to List</button>
            </div>
        `;
    }

    // Modified book card for store/dashboard where links are always needed
    function createBookCardForStore(book) {
        const rating = typeof book.rating === 'number' ? book.rating.toFixed(1) : 'N/A';
        const badgeClass = book.accessBadge ? book.accessBadge.toLowerCase() : 'free';

        return `
            <div class="book-card" data-book-id="${book.id}">
                <a href="single.html?id=${book.id}" class="book-card-link">
                    <img src="${book.coverImage || 'images/placeholder_cover.png'}" alt="${book.title}" class="book-cover" onerror="this.onerror=null;this.src='images/placeholder_cover.png';">
                    <h3 class="book-title">${book.title}</h3>
                </a>
                <p class="book-author">${book.author}</p>
                <div class="rating">⭐ ${rating}</div>
                <span class="access-badge ${badgeClass}">${book.accessBadge}</span>
                <button class="add-to-list">Add to List</button>
            </div>
        `;
    }

    // --- Navigation Active State ---
    function updateActiveNav() {
        const currentPage = window.location.pathname.split("/").pop() || "index.html"; // Default to index.html if path is just "/"
        document.querySelectorAll('header nav a').forEach(link => {
            link.classList.remove('active-nav-main');
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active-nav-main');
            }
        });
    }


    // --- Homepage Specific Functions ---
    function initCarousel(carouselElement, carouselInnerElement) {
        if (!carouselElement || !carouselInnerElement || !carouselInnerElement.children.length) return;

        let currentIndex = 0;
        const items = Array.from(carouselInnerElement.children); // Convert HTMLCollection to Array
        const totalItems = items.length;
        if (totalItems === 0) return;

        let itemWidth = items[0].offsetWidth + parseInt(getComputedStyle(items[0]).marginRight) + parseInt(getComputedStyle(items[0]).marginLeft) ;

        const prevButton = document.createElement('button');
        prevButton.innerHTML = '&laquo;';
        prevButton.classList.add('carousel-prev-btn');
        Object.assign(prevButton.style, { position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: '10', padding: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', cursor: 'pointer' });


        const nextButton = document.createElement('button');
        nextButton.innerHTML = '&raquo;';
        nextButton.classList.add('carousel-next-btn');
        Object.assign(nextButton.style, { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: '10', padding: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', cursor: 'pointer' });

        carouselElement.appendChild(prevButton);
        carouselElement.appendChild(nextButton);

        function updateCarousel() {
            if (items.length === 0) return; // Prevent error if items are not yet loaded or empty
            itemWidth = items[0].offsetWidth + parseInt(getComputedStyle(items[0]).marginRight) + parseInt(getComputedStyle(items[0]).marginLeft);
            const containerWidth = carouselElement.offsetWidth;
            const itemsVisible = Math.floor(containerWidth / itemWidth) || 1; // Ensure at least 1 to avoid division by zero or NaN
            const maxIndex = totalItems > itemsVisible ? totalItems - itemsVisible : 0;

            if (currentIndex > maxIndex) currentIndex = maxIndex;
            if (currentIndex < 0) currentIndex = 0;

            const newTransformValue = -currentIndex * itemWidth;
            carouselInnerElement.style.transform = `translateX(${newTransformValue}px)`;
            prevButton.disabled = currentIndex === 0;
            nextButton.disabled = currentIndex === maxIndex;
        }

        prevButton.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateCarousel();
            }
        });

        nextButton.addEventListener('click', () => {
            const containerWidth = carouselElement.offsetWidth;
            const itemsVisible = Math.floor(containerWidth / itemWidth) || 1;
            if (currentIndex < totalItems - itemsVisible) {
                currentIndex++;
                updateCarousel();
            }
        });

        updateCarousel();
        window.addEventListener('resize', updateCarousel);
    }

    async function loadHomepageContent() {
        try {
            const books = await fetchAllBooks(); // Use global fetchAllBooks

            const featuredCarouselEl = document.querySelector('#hero .carousel');
            const trendingGrid = document.getElementById('trending-grid');
            const editorsGrid = document.getElementById('editors-grid');
            const hotPressGrid = document.getElementById('hot-press-grid');
            const genreGrid = document.getElementById('genre-grid');
            const personalizedGrid = document.getElementById('personalized-grid');


            if (featuredCarouselEl) {
                const carouselInner = document.createElement('div');
                carouselInner.classList.add('carousel-inner');
                books.filter(b => b.featured).slice(0, 5).forEach(book => {
                    carouselInner.innerHTML += createBookCard(book, true);
                });
                featuredCarouselEl.innerHTML = '';
                featuredCarouselEl.appendChild(carouselInner);

                // Ensure images are loaded before initializing carousel to get correct item widths
                let images = carouselInner.querySelectorAll('img');
                let loadedImages = 0;
                if (images.length === 0) {
                    initCarousel(featuredCarouselEl, carouselInner); // No images, init directly
                } else {
                    images.forEach(img => {
                        if (img.complete) {
                            loadedImages++;
                        } else {
                            img.onload = img.onerror = () => {
                                loadedImages++;
                                if (loadedImages === images.length) {
                                    initCarousel(featuredCarouselEl, carouselInner);
                                }
                            };
                        }
                    });
                    if (loadedImages === images.length && images.length > 0) { // All images were already cached
                         initCarousel(featuredCarouselEl, carouselInner);
                    }
                }
            }

            if (trendingGrid) {
                trendingGrid.innerHTML = '';
                books.filter(b => b.trending).slice(0, 6).forEach(book => {
                    trendingGrid.innerHTML += createBookCard(book, true);
                });
            }

            if (editorsGrid) {
                editorsGrid.innerHTML = '';
                books.filter(b => b.editorsChoice).slice(0, 6).forEach(book => {
                    editorsGrid.innerHTML += createBookCard(book, true);
                });
            }

            if (hotPressGrid) {
                hotPressGrid.innerHTML = '';
                books.filter(b => b.hotOffPress).slice(0, 6).forEach(book => {
                    hotPressGrid.innerHTML += createBookCard(book, true);
                });
            }

            if (genreGrid) {
                genreGrid.innerHTML = '';
                const uniqueGenres = [...new Set(books.map(b => b.genre).filter(g => g))].slice(0, 6);
                uniqueGenres.forEach(genre => {
                    genreGrid.innerHTML += createGenreItem(genre);
                });
            }

            if (personalizedGrid) {
                personalizedGrid.innerHTML = '';
                books.filter(b => b.rating >= 4.5).slice(0, 3).forEach(book => {
                    personalizedGrid.innerHTML += createBookCard(book, true);
                });
            }

        } catch (error) {
            console.error("Failed to load books for homepage:", error);
            const grids = document.querySelectorAll('.book-grid, .carousel, .genre-grid');
            grids.forEach(grid => {
                if(grid) grid.innerHTML = `<p>Error loading content. Please try again later.</p>`;
            });
        }
    }

    function createGenreItem(genre) {
        return `
            <div class="genre-item" data-genre="${genre.toLowerCase()}">
                ${genre}
            </div>
        `;
    }

    // --- Single Book Page Specific Functions ---
    async function loadSingleBookPageContent() {
        const bookDetailContent = document.getElementById('book-detail-content');
        const relatedBooksGrid = document.getElementById('related-books-grid');
        if (!bookDetailContent || !relatedBooksGrid) return;

        const params = new URLSearchParams(window.location.search);
        const bookId = params.get('id');

        if (!bookId) {
            bookDetailContent.innerHTML = "<p>Book ID not provided. Cannot display details.</p>";
            relatedBooksGrid.innerHTML = "";
            return;
        }

        try {
            // In a real app, allBooksData might be globally available or managed by a state system
            // For now, re-fetch if not already loaded, or assume it's loaded by another part of the script.
            // To be safe for this isolated page load:
            let booksData = [];
            if (typeof allBooksStore !== 'undefined' && allBooksStore.length > 0) { // Check if store page already loaded it
                booksData = allBooksStore;
            } else if (typeof allBooks !== 'undefined' && allBooks.length > 0) { // Check if homepage already loaded it (less likely for single page)
                 booksData = allBooks; // 'allBooks' is used by homepage, 'allBooksStore' by store page
            } else {
                const response = await fetch('data/books.json');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                booksData = await response.json();
            }

            const currentBook = booksData.find(book => book.id === bookId);

            if (!currentBook) {
                bookDetailContent.innerHTML = `<p>Book with ID ${bookId} not found.</p>`;
                relatedBooksGrid.innerHTML = "";
                return;
            }

            displayBookDetails(currentBook, bookDetailContent);
            displayRelatedBooks(currentBook, booksData, relatedBooksGrid);

        } catch (error) {
            console.error("Failed to load single book page content:", error);
            bookDetailContent.innerHTML = `<p>Error loading book details. Please try again later.</p>`;
            relatedBooksGrid.innerHTML = "";
        }
    }

    function displayBookDetails(book, container) {
        const rating = typeof book.rating === 'number' ? book.rating.toFixed(1) : 'N/A';
        const badgeClass = book.accessBadge ? book.accessBadge.toLowerCase() : 'free';

        let reviewsHTML = '<h3>Reviews</h3><div class="reviews-list">';
        if (book.reviews && book.reviews.length > 0) {
            book.reviews.forEach(review => {
                reviewsHTML += `
                    <div class="review-item">
                        <p class="review-user">${review.user || 'Anonymous'}</p>
                        <p class="review-rating">Rating: ${'⭐'.repeat(Math.round(review.rating || 0))} (${review.rating || 'N/A'})</p>
                        <p class="review-comment">${review.comment}</p>
                    </div>
                `;
            });
        } else {
            reviewsHTML += '<p>No reviews yet for this book.</p>';
        }
        reviewsHTML += '</div>';

        const authorBio = book.authorBio || `More information about ${book.author} is coming soon. This is a placeholder bio.`;

        container.innerHTML = `
            <div class="book-cover-container">
                <img src="${book.coverImage || 'images/placeholder_cover.png'}" alt="${book.title}" class="book-cover-high-res" onerror="this.onerror=null;this.src='images/placeholder_cover.png';">
            </div>
            <div class="book-info">
                <h2 class="book-main-title">${book.title}</h2>
                <p class="book-main-author">${book.author}
                    <a href="#" class="author-bio-link" data-author="${book.author}">(see bio)</a>
                </p>
                <span class="access-badge-single access-badge ${badgeClass}">${book.accessBadge}</span>
                <div class="rating" style="margin-bottom: 15px;">Overall Rating: ⭐ ${rating} (${book.reviews ? book.reviews.length : 0} reviews)</div>

                <p class="book-description">${book.description || 'No description available.'}</p>

                <div class="author-bio-section" style="display:none;">
                    <h3>About ${book.author}</h3>
                    <p class="author-bio-text">${authorBio}</p>
                </div>

                <div class="book-sample-preview">
                    <h3>Sample Preview</h3>
                    <div class="book-sample-preview-text">
                        ${book.sample || 'No sample available.'}
                    </div>
                </div>
                <div class="book-reviews">
                    ${reviewsHTML}
                </div>
                 <button class="add-to-list" data-book-id="${book.id}" style="margin-top: 20px; padding: 10px 15px;">Add to List</button>
                 <!-- Add more buttons like "Read Now", "Rent", "Buy" as needed -->
            </div>
        `;

        const authorBioLink = container.querySelector('.author-bio-link');
        if(authorBioLink) {
            authorBioLink.addEventListener('click', (e) => {
                e.preventDefault();
                const bioSection = container.querySelector('.author-bio-section');
                if(bioSection) {
                    bioSection.style.display = bioSection.style.display === 'none' ? 'block' : 'none';
                }
            });
        }
    }

    function displayRelatedBooks(currentBook, allBooksParam, container) {
        container.innerHTML = '';
        const related = allBooksParam.filter(book =>
            book.genre === currentBook.genre && book.id !== currentBook.id
        ).slice(0, 4);

        if (related.length > 0) {
            related.forEach(book => {
                // Using createBookCardForStore to ensure related books also link to their single pages
                container.innerHTML += createBookCardForStore(book);
            });
        } else {
            const popularFallback = allBooksParam.filter(book => book.id !== currentBook.id && (book.rating || 0) >= 4.5).slice(0,4);
            if (popularFallback.length > 0) {
                 popularFallback.forEach(book => {
                    container.innerHTML += createBookCardForStore(book);
                });
            } else {
                container.innerHTML = '<p>No related books found at this time.</p>';
            }
        }
    }
    // --- End of Single Book Page Specific Functions ---

    // --- Store Page Specific Functions ---
    let allBooksStore = []; // To store all books fetched for client-side filtering/sorting on store page

    async function loadStorePageContent() {
        try {
            // Use fetchAllBooks to ensure data is loaded and cached if needed
            allBooksStore = await fetchAllBooks();
            populateStoreBooks(allBooksStore);
            populateGenreFilterStore(allBooksStore);
            setupStoreEventListeners();
        } catch (error) {
            console.error("Failed to load store page content:", error);
            const storeGrid = document.getElementById('store-book-grid');
            if (storeGrid) storeGrid.innerHTML = `<p>Error loading books. Please try again later.</p>`;
        }
    }

    function populateStoreBooks(booksToDisplay) {
        const storeGrid = document.getElementById('store-book-grid');
        if (!storeGrid) return;

        storeGrid.innerHTML = ''; // Clear current books or loading message
        if (booksToDisplay.length === 0) {
            storeGrid.innerHTML = '<p>No books match your criteria.</p>';
            return;
        }
        booksToDisplay.forEach(book => {
            // Modify createBookCard to add a link to single.html
            const bookCardHTML = createBookCardForStore(book); // Use a modified card function
            storeGrid.innerHTML += bookCardHTML;
        });
    }

    // createBookCardForStore is now a global helper, no need to redefine if it's the same.

    function populateGenreFilterStore(books) {
        const genreFilterList = document.getElementById('genre-filter-list');
        if (!genreFilterList) return;

        const uniqueGenres = [...new Set(books.map(book => book.genre).filter(g => g))].sort(); // Filter out undefined/null genres and sort
        genreFilterList.innerHTML = ''; // Clear static/default genres
        uniqueGenres.forEach(genre => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<label><input type="checkbox" name="genre" value="${genre.toLowerCase()}"> ${genre}</label>`;
            genreFilterList.appendChild(listItem);
        });
    }

    function setupStoreEventListeners() {
        const searchBar = document.getElementById('search-bar');
        const sortDropdown = document.getElementById('sort-dropdown');
        const applyFiltersBtn = document.getElementById('apply-filters-btn');
        const ratingFilter = document.getElementById('rating-filter');

        if (searchBar) {
            searchBar.addEventListener('input', performSearchAndFilterAndSort);
        }
        if (sortDropdown) {
            sortDropdown.addEventListener('change', performSearchAndFilterAndSort);
        }
        if (ratingFilter) {
            ratingFilter.addEventListener('change', performSearchAndFilterAndSort);
        }
        const genreFilterList = document.getElementById('genre-filter-list');
        if (genreFilterList) {
             genreFilterList.addEventListener('change', function(event) {
                if (event.target.name === 'genre' && event.target.type === 'checkbox') {
                    performSearchAndFilterAndSort();
                }
            });
        }
        // If using Apply Filters button:
        if (applyFiltersBtn) { // This button might be removed if live filtering is preferred
            applyFiltersBtn.addEventListener('click', performSearchAndFilterAndSort);
        }
    }

    function performSearchAndFilterAndSort() {
        let filteredBooks = [...allBooksStore];

        const searchTerm = document.getElementById('search-bar')?.value.toLowerCase() || '';
        if (searchTerm) {
            filteredBooks = filteredBooks.filter(book =>
                book.title.toLowerCase().includes(searchTerm) ||
                book.author.toLowerCase().includes(searchTerm) ||
                (book.genre && book.genre.toLowerCase().includes(searchTerm))
            );
        }

        const selectedGenres = Array.from(document.querySelectorAll('#genre-filter-list input[name="genre"]:checked'))
                                    .map(cb => cb.value);
        if (selectedGenres.length > 0) {
            filteredBooks = filteredBooks.filter(book => book.genre && selectedGenres.includes(book.genre.toLowerCase()));
        }

        const minRating = parseFloat(document.getElementById('rating-filter')?.value || '0');
        if (minRating > 0) {
            filteredBooks = filteredBooks.filter(book => book.rating !== undefined && book.rating >= minRating);
        }

        const sortBy = document.getElementById('sort-dropdown')?.value || 'newest';
        switch (sortBy) {
            case 'popular':
                filteredBooks.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'title-asc':
                filteredBooks.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'title-desc':
                filteredBooks.sort((a, b) => b.title.localeCompare(a.title));
                break;
            case 'newest':
            default:
                 filteredBooks.sort((a, b) => parseInt(b.id || 0) - parseInt(a.id || 0));
                break;
        }
        populateStoreBooks(filteredBooks);
    }
    // --- End of Store Page Specific Functions ---

    // --- Charts Page Specific Functions ---
    async function loadChartsPageContent() {
        const readersChoiceList = document.getElementById('readers-choice-list');
        const criticsPicksList = document.getElementById('critics-picks-list');
        const timelessClassicsList = document.getElementById('timeless-classics-list');

        if (!readersChoiceList || !criticsPicksList || !timelessClassicsList) {
            console.warn("One or more chart list containers not found on charts page.");
            return;
        }

        try {
            let booksData = await fetchAllBooks(); // Ensure books are loaded

            if (booksData.length === 0) {
                throw new Error("No books data available to populate charts.");
            }

            // Reader's Choice: Highly rated (e.g., top 5 by rating)
            const readersChoiceBooks = [...booksData].sort((a,b) => (b.rating || 0) - (a.rating || 0)).slice(0, 5);
            populateChartList(readersChoiceBooks, readersChoiceList, true, "Reader's Choice");

            // Critic's Picks: Books flagged as "editorsChoice" (e.g., top 5)
            const criticsPicksBooks = booksData.filter(b => b.editorsChoice === true).slice(0, 5);
            populateChartList(criticsPicksBooks, criticsPicksList, false, "Critic's Pick");

            // Timeless Classics: (Simulated) e.g., older books (lower ID) with good ratings (e.g. >= 4.0)
            const timelessClassicsBooks = [...booksData]
                                            .filter(b => (b.rating || 0) >= 4.0)
                                            .sort((a,b) => parseInt(a.id || '9999') - parseInt(b.id || '9999'))
                                            .slice(0, 5);
            populateChartList(timelessClassicsBooks, timelessClassicsList, false, "Timeless Classic");

            setupChartsEventListeners();

        } catch (error) {
            console.error("Failed to load charts page content:", error);
            if(readersChoiceList) readersChoiceList.innerHTML = `<p>Error loading Reader's Choice: ${error.message}</p>`;
            if(criticsPicksList) criticsPicksList.innerHTML = `<p>Error loading Critic's Picks: ${error.message}</p>`;
            if(timelessClassicsList) timelessClassicsList.innerHTML = `<p>Error loading Timeless Classics: ${error.message}</p>`;
        }
    }

    function populateChartList(books, container, showVoting, chartNameForTooltip) {
        container.innerHTML = '';
        if (!books || books.length === 0) {
            container.innerHTML = `<p>No books to display in the ${chartNameForTooltip} chart currently.</p>`;
            return;
        }
        books.forEach((book, index) => {
            container.innerHTML += createChartItem(book, index + 1, showVoting, chartNameForTooltip);
        });
    }

    function createChartItem(book, rank, showVoting, chartNameForTooltip) {
        const voteButtonHTML = showVoting ? `<button class="vote-button" data-book-id="${book.id}" aria-label="Vote for ${book.title}">Vote</button>` : '';
        const shareButtonHTML = `<a href="#" class="share-button" data-book-id="${book.id}" title="Share ${book.title}" aria-label="Share ${book.title}">Share</a>`;
        const tooltipText = `${chartNameForTooltip} - Rank #${rank}: ${book.title}`;
        // The tooltip is attached to the rank span itself via title attribute for simplicity, CSS handles the styled tooltip via sibling selector
        const tooltipSpanHTML = `<span class="tooltip-text">${tooltipText}</span>`;


        return `
            <div class="chart-item" data-book-id="${book.id}">
                <span class="chart-item-rank" title="${tooltipText}" aria-label="Rank ${rank}">${rank}</span>
                <img src="${book.coverImage || 'images/placeholder_cover.png'}" alt="Cover of ${book.title}" class="chart-item-cover" onerror="this.src='images/placeholder_cover.png'; this.alt='Placeholder cover image';">
                <div class="chart-item-info">
                    <h3><a href="single.html?id=${book.id}">${book.title}</a></h3>
                    <p>by ${book.author}</p>
                    <div class="rating">⭐ ${typeof book.rating === 'number' ? book.rating.toFixed(1) : 'N/A'}</div>
                </div>
                <div class="chart-item-actions">
                    ${voteButtonHTML}
                    ${shareButtonHTML}
                </div>
                ${tooltipSpanHTML}
            </div>
        `;
    }

    function setupChartsEventListeners() {
        // Use event delegation on the .charts-page for dynamically added buttons
        const chartsPageContainer = document.querySelector('.charts-page');
        if (!chartsPageContainer) return;

        chartsPageContainer.addEventListener('click', function(event) {
            const target = event.target;

            if (target.classList.contains('vote-button') && !target.disabled) {
                const bookId = target.dataset.bookId;
                console.log(`Vote cast for book ID: ${bookId} (dummy action)`);
                target.textContent = 'Voted!';
                target.classList.add('voted');
                target.disabled = true;
                alert(`You voted for Book ID ${bookId}! (This is a dummy action)`);
            }

            if (target.classList.contains('share-button')) {
                event.preventDefault();
                const bookId = target.dataset.bookId;
                const chartItem = target.closest('.chart-item');
                let bookTitle = 'this book';
                if (chartItem) {
                    const titleElement = chartItem.querySelector('.chart-item-info h3 a');
                    if (titleElement) bookTitle = titleElement.textContent;
                }
                console.log(`Share button clicked for book ID: ${bookId} - ${bookTitle} (dummy action)`);
                alert(`Share '${bookTitle}' (ID: ${bookId}) - (Dummy link, no actual sharing implemented)`);
            }
        });
    }
    // --- End of Charts Page Specific Functions ---

    // --- Single Book Page Specific Functions ---
>>>>>>> REPLACE
```
```javascript
document.addEventListener('DOMContentLoaded', function() {
    console.log('LITLOUNGE-3 JavaScript loaded');

    // --- Global Variables & Initial Setup ---
    let allBooksData = []; // Cache for all book data
    let currentUserData = null; // To store the logged-in user's data (simulated)

    // --- Global Helper Functions ---
    async function fetchAllBooks() {
        if (allBooksData.length === 0) { // Only fetch if not already loaded
            try {
                const response = await fetch('data/books.json');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                allBooksData = await response.json();
            } catch (error) {
                console.error("Failed to load books data:", error);
                allBooksData = []; // Ensure it's an array even on error
            }
        }
        return allBooksData;
    }

    async function fetchUserData(userId = "user1") { // Default to user1 for demo
        // In a real app, userId would come from session/auth
        if (!currentUserData || currentUserData.id !== userId) {
            try {
                const response = await fetch('data/users.json');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const users = await response.json();
                currentUserData = users.find(user => user.id === userId);
                if (!currentUserData) {
                    console.warn(`User with ID ${userId} not found. Using default empty user.`);
                    // Provide a default structure if user not found, to prevent errors
                    currentUserData = {
                        id: userId,
                        username: "Guest",
                        profileImage: "images/user_avatar_placeholder.png",
                        readingLists: { currentlyReading: [], favorites: [], wantToRead: [] },
                        library: { saved: [], rented: [], subscribed: [] },
                        preferences: { favoriteGenres: [], notifications: false, darkMode: false },
                        readingStats: { booksReadThisMonth: 0, pagesReadThisWeek: 0, readingStreak: "0 days" }
                    };
                }
            } catch (error) {
                console.error("Failed to load user data:", error);
                currentUserData = null;
            }
        }
        return currentUserData;
    }

    function createBookCard(book, linkToSinglePage = false) {
        const rating = typeof book.rating === 'number' ? book.rating.toFixed(1) : 'N/A';
        const badgeClass = book.accessBadge ? book.accessBadge.toLowerCase() : 'free';
        const linkStart = linkToSinglePage ? `<a href="single.html?id=${book.id}" class="book-card-link">` : '';
        const linkEnd = linkToSinglePage ? '</a>' : '';

        return `
            <div class="book-card" data-book-id="${book.id}">
                ${linkStart}
                <img src="${book.coverImage || 'images/placeholder_cover.png'}" alt="${book.title}" class="book-cover" onerror="this.onerror=null;this.src='images/placeholder_cover.png';">
                <h3 class="book-title">${book.title}</h3>
                ${linkEnd}
                <p class="book-author">${book.author}</p>
                <div class="rating">⭐ ${rating}</div>
                <span class="access-badge ${badgeClass}">${book.accessBadge}</span>
                <button class="add-to-list">Add to List</button>
            </div>
        `;
    }

    // Modified book card for store/dashboard where links are always needed
    function createBookCardForStore(book) {
        const rating = typeof book.rating === 'number' ? book.rating.toFixed(1) : 'N/A';
        const badgeClass = book.accessBadge ? book.accessBadge.toLowerCase() : 'free';

        return `
            <div class="book-card" data-book-id="${book.id}">
                <a href="single.html?id=${book.id}" class="book-card-link">
                    <img src="${book.coverImage || 'images/placeholder_cover.png'}" alt="${book.title}" class="book-cover" onerror="this.onerror=null;this.src='images/placeholder_cover.png';">
                    <h3 class="book-title">${book.title}</h3>
                </a>
                <p class="book-author">${book.author}</p>
                <div class="rating">⭐ ${rating}</div>
                <span class="access-badge ${badgeClass}">${book.accessBadge}</span>
                <button class="add-to-list">Add to List</button>
            </div>
        `;
    }

    // --- Navigation Active State ---
    function updateActiveNav() {
        const currentPage = window.location.pathname.split("/").pop() || "index.html"; // Default to index.html if path is just "/"
        document.querySelectorAll('header nav a').forEach(link => {
            link.classList.remove('active-nav-main');
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active-nav-main');
            }
        });
    }


    // --- Homepage Specific Functions ---
    function initCarousel(carouselElement, carouselInnerElement) {
        if (!carouselElement || !carouselInnerElement || !carouselInnerElement.children.length) return;

        let currentIndex = 0;
        const items = Array.from(carouselInnerElement.children); // Convert HTMLCollection to Array
        const totalItems = items.length;
        if (totalItems === 0) return;

        let itemWidth = items[0].offsetWidth + parseInt(getComputedStyle(items[0]).marginRight) + parseInt(getComputedStyle(items[0]).marginLeft) ;

        const prevButton = document.createElement('button');
        prevButton.innerHTML = '&laquo;';
        prevButton.classList.add('carousel-prev-btn');
        Object.assign(prevButton.style, { position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: '10', padding: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', cursor: 'pointer' });


        const nextButton = document.createElement('button');
        nextButton.innerHTML = '&raquo;';
        nextButton.classList.add('carousel-next-btn');
        Object.assign(nextButton.style, { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: '10', padding: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', cursor: 'pointer' });

        carouselElement.appendChild(prevButton);
        carouselElement.appendChild(nextButton);

        function updateCarousel() {
            if (items.length === 0) return; // Prevent error if items are not yet loaded or empty
            itemWidth = items[0].offsetWidth + parseInt(getComputedStyle(items[0]).marginRight) + parseInt(getComputedStyle(items[0]).marginLeft);
            const containerWidth = carouselElement.offsetWidth;
            const itemsVisible = Math.floor(containerWidth / itemWidth) || 1; // Ensure at least 1 to avoid division by zero or NaN
            const maxIndex = totalItems > itemsVisible ? totalItems - itemsVisible : 0;

            if (currentIndex > maxIndex) currentIndex = maxIndex;
            if (currentIndex < 0) currentIndex = 0;

            const newTransformValue = -currentIndex * itemWidth;
            carouselInnerElement.style.transform = `translateX(${newTransformValue}px)`;
            prevButton.disabled = currentIndex === 0;
            nextButton.disabled = currentIndex === maxIndex;
        }

        prevButton.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateCarousel();
            }
        });

        nextButton.addEventListener('click', () => {
            const containerWidth = carouselElement.offsetWidth;
            const itemsVisible = Math.floor(containerWidth / itemWidth) || 1;
            if (currentIndex < totalItems - itemsVisible) {
                currentIndex++;
                updateCarousel();
            }
        });

        updateCarousel();
        window.addEventListener('resize', updateCarousel);
    }

    async function loadHomepageContent() {
        try {
            const books = await fetchAllBooks(); // Use global fetchAllBooks

            const featuredCarouselEl = document.querySelector('#hero .carousel');
            const trendingGrid = document.getElementById('trending-grid');
            const editorsGrid = document.getElementById('editors-grid');
            const hotPressGrid = document.getElementById('hot-press-grid');
            const genreGrid = document.getElementById('genre-grid');
            const personalizedGrid = document.getElementById('personalized-grid');


            if (featuredCarouselEl) {
                const carouselInner = document.createElement('div');
                carouselInner.classList.add('carousel-inner');
                books.filter(b => b.featured).slice(0, 5).forEach(book => {
                    carouselInner.innerHTML += createBookCard(book, true);
                });
                featuredCarouselEl.innerHTML = '';
                featuredCarouselEl.appendChild(carouselInner);

                // Ensure images are loaded before initializing carousel to get correct item widths
                let images = carouselInner.querySelectorAll('img');
                let loadedImages = 0;
                if (images.length === 0) {
                    initCarousel(featuredCarouselEl, carouselInner); // No images, init directly
                } else {
                    images.forEach(img => {
                        if (img.complete) {
                            loadedImages++;
                        } else {
                            img.onload = img.onerror = () => {
                                loadedImages++;
                                if (loadedImages === images.length) {
                                    initCarousel(featuredCarouselEl, carouselInner);
                                }
                            };
                        }
                    });
                    if (loadedImages === images.length && images.length > 0) { // All images were already cached
                         initCarousel(featuredCarouselEl, carouselInner);
                    }
                }
            }

            if (trendingGrid) {
                trendingGrid.innerHTML = '';
                books.filter(b => b.trending).slice(0, 6).forEach(book => {
                    trendingGrid.innerHTML += createBookCard(book, true);
                });
            }

            if (editorsGrid) {
                editorsGrid.innerHTML = '';
                books.filter(b => b.editorsChoice).slice(0, 6).forEach(book => {
                    editorsGrid.innerHTML += createBookCard(book, true);
                });
            }

            if (hotPressGrid) {
                hotPressGrid.innerHTML = '';
                books.filter(b => b.hotOffPress).slice(0, 6).forEach(book => {
                    hotPressGrid.innerHTML += createBookCard(book, true);
                });
            }

            if (genreGrid) {
                genreGrid.innerHTML = '';
                const uniqueGenres = [...new Set(books.map(b => b.genre).filter(g => g))].slice(0, 6);
                uniqueGenres.forEach(genre => {
                    genreGrid.innerHTML += createGenreItem(genre);
                });
            }

            if (personalizedGrid) {
                personalizedGrid.innerHTML = '';
                books.filter(b => b.rating >= 4.5).slice(0, 3).forEach(book => {
                    personalizedGrid.innerHTML += createBookCard(book, true);
                });
            }

        } catch (error) {
            console.error("Failed to load books for homepage:", error);
            const grids = document.querySelectorAll('.book-grid, .carousel, .genre-grid');
            grids.forEach(grid => {
                if(grid) grid.innerHTML = `<p>Error loading content. Please try again later.</p>`;
            });
        }
    }

    function createGenreItem(genre) {
        return `
            <div class="genre-item" data-genre="${genre.toLowerCase()}">
                ${genre}
            </div>
        `;
    }

    // --- Single Book Page Specific Functions ---
    async function loadSingleBookPageContent() {
        const bookDetailContent = document.getElementById('book-detail-content');
        const relatedBooksGrid = document.getElementById('related-books-grid');
        if (!bookDetailContent || !relatedBooksGrid) return;

        const params = new URLSearchParams(window.location.search);
        const bookId = params.get('id');

        if (!bookId) {
            bookDetailContent.innerHTML = "<p>Book ID not provided. Cannot display details.</p>";
            relatedBooksGrid.innerHTML = "";
            return;
        }

        try {
            // In a real app, allBooksData might be globally available or managed by a state system
            // For now, re-fetch if not already loaded, or assume it's loaded by another part of the script.
            // To be safe for this isolated page load:
            let booksData = [];
            if (typeof allBooksStore !== 'undefined' && allBooksStore.length > 0) { // Check if store page already loaded it
                booksData = allBooksStore;
            } else if (typeof allBooks !== 'undefined' && allBooks.length > 0) { // Check if homepage already loaded it (less likely for single page)
                 booksData = allBooks; // 'allBooks' is used by homepage, 'allBooksStore' by store page
            } else {
                const response = await fetch('data/books.json');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                booksData = await response.json();
            }

            const currentBook = booksData.find(book => book.id === bookId);

            if (!currentBook) {
                bookDetailContent.innerHTML = `<p>Book with ID ${bookId} not found.</p>`;
                relatedBooksGrid.innerHTML = "";
                return;
            }

            displayBookDetails(currentBook, bookDetailContent);
            displayRelatedBooks(currentBook, booksData, relatedBooksGrid);

        } catch (error) {
            console.error("Failed to load single book page content:", error);
            bookDetailContent.innerHTML = `<p>Error loading book details. Please try again later.</p>`;
            relatedBooksGrid.innerHTML = "";
        }
    }

    function displayBookDetails(book, container) {
        const rating = typeof book.rating === 'number' ? book.rating.toFixed(1) : 'N/A';
        const badgeClass = book.accessBadge ? book.accessBadge.toLowerCase() : 'free';

        let reviewsHTML = '<h3>Reviews</h3><div class="reviews-list">';
        if (book.reviews && book.reviews.length > 0) {
            book.reviews.forEach(review => {
                reviewsHTML += `
                    <div class="review-item">
                        <p class="review-user">${review.user || 'Anonymous'}</p>
                        <p class="review-rating">Rating: ${'⭐'.repeat(Math.round(review.rating || 0))} (${review.rating || 'N/A'})</p>
                        <p class="review-comment">${review.comment}</p>
                    </div>
                `;
            });
        } else {
            reviewsHTML += '<p>No reviews yet for this book.</p>';
        }
        reviewsHTML += '</div>';

        const authorBio = book.authorBio || `More information about ${book.author} is coming soon. This is a placeholder bio.`;

        container.innerHTML = `
            <div class="book-cover-container">
                <img src="${book.coverImage || 'images/placeholder_cover.png'}" alt="${book.title}" class="book-cover-high-res" onerror="this.onerror=null;this.src='images/placeholder_cover.png';">
            </div>
            <div class="book-info">
                <h2 class="book-main-title">${book.title}</h2>
                <p class="book-main-author">${book.author}
                    <a href="#" class="author-bio-link" data-author="${book.author}">(see bio)</a>
                </p>
                <span class="access-badge-single access-badge ${badgeClass}">${book.accessBadge}</span>
                <div class="rating" style="margin-bottom: 15px;">Overall Rating: ⭐ ${rating} (${book.reviews ? book.reviews.length : 0} reviews)</div>

                <p class="book-description">${book.description || 'No description available.'}</p>

                <div class="author-bio-section" style="display:none;">
                    <h3>About ${book.author}</h3>
                    <p class="author-bio-text">${authorBio}</p>
                </div>

                <div class="book-sample-preview">
                    <h3>Sample Preview</h3>
                    <div class="book-sample-preview-text">
                        ${book.sample || 'No sample available.'}
                    </div>
                </div>
                <div class="book-reviews">
                    ${reviewsHTML}
                </div>
                 <button class="add-to-list" data-book-id="${book.id}" style="margin-top: 20px; padding: 10px 15px;">Add to List</button>
                 <!-- Add more buttons like "Read Now", "Rent", "Buy" as needed -->
            </div>
        `;

        const authorBioLink = container.querySelector('.author-bio-link');
        if(authorBioLink) {
            authorBioLink.addEventListener('click', (e) => {
                e.preventDefault();
                const bioSection = container.querySelector('.author-bio-section');
                if(bioSection) {
                    bioSection.style.display = bioSection.style.display === 'none' ? 'block' : 'none';
                }
            });
        }
    }

    function displayRelatedBooks(currentBook, allBooksParam, container) {
        container.innerHTML = '';
        const related = allBooksParam.filter(book =>
            book.genre === currentBook.genre && book.id !== currentBook.id
        ).slice(0, 4);

        if (related.length > 0) {
            related.forEach(book => {
                // Using createBookCardForStore to ensure related books also link to their single pages
                container.innerHTML += createBookCardForStore(book);
            });
        } else {
            const popularFallback = allBooksParam.filter(book => book.id !== currentBook.id && (book.rating || 0) >= 4.5).slice(0,4);
            if (popularFallback.length > 0) {
                 popularFallback.forEach(book => {
                    container.innerHTML += createBookCardForStore(book);
                });
            } else {
                container.innerHTML = '<p>No related books found at this time.</p>';
            }
        }
    }
    // --- End of Single Book Page Specific Functions ---

    // --- Store Page Specific Functions ---
    let allBooksStore = []; // To store all books fetched for client-side filtering/sorting on store page

    async function loadStorePageContent() {
        try {
            // Use fetchAllBooks to ensure data is loaded and cached if needed
            allBooksStore = await fetchAllBooks();
            populateStoreBooks(allBooksStore);
            populateGenreFilterStore(allBooksStore);
            setupStoreEventListeners();
        } catch (error) {
            console.error("Failed to load store page content:", error);
            const storeGrid = document.getElementById('store-book-grid');
            if (storeGrid) storeGrid.innerHTML = `<p>Error loading books. Please try again later.</p>`;
        }
    }

    function populateStoreBooks(booksToDisplay) {
        const storeGrid = document.getElementById('store-book-grid');
        if (!storeGrid) return;

        storeGrid.innerHTML = ''; // Clear current books or loading message
        if (booksToDisplay.length === 0) {
            storeGrid.innerHTML = '<p>No books match your criteria.</p>';
            return;
        }
        booksToDisplay.forEach(book => {
            // Modify createBookCard to add a link to single.html
            const bookCardHTML = createBookCardForStore(book); // Use a modified card function
            storeGrid.innerHTML += bookCardHTML;
        });
    }

    // createBookCardForStore is now a global helper, no need to redefine if it's the same.

    function populateGenreFilterStore(books) {
        const genreFilterList = document.getElementById('genre-filter-list');
        if (!genreFilterList) return;

        const uniqueGenres = [...new Set(books.map(book => book.genre).filter(g => g))].sort(); // Filter out undefined/null genres and sort
        genreFilterList.innerHTML = ''; // Clear static/default genres
        uniqueGenres.forEach(genre => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<label><input type="checkbox" name="genre" value="${genre.toLowerCase()}"> ${genre}</label>`;
            genreFilterList.appendChild(listItem);
        });
    }

    function setupStoreEventListeners() {
        const searchBar = document.getElementById('search-bar');
        const sortDropdown = document.getElementById('sort-dropdown');
        const applyFiltersBtn = document.getElementById('apply-filters-btn');
        const ratingFilter = document.getElementById('rating-filter');

        if (searchBar) {
            searchBar.addEventListener('input', performSearchAndFilterAndSort);
        }
        if (sortDropdown) {
            sortDropdown.addEventListener('change', performSearchAndFilterAndSort);
        }
        if (ratingFilter) {
            ratingFilter.addEventListener('change', performSearchAndFilterAndSort);
        }
        const genreFilterList = document.getElementById('genre-filter-list');
        if (genreFilterList) {
             genreFilterList.addEventListener('change', function(event) {
                if (event.target.name === 'genre' && event.target.type === 'checkbox') {
                    performSearchAndFilterAndSort();
                }
            });
        }
        // If using Apply Filters button:
        if (applyFiltersBtn) { // This button might be removed if live filtering is preferred
            applyFiltersBtn.addEventListener('click', performSearchAndFilterAndSort);
        }
    }

    function performSearchAndFilterAndSort() {
        let filteredBooks = [...allBooksStore];

        const searchTerm = document.getElementById('search-bar')?.value.toLowerCase() || '';
        if (searchTerm) {
            filteredBooks = filteredBooks.filter(book =>
                book.title.toLowerCase().includes(searchTerm) ||
                book.author.toLowerCase().includes(searchTerm) ||
                (book.genre && book.genre.toLowerCase().includes(searchTerm))
            );
        }

        const selectedGenres = Array.from(document.querySelectorAll('#genre-filter-list input[name="genre"]:checked'))
                                    .map(cb => cb.value);
        if (selectedGenres.length > 0) {
            filteredBooks = filteredBooks.filter(book => book.genre && selectedGenres.includes(book.genre.toLowerCase()));
        }

        const minRating = parseFloat(document.getElementById('rating-filter')?.value || '0');
        if (minRating > 0) {
            filteredBooks = filteredBooks.filter(book => book.rating !== undefined && book.rating >= minRating);
        }

        const sortBy = document.getElementById('sort-dropdown')?.value || 'newest';
        switch (sortBy) {
            case 'popular':
                filteredBooks.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'title-asc':
                filteredBooks.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'title-desc':
                filteredBooks.sort((a, b) => b.title.localeCompare(a.title));
                break;
            case 'newest':
            default:
                 filteredBooks.sort((a, b) => parseInt(b.id || 0) - parseInt(a.id || 0));
                break;
        }
        populateStoreBooks(filteredBooks);
    }
    // --- End of Store Page Specific Functions ---

    // --- Charts Page Specific Functions ---
    async function loadChartsPageContent() {
        const readersChoiceList = document.getElementById('readers-choice-list');
        const criticsPicksList = document.getElementById('critics-picks-list');
        const timelessClassicsList = document.getElementById('timeless-classics-list');

        if (!readersChoiceList || !criticsPicksList || !timelessClassicsList) {
            console.warn("One or more chart list containers not found on charts page.");
            return;
        }

        try {
            let booksData = await fetchAllBooks(); // Ensure books are loaded

            if (booksData.length === 0) {
                throw new Error("No books data available to populate charts.");
            }

            // Reader's Choice: Highly rated (e.g., top 5 by rating)
            const readersChoiceBooks = [...booksData].sort((a,b) => (b.rating || 0) - (a.rating || 0)).slice(0, 5);
            populateChartList(readersChoiceBooks, readersChoiceList, true, "Reader's Choice");

            // Critic's Picks: Books flagged as "editorsChoice" (e.g., top 5)
            const criticsPicksBooks = booksData.filter(b => b.editorsChoice === true).slice(0, 5);
            populateChartList(criticsPicksBooks, criticsPicksList, false, "Critic's Pick");

            // Timeless Classics: (Simulated) e.g., older books (lower ID) with good ratings (e.g. >= 4.0)
            const timelessClassicsBooks = [...booksData]
                                            .filter(b => (b.rating || 0) >= 4.0)
                                            .sort((a,b) => parseInt(a.id || '9999') - parseInt(b.id || '9999'))
                                            .slice(0, 5);
            populateChartList(timelessClassicsBooks, timelessClassicsList, false, "Timeless Classic");

            setupChartsEventListeners();

        } catch (error) {
            console.error("Failed to load charts page content:", error);
            if(readersChoiceList) readersChoiceList.innerHTML = `<p>Error loading Reader's Choice: ${error.message}</p>`;
            if(criticsPicksList) criticsPicksList.innerHTML = `<p>Error loading Critic's Picks: ${error.message}</p>`;
            if(timelessClassicsList) timelessClassicsList.innerHTML = `<p>Error loading Timeless Classics: ${error.message}</p>`;
        }
    }

    function populateChartList(books, container, showVoting, chartNameForTooltip) {
        container.innerHTML = '';
        if (!books || books.length === 0) {
            container.innerHTML = `<p>No books to display in the ${chartNameForTooltip} chart currently.</p>`;
            return;
        }
        books.forEach((book, index) => {
            container.innerHTML += createChartItem(book, index + 1, showVoting, chartNameForTooltip);
        });
    }

    function createChartItem(book, rank, showVoting, chartNameForTooltip) {
        const voteButtonHTML = showVoting ? `<button class="vote-button" data-book-id="${book.id}" aria-label="Vote for ${book.title}">Vote</button>` : '';
        const shareButtonHTML = `<a href="#" class="share-button" data-book-id="${book.id}" title="Share ${book.title}" aria-label="Share ${book.title}">Share</a>`;
        const tooltipText = `${chartNameForTooltip} - Rank #${rank}: ${book.title}`;
        // The tooltip is attached to the rank span itself via title attribute for simplicity, CSS handles the styled tooltip via sibling selector
        const tooltipSpanHTML = `<span class="tooltip-text">${tooltipText}</span>`;


        return `
            <div class="chart-item" data-book-id="${book.id}">
                <span class="chart-item-rank" title="${tooltipText}" aria-label="Rank ${rank}">${rank}</span>
                <img src="${book.coverImage || 'images/placeholder_cover.png'}" alt="Cover of ${book.title}" class="chart-item-cover" onerror="this.src='images/placeholder_cover.png'; this.alt='Placeholder cover image';">
                <div class="chart-item-info">
                    <h3><a href="single.html?id=${book.id}">${book.title}</a></h3>
                    <p>by ${book.author}</p>
                    <div class="rating">⭐ ${typeof book.rating === 'number' ? book.rating.toFixed(1) : 'N/A'}</div>
                </div>
                <div class="chart-item-actions">
                    ${voteButtonHTML}
                    ${shareButtonHTML}
                </div>
                ${tooltipSpanHTML}
            </div>
        `;
    }

    function setupChartsEventListeners() {
        // Use event delegation on the .charts-page for dynamically added buttons
        const chartsPageContainer = document.querySelector('.charts-page');
        if (!chartsPageContainer) return;

        chartsPageContainer.addEventListener('click', function(event) {
            const target = event.target;

            if (target.classList.contains('vote-button') && !target.disabled) {
                const bookId = target.dataset.bookId;
                console.log(`Vote cast for book ID: ${bookId} (dummy action)`);
                target.textContent = 'Voted!';
                target.classList.add('voted');
                target.disabled = true;
                alert(`You voted for Book ID ${bookId}! (This is a dummy action)`);
            }

            if (target.classList.contains('share-button')) {
                event.preventDefault();
                const bookId = target.dataset.bookId;
                const chartItem = target.closest('.chart-item');
                let bookTitle = 'this book';
                if (chartItem) {
                    const titleElement = chartItem.querySelector('.chart-item-info h3 a');
                    if (titleElement) bookTitle = titleElement.textContent;
                }
                console.log(`Share button clicked for book ID: ${bookId} - ${bookTitle} (dummy action)`);
                alert(`Share '${bookTitle}' (ID: ${bookId}) - (Dummy link, no actual sharing implemented)`);
            }
        });
    }
    // --- End of Charts Page Specific Functions ---

    // --- Single Book Page Specific Functions ---
>>>>>>> REPLACE
```
```javascript
document.addEventListener('DOMContentLoaded', function() {
    console.log('LITLOUNGE-3 JavaScript loaded');

    // --- Global Variables & Initial Setup ---
    let allBooksData = []; // Cache for all book data
    let currentUserData = null; // To store the logged-in user's data (simulated)

    // --- Global Helper Functions ---
    async function fetchAllBooks() {
        if (allBooksData.length === 0) { // Only fetch if not already loaded
            try {
                const response = await fetch('data/books.json');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                allBooksData = await response.json();
            } catch (error) {
                console.error("Failed to load books data:", error);
                allBooksData = []; // Ensure it's an array even on error
            }
        }
        return allBooksData;
    }

    async function fetchUserData(userId = "user1") { // Default to user1 for demo
        // In a real app, userId would come from session/auth
        if (!currentUserData || currentUserData.id !== userId) {
            try {
                const response = await fetch('data/users.json');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const users = await response.json();
                currentUserData = users.find(user => user.id === userId);
                if (!currentUserData) {
                    console.warn(`User with ID ${userId} not found. Using default empty user.`);
                    // Provide a default structure if user not found, to prevent errors
                    currentUserData = {
                        id: userId,
                        username: "Guest",
                        profileImage: "images/user_avatar_placeholder.png",
                        readingLists: { currentlyReading: [], favorites: [], wantToRead: [] },
                        library: { saved: [], rented: [], subscribed: [] },
                        preferences: { favoriteGenres: [], notifications: false, darkMode: false },
                        readingStats: { booksReadThisMonth: 0, pagesReadThisWeek: 0, readingStreak: "0 days" }
                    };
                }
            } catch (error) {
                console.error("Failed to load user data:", error);
                currentUserData = null;
            }
        }
        return currentUserData;
    }

    function createBookCard(book, linkToSinglePage = false) {
        const rating = typeof book.rating === 'number' ? book.rating.toFixed(1) : 'N/A';
        const badgeClass = book.accessBadge ? book.accessBadge.toLowerCase() : 'free';
        const linkStart = linkToSinglePage ? `<a href="single.html?id=${book.id}" class="book-card-link">` : '';
        const linkEnd = linkToSinglePage ? '</a>' : '';

        return `
            <div class="book-card" data-book-id="${book.id}">
                ${linkStart}
                <img src="${book.coverImage || 'images/placeholder_cover.png'}" alt="${book.title}" class="book-cover" onerror="this.onerror=null;this.src='images/placeholder_cover.png';">
                <h3 class="book-title">${book.title}</h3>
                ${linkEnd}
                <p class="book-author">${book.author}</p>
                <div class="rating">⭐ ${rating}</div>
                <span class="access-badge ${badgeClass}">${book.accessBadge}</span>
                <button class="add-to-list">Add to List</button>
            </div>
        `;
    }

    // Modified book card for store/dashboard where links are always needed
    function createBookCardForStore(book) {
        const rating = typeof book.rating === 'number' ? book.rating.toFixed(1) : 'N/A';
        const badgeClass = book.accessBadge ? book.accessBadge.toLowerCase() : 'free';

        return `
            <div class="book-card" data-book-id="${book.id}">
                <a href="single.html?id=${book.id}" class="book-card-link">
                    <img src="${book.coverImage || 'images/placeholder_cover.png'}" alt="${book.title}" class="book-cover" onerror="this.onerror=null;this.src='images/placeholder_cover.png';">
                    <h3 class="book-title">${book.title}</h3>
                </a>
                <p class="book-author">${book.author}</p>
                <div class="rating">⭐ ${rating}</div>
                <span class="access-badge ${badgeClass}">${book.accessBadge}</span>
                <button class="add-to-list">Add to List</button>
            </div>
        `;
    }

    // --- Navigation Active State ---
    function updateActiveNav() {
        const currentPage = window.location.pathname.split("/").pop() || "index.html"; // Default to index.html if path is just "/"
        document.querySelectorAll('header nav a').forEach(link => {
            link.classList.remove('active-nav-main');
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active-nav-main');
            }
        });
    }


    // --- Homepage Specific Functions ---
    function initCarousel(carouselElement, carouselInnerElement) {
        if (!carouselElement || !carouselInnerElement || !carouselInnerElement.children.length) return;

        let currentIndex = 0;
        const items = Array.from(carouselInnerElement.children); // Convert HTMLCollection to Array
        const totalItems = items.length;
        if (totalItems === 0) return;

        let itemWidth = items[0].offsetWidth + parseInt(getComputedStyle(items[0]).marginRight) + parseInt(getComputedStyle(items[0]).marginLeft) ;

        const prevButton = document.createElement('button');
        prevButton.innerHTML = '&laquo;';
        prevButton.classList.add('carousel-prev-btn');
        Object.assign(prevButton.style, { position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: '10', padding: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', cursor: 'pointer' });


        const nextButton = document.createElement('button');
        nextButton.innerHTML = '&raquo;';
        nextButton.classList.add('carousel-next-btn');
        Object.assign(nextButton.style, { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: '10', padding: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', cursor: 'pointer' });

        carouselElement.appendChild(prevButton);
        carouselElement.appendChild(nextButton);

        function updateCarousel() {
            if (items.length === 0) return; // Prevent error if items are not yet loaded or empty
            itemWidth = items[0].offsetWidth + parseInt(getComputedStyle(items[0]).marginRight) + parseInt(getComputedStyle(items[0]).marginLeft);
            const containerWidth = carouselElement.offsetWidth;
            const itemsVisible = Math.floor(containerWidth / itemWidth) || 1; // Ensure at least 1 to avoid division by zero or NaN
            const maxIndex = totalItems > itemsVisible ? totalItems - itemsVisible : 0;

            if (currentIndex > maxIndex) currentIndex = maxIndex;
            if (currentIndex < 0) currentIndex = 0;

            const newTransformValue = -currentIndex * itemWidth;
            carouselInnerElement.style.transform = `translateX(${newTransformValue}px)`;
            prevButton.disabled = currentIndex === 0;
            nextButton.disabled = currentIndex === maxIndex;
        }

        prevButton.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateCarousel();
            }
        });

        nextButton.addEventListener('click', () => {
            const containerWidth = carouselElement.offsetWidth;
            const itemsVisible = Math.floor(containerWidth / itemWidth) || 1;
            if (currentIndex < totalItems - itemsVisible) {
                currentIndex++;
                updateCarousel();
            }
        });

        updateCarousel();
        window.addEventListener('resize', updateCarousel);
    }

    async function loadHomepageContent() {
        try {
            const books = await fetchAllBooks(); // Use global fetchAllBooks

            const featuredCarouselEl = document.querySelector('#hero .carousel');
            const trendingGrid = document.getElementById('trending-grid');
            const editorsGrid = document.getElementById('editors-grid');
            const hotPressGrid = document.getElementById('hot-press-grid');
            const genreGrid = document.getElementById('genre-grid');
            const personalizedGrid = document.getElementById('personalized-grid');


            if (featuredCarouselEl) {
                const carouselInner = document.createElement('div');
                carouselInner.classList.add('carousel-inner');
                books.filter(b => b.featured).slice(0, 5).forEach(book => {
                    carouselInner.innerHTML += createBookCard(book, true);
                });
                featuredCarouselEl.innerHTML = '';
                featuredCarouselEl.appendChild(carouselInner);

                // Ensure images are loaded before initializing carousel to get correct item widths
                let images = carouselInner.querySelectorAll('img');
                let loadedImages = 0;
                if (images.length === 0) {
                    initCarousel(featuredCarouselEl, carouselInner); // No images, init directly
                } else {
                    images.forEach(img => {
                        if (img.complete) {
                            loadedImages++;
                        } else {
                            img.onload = img.onerror = () => {
                                loadedImages++;
                                if (loadedImages === images.length) {
                                    initCarousel(featuredCarouselEl, carouselInner);
                                }
                            };
                        }
                    });
                    if (loadedImages === images.length && images.length > 0) { // All images were already cached
                         initCarousel(featuredCarouselEl, carouselInner);
                    }
                }
            }

            if (trendingGrid) {
                trendingGrid.innerHTML = '';
                books.filter(b => b.trending).slice(0, 6).forEach(book => {
                    trendingGrid.innerHTML += createBookCard(book, true);
                });
            }

            if (editorsGrid) {
                editorsGrid.innerHTML = '';
                books.filter(b => b.editorsChoice).slice(0, 6).forEach(book => {
                    editorsGrid.innerHTML += createBookCard(book, true);
                });
            }

            if (hotPressGrid) {
                hotPressGrid.innerHTML = '';
                books.filter(b => b.hotOffPress).slice(0, 6).forEach(book => {
                    hotPressGrid.innerHTML += createBookCard(book, true);
                });
            }

            if (genreGrid) {
                genreGrid.innerHTML = '';
                const uniqueGenres = [...new Set(books.map(b => b.genre).filter(g => g))].slice(0, 6);
                uniqueGenres.forEach(genre => {
                    genreGrid.innerHTML += createGenreItem(genre);
                });
            }

            if (personalizedGrid) {
                personalizedGrid.innerHTML = '';
                books.filter(b => b.rating >= 4.5).slice(0, 3).forEach(book => {
                    personalizedGrid.innerHTML += createBookCard(book, true);
                });
            }

        } catch (error) {
            console.error("Failed to load books for homepage:", error);
            const grids = document.querySelectorAll('.book-grid, .carousel, .genre-grid');
            grids.forEach(grid => {
                if(grid) grid.innerHTML = `<p>Error loading content. Please try again later.</p>`;
            });
        }
    }

    function createGenreItem(genre) {
        return `
            <div class="genre-item" data-genre="${genre.toLowerCase()}">
                ${genre}
            </div>
        `;
    }

    // --- Single Book Page Specific Functions ---
    async function loadSingleBookPageContent() {
        const bookDetailContent = document.getElementById('book-detail-content');
        const relatedBooksGrid = document.getElementById('related-books-grid');
        if (!bookDetailContent || !relatedBooksGrid) return;

        const params = new URLSearchParams(window.location.search);
        const bookId = params.get('id');

        if (!bookId) {
            bookDetailContent.innerHTML = "<p>Book ID not provided. Cannot display details.</p>";
            relatedBooksGrid.innerHTML = "";
            return;
        }

        try {
            // In a real app, allBooksData might be globally available or managed by a state system
            // For now, re-fetch if not already loaded, or assume it's loaded by another part of the script.
            // To be safe for this isolated page load:
            let booksData = [];
            if (typeof allBooksStore !== 'undefined' && allBooksStore.length > 0) { // Check if store page already loaded it
                booksData = allBooksStore;
            } else if (typeof allBooks !== 'undefined' && allBooks.length > 0) { // Check if homepage already loaded it (less likely for single page)
                 booksData = allBooks; // 'allBooks' is used by homepage, 'allBooksStore' by store page
            } else {
                const response = await fetch('data/books.json');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                booksData = await response.json();
            }

            const currentBook = booksData.find(book => book.id === bookId);

            if (!currentBook) {
                bookDetailContent.innerHTML = `<p>Book with ID ${bookId} not found.</p>`;
                relatedBooksGrid.innerHTML = "";
                return;
            }

            displayBookDetails(currentBook, bookDetailContent);
            displayRelatedBooks(currentBook, booksData, relatedBooksGrid);

        } catch (error) {
            console.error("Failed to load single book page content:", error);
            bookDetailContent.innerHTML = `<p>Error loading book details. Please try again later.</p>`;
            relatedBooksGrid.innerHTML = "";
        }
    }

    function displayBookDetails(book, container) {
        const rating = typeof book.rating === 'number' ? book.rating.toFixed(1) : 'N/A';
        const badgeClass = book.accessBadge ? book.accessBadge.toLowerCase() : 'free';

        let reviewsHTML = '<h3>Reviews</h3><div class="reviews-list">';
        if (book.reviews && book.reviews.length > 0) {
            book.reviews.forEach(review => {
                reviewsHTML += `
                    <div class="review-item">
                        <p class="review-user">${review.user || 'Anonymous'}</p>
                        <p class="review-rating">Rating: ${'⭐'.repeat(Math.round(review.rating || 0))} (${review.rating || 'N/A'})</p>
                        <p class="review-comment">${review.comment}</p>
                    </div>
                `;
            });
        } else {
            reviewsHTML += '<p>No reviews yet for this book.</p>';
        }
        reviewsHTML += '</div>';

        const authorBio = book.authorBio || `More information about ${book.author} is coming soon. This is a placeholder bio.`;

        container.innerHTML = `
            <div class="book-cover-container">
                <img src="${book.coverImage || 'images/placeholder_cover.png'}" alt="${book.title}" class="book-cover-high-res" onerror="this.onerror=null;this.src='images/placeholder_cover.png';">
            </div>
            <div class="book-info">
                <h2 class="book-main-title">${book.title}</h2>
                <p class="book-main-author">${book.author}
                    <a href="#" class="author-bio-link" data-author="${book.author}">(see bio)</a>
                </p>
                <span class="access-badge-single access-badge ${badgeClass}">${book.accessBadge}</span>
                <div class="rating" style="margin-bottom: 15px;">Overall Rating: ⭐ ${rating} (${book.reviews ? book.reviews.length : 0} reviews)</div>

                <p class="book-description">${book.description || 'No description available.'}</p>

                <div class="author-bio-section" style="display:none;">
                    <h3>About ${book.author}</h3>
                    <p class="author-bio-text">${authorBio}</p>
                </div>

                <div class="book-sample-preview">
                    <h3>Sample Preview</h3>
                    <div class="book-sample-preview-text">
                        ${book.sample || 'No sample available.'}
                    </div>
                </div>
                <div class="book-reviews">
                    ${reviewsHTML}
                </div>
                 <button class="add-to-list" data-book-id="${book.id}" style="margin-top: 20px; padding: 10px 15px;">Add to List</button>
                 <!-- Add more buttons like "Read Now", "Rent", "Buy" as needed -->
            </div>
        `;

        const authorBioLink = container.querySelector('.author-bio-link');
        if(authorBioLink) {
            authorBioLink.addEventListener('click', (e) => {
                e.preventDefault();
                const bioSection = container.querySelector('.author-bio-section');
                if(bioSection) {
                    bioSection.style.display = bioSection.style.display === 'none' ? 'block' : 'none';
                }
            });
        }
    }

    function displayRelatedBooks(currentBook, allBooksParam, container) {
        container.innerHTML = '';
        const related = allBooksParam.filter(book =>
            book.genre === currentBook.genre && book.id !== currentBook.id
        ).slice(0, 4);

        if (related.length > 0) {
            related.forEach(book => {
                // Using createBookCardForStore to ensure related books also link to their single pages
                container.innerHTML += createBookCardForStore(book);
            });
        } else {
            const popularFallback = allBooksParam.filter(book => book.id !== currentBook.id && (book.rating || 0) >= 4.5).slice(0,4);
            if (popularFallback.length > 0) {
                 popularFallback.forEach(book => {
                    container.innerHTML += createBookCardForStore(book);
                });
            } else {
                container.innerHTML = '<p>No related books found at this time.</p>';
            }
        }
    }
    // --- End of Single Book Page Specific Functions ---

    // --- Store Page Specific Functions ---
    let allBooksStore = []; // To store all books fetched for client-side filtering/sorting on store page

    async function loadStorePageContent() {
        try {
            // Use fetchAllBooks to ensure data is loaded and cached if needed
            allBooksStore = await fetchAllBooks();
            populateStoreBooks(allBooksStore);
            populateGenreFilterStore(allBooksStore);
            setupStoreEventListeners();
        } catch (error) {
            console.error("Failed to load store page content:", error);
            const storeGrid = document.getElementById('store-book-grid');
            if (storeGrid) storeGrid.innerHTML = `<p>Error loading books. Please try again later.</p>`;
        }
    }

    function populateStoreBooks(booksToDisplay) {
        const storeGrid = document.getElementById('store-book-grid');
        if (!storeGrid) return;

        storeGrid.innerHTML = ''; // Clear current books or loading message
        if (booksToDisplay.length === 0) {
            storeGrid.innerHTML = '<p>No books match your criteria.</p>';
            return;
        }
        booksToDisplay.forEach(book => {
            // Modify createBookCard to add a link to single.html
            const bookCardHTML = createBookCardForStore(book); // Use a modified card function
            storeGrid.innerHTML += bookCardHTML;
        });
    }

    // createBookCardForStore is now a global helper, no need to redefine if it's the same.

    function populateGenreFilterStore(books) {
        const genreFilterList = document.getElementById('genre-filter-list');
        if (!genreFilterList) return;

        const uniqueGenres = [...new Set(books.map(book => book.genre).filter(g => g))].sort(); // Filter out undefined/null genres and sort
        genreFilterList.innerHTML = ''; // Clear static/default genres
        uniqueGenres.forEach(genre => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<label><input type="checkbox" name="genre" value="${genre.toLowerCase()}"> ${genre}</label>`;
            genreFilterList.appendChild(listItem);
        });
    }

    function setupStoreEventListeners() {
        const searchBar = document.getElementById('search-bar');
        const sortDropdown = document.getElementById('sort-dropdown');
        const applyFiltersBtn = document.getElementById('apply-filters-btn');
        const ratingFilter = document.getElementById('rating-filter');

        if (searchBar) {
            searchBar.addEventListener('input', performSearchAndFilterAndSort);
        }
        if (sortDropdown) {
            sortDropdown.addEventListener('change', performSearchAndFilterAndSort);
        }
        if (ratingFilter) {
            ratingFilter.addEventListener('change', performSearchAndFilterAndSort);
        }
        const genreFilterList = document.getElementById('genre-filter-list');
        if (genreFilterList) {
             genreFilterList.addEventListener('change', function(event) {
                if (event.target.name === 'genre' && event.target.type === 'checkbox') {
                    performSearchAndFilterAndSort();
                }
            });
        }
        // If using Apply Filters button:
        if (applyFiltersBtn) { // This button might be removed if live filtering is preferred
            applyFiltersBtn.addEventListener('click', performSearchAndFilterAndSort);
        }
    }

    function performSearchAndFilterAndSort() {
        let filteredBooks = [...allBooksStore];

        const searchTerm = document.getElementById('search-bar')?.value.toLowerCase() || '';
        if (searchTerm) {
            filteredBooks = filteredBooks.filter(book =>
                book.title.toLowerCase().includes(searchTerm) ||
                book.author.toLowerCase().includes(searchTerm) ||
                (book.genre && book.genre.toLowerCase().includes(searchTerm))
            );
        }

        const selectedGenres = Array.from(document.querySelectorAll('#genre-filter-list input[name="genre"]:checked'))
                                    .map(cb => cb.value);
        if (selectedGenres.length > 0) {
            filteredBooks = filteredBooks.filter(book => book.genre && selectedGenres.includes(book.genre.toLowerCase()));
        }

        const minRating = parseFloat(document.getElementById('rating-filter')?.value || '0');
        if (minRating > 0) {
            filteredBooks = filteredBooks.filter(book => book.rating !== undefined && book.rating >= minRating);
        }

        const sortBy = document.getElementById('sort-dropdown')?.value || 'newest';
        switch (sortBy) {
            case 'popular':
                filteredBooks.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'title-asc':
                filteredBooks.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'title-desc':
                filteredBooks.sort((a, b) => b.title.localeCompare(a.title));
                break;
            case 'newest':
            default:
                 filteredBooks.sort((a, b) => parseInt(b.id || 0) - parseInt(a.id || 0));
                break;
        }
        populateStoreBooks(filteredBooks);
    }
    // --- End of Store Page Specific Functions ---

    // --- Charts Page Specific Functions ---
    async function loadChartsPageContent() {
        const readersChoiceList = document.getElementById('readers-choice-list');
        const criticsPicksList = document.getElementById('critics-picks-list');
        const timelessClassicsList = document.getElementById('timeless-classics-list');

        if (!readersChoiceList || !criticsPicksList || !timelessClassicsList) {
            console.warn("One or more chart list containers not found on charts page.");
            return;
        }

        try {
            let booksData = await fetchAllBooks(); // Ensure books are loaded

            if (booksData.length === 0) {
                throw new Error("No books data available to populate charts.");
            }

            // Reader's Choice: Highly rated (e.g., top 5 by rating)
            const readersChoiceBooks = [...booksData].sort((a,b) => (b.rating || 0) - (a.rating || 0)).slice(0, 5);
            populateChartList(readersChoiceBooks, readersChoiceList, true, "Reader's Choice");

            // Critic's Picks: Books flagged as "editorsChoice" (e.g., top 5)
            const criticsPicksBooks = booksData.filter(b => b.editorsChoice === true).slice(0, 5);
            populateChartList(criticsPicksBooks, criticsPicksList, false, "Critic's Pick");

            // Timeless Classics: (Simulated) e.g., older books (lower ID) with good ratings (e.g. >= 4.0)
            const timelessClassicsBooks = [...booksData]
                                            .filter(b => (b.rating || 0) >= 4.0)
                                            .sort((a,b) => parseInt(a.id || '9999') - parseInt(b.id || '9999'))
                                            .slice(0, 5);
            populateChartList(timelessClassicsBooks, timelessClassicsList, false, "Timeless Classic");

            setupChartsEventListeners();

        } catch (error) {
            console.error("Failed to load charts page content:", error);
            if(readersChoiceList) readersChoiceList.innerHTML = `<p>Error loading Reader's Choice: ${error.message}</p>`;
            if(criticsPicksList) criticsPicksList.innerHTML = `<p>Error loading Critic's Picks: ${error.message}</p>`;
            if(timelessClassicsList) timelessClassicsList.innerHTML = `<p>Error loading Timeless Classics: ${error.message}</p>`;
        }
    }

    function populateChartList(books, container, showVoting, chartNameForTooltip) {
        container.innerHTML = '';
        if (!books || books.length === 0) {
            container.innerHTML = `<p>No books to display in the ${chartNameForTooltip} chart currently.</p>`;
            return;
        }
        books.forEach((book, index) => {
            container.innerHTML += createChartItem(book, index + 1, showVoting, chartNameForTooltip);
        });
    }

    function createChartItem(book, rank, showVoting, chartNameForTooltip) {
        const voteButtonHTML = showVoting ? `<button class="vote-button" data-book-id="${book.id}" aria-label="Vote for ${book.title}">Vote</button>` : '';
        const shareButtonHTML = `<a href="#" class="share-button" data-book-id="${book.id}" title="Share ${book.title}" aria-label="Share ${book.title}">Share</a>`;
        const tooltipText = `${chartNameForTooltip} - Rank #${rank}: ${book.title}`;
        // The tooltip is attached to the rank span itself via title attribute for simplicity, CSS handles the styled tooltip via sibling selector
        const tooltipSpanHTML = `<span class="tooltip-text">${tooltipText}</span>`;


        return `
            <div class="chart-item" data-book-id="${book.id}">
                <span class="chart-item-rank" title="${tooltipText}" aria-label="Rank ${rank}">${rank}</span>
                <img src="${book.coverImage || 'images/placeholder_cover.png'}" alt="Cover of ${book.title}" class="chart-item-cover" onerror="this.src='images/placeholder_cover.png'; this.alt='Placeholder cover image';">
                <div class="chart-item-info">
                    <h3><a href="single.html?id=${book.id}">${book.title}</a></h3>
                    <p>by ${book.author}</p>
                    <div class="rating">⭐ ${typeof book.rating === 'number' ? book.rating.toFixed(1) : 'N/A'}</div>
                </div>
                <div class="chart-item-actions">
                    ${voteButtonHTML}
                    ${shareButtonHTML}
                </div>
                ${tooltipSpanHTML}
            </div>
        `;
    }

    function setupChartsEventListeners() {
        // Use event delegation on the .charts-page for dynamically added buttons
        const chartsPageContainer = document.querySelector('.charts-page');
        if (!chartsPageContainer) return;

        chartsPageContainer.addEventListener('click', function(event) {
            const target = event.target;

            if (target.classList.contains('vote-button') && !target.disabled) {
                const bookId = target.dataset.bookId;
                console.log(`Vote cast for book ID: ${bookId} (dummy action)`);
                target.textContent = 'Voted!';
                target.classList.add('voted');
                target.disabled = true;
                alert(`You voted for Book ID ${bookId}! (This is a dummy action)`);
            }

            if (target.classList.contains('share-button')) {
                event.preventDefault();
                const bookId = target.dataset.bookId;
                const chartItem = target.closest('.chart-item');
                let bookTitle = 'this book';
                if (chartItem) {
                    const titleElement = chartItem.querySelector('.chart-item-info h3 a');
                    if (titleElement) bookTitle = titleElement.textContent;
                }
                console.log(`Share button clicked for book ID: ${bookId} - ${bookTitle} (dummy action)`);
                alert(`Share '${bookTitle}' (ID: ${bookId}) - (Dummy link, no actual sharing implemented)`);
            }
        });
    }
    // --- End of Charts Page Specific Functions ---

    // --- Single Book Page Specific Functions ---
>>>>>>> REPLACE
```
```javascript
document.addEventListener('DOMContentLoaded', function() {
    console.log('LITLOUNGE-3 JavaScript loaded');

    // --- Global Variables & Initial Setup ---
    let allBooksData = []; // Cache for all book data
    let currentUserData = null; // To store the logged-in user's data (simulated)

    // --- Global Helper Functions ---
    async function fetchAllBooks() {
        if (allBooksData.length === 0) { // Only fetch if not already loaded
            try {
                const response = await fetch('data/books.json');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                allBooksData = await response.json();
            } catch (error) {
                console.error("Failed to load books data:", error);
                allBooksData = []; // Ensure it's an array even on error
            }
        }
        return allBooksData;
    }

    async function fetchUserData(userId = "user1") { // Default to user1 for demo
        // In a real app, userId would come from session/auth
        if (!currentUserData || currentUserData.id !== userId) {
            try {
                const response = await fetch('data/users.json');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const users = await response.json();
                currentUserData = users.find(user => user.id === userId);
                if (!currentUserData) {
                    console.warn(`User with ID ${userId} not found. Using default empty user.`);
                    // Provide a default structure if user not found, to prevent errors
                    currentUserData = {
                        id: userId,
                        username: "Guest",
                        profileImage: "images/user_avatar_placeholder.png",
                        readingLists: { currentlyReading: [], favorites: [], wantToRead: [] },
                        library: { saved: [], rented: [], subscribed: [] },
                        preferences: { favoriteGenres: [], notifications: false, darkMode: false },
                        readingStats: { booksReadThisMonth: 0, pagesReadThisWeek: 0, readingStreak: "0 days" }
                    };
                }
            } catch (error) {
                console.error("Failed to load user data:", error);
                currentUserData = null;
            }
        }
        return currentUserData;
    }

    function createBookCard(book, linkToSinglePage = false) {
        const rating = typeof book.rating === 'number' ? book.rating.toFixed(1) : 'N/A';
        const badgeClass = book.accessBadge ? book.accessBadge.toLowerCase() : 'free';
        const linkStart = linkToSinglePage ? `<a href="single.html?id=${book.id}" class="book-card-link">` : '';
        const linkEnd = linkToSinglePage ? '</a>' : '';

        return `
            <div class="book-card" data-book-id="${book.id}">
                ${linkStart}
                <img src="${book.coverImage || 'images/placeholder_cover.png'}" alt="${book.title}" class="book-cover" onerror="this.onerror=null;this.src='images/placeholder_cover.png';">
                <h3 class="book-title">${book.title}</h3>
                ${linkEnd}
                <p class="book-author">${book.author}</p>
                <div class="rating">⭐ ${rating}</div>
                <span class="access-badge ${badgeClass}">${book.accessBadge}</span>
                <button class="add-to-list">Add to List</button>
            </div>
        `;
    }

    // Modified book card for store/dashboard where links are always needed
    function createBookCardForStore(book) {
        const rating = typeof book.rating === 'number' ? book.rating.toFixed(1) : 'N/A';
        const badgeClass = book.accessBadge ? book.accessBadge.toLowerCase() : 'free';

        return `
            <div class="book-card" data-book-id="${book.id}">
                <a href="single.html?id=${book.id}" class="book-card-link">
                    <img src="${book.coverImage || 'images/placeholder_cover.png'}" alt="${book.title}" class="book-cover" onerror="this.onerror=null;this.src='images/placeholder_cover.png';">
                    <h3 class="book-title">${book.title}</h3>
                </a>
                <p class="book-author">${book.author}</p>
                <div class="rating">⭐ ${rating}</div>
                <span class="access-badge ${badgeClass}">${book.accessBadge}</span>
                <button class="add-to-list">Add to List</button>
            </div>
        `;
    }

    // --- Navigation Active State ---
    function updateActiveNav() {
        const currentPage = window.location.pathname.split("/").pop() || "index.html"; // Default to index.html if path is just "/"
        document.querySelectorAll('header nav a').forEach(link => {
            link.classList.remove('active-nav-main');
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active-nav-main');
            }
        });
    }


    // --- Homepage Specific Functions ---
    function initCarousel(carouselElement, carouselInnerElement) {
        if (!carouselElement || !carouselInnerElement || !carouselInnerElement.children.length) return;

        let currentIndex = 0;
        const items = Array.from(carouselInnerElement.children); // Convert HTMLCollection to Array
        const totalItems = items.length;
        if (totalItems === 0) return;

        let itemWidth = items[0].offsetWidth + parseInt(getComputedStyle(items[0]).marginRight) + parseInt(getComputedStyle(items[0]).marginLeft) ;

        const prevButton = document.createElement('button');
        prevButton.innerHTML = '&laquo;';
        prevButton.classList.add('carousel-prev-btn');
        Object.assign(prevButton.style, { position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: '10', padding: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', cursor: 'pointer' });


        const nextButton = document.createElement('button');
        nextButton.innerHTML = '&raquo;';
        nextButton.classList.add('carousel-next-btn');
        Object.assign(nextButton.style, { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: '10', padding: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', cursor: 'pointer' });

        carouselElement.appendChild(prevButton);
        carouselElement.appendChild(nextButton);

        function updateCarousel() {
            if (items.length === 0) return; // Prevent error if items are not yet loaded or empty
            itemWidth = items[0].offsetWidth + parseInt(getComputedStyle(items[0]).marginRight) + parseInt(getComputedStyle(items[0]).marginLeft);
            const containerWidth = carouselElement.offsetWidth;
            const itemsVisible = Math.floor(containerWidth / itemWidth) || 1; // Ensure at least 1 to avoid division by zero or NaN
            const maxIndex = totalItems > itemsVisible ? totalItems - itemsVisible : 0;

            if (currentIndex > maxIndex) currentIndex = maxIndex;
            if (currentIndex < 0) currentIndex = 0;

            const newTransformValue = -currentIndex * itemWidth;
            carouselInnerElement.style.transform = `translateX(${newTransformValue}px)`;
            prevButton.disabled = currentIndex === 0;
            nextButton.disabled = currentIndex === maxIndex;
        }

        prevButton.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateCarousel();
            }
        });

        nextButton.addEventListener('click', () => {
            const containerWidth = carouselElement.offsetWidth;
            const itemsVisible = Math.floor(containerWidth / itemWidth) || 1;
            if (currentIndex < totalItems - itemsVisible) {
                currentIndex++;
                updateCarousel();
            }
        });

        updateCarousel();
        window.addEventListener('resize', updateCarousel);
    }

    async function loadHomepageContent() {
        try {
            const books = await fetchAllBooks(); // Use global fetchAllBooks

            const featuredCarouselEl = document.querySelector('#hero .carousel');
            const trendingGrid = document.getElementById('trending-grid');
            const editorsGrid = document.getElementById('editors-grid');
            const hotPressGrid = document.getElementById('hot-press-grid');
            const genreGrid = document.getElementById('genre-grid');
            const personalizedGrid = document.getElementById('personalized-grid');


            if (featuredCarouselEl) {
                const carouselInner = document.createElement('div');
                carouselInner.classList.add('carousel-inner');
                books.filter(b => b.featured).slice(0, 5).forEach(book => {
                    carouselInner.innerHTML += createBookCard(book, true);
                });
                featuredCarouselEl.innerHTML = '';
                featuredCarouselEl.appendChild(carouselInner);

                // Ensure images are loaded before initializing carousel to get correct item widths
                let images = carouselInner.querySelectorAll('img');
                let loadedImages = 0;
                if (images.length === 0) {
                    initCarousel(featuredCarouselEl, carouselInner); // No images, init directly
                } else {
                    images.forEach(img => {
                        if (img.complete) {
                            loadedImages++;
                        } else {
                            img.onload = img.onerror = () => {
                                loadedImages++;
                                if (loadedImages === images.length) {
                                    initCarousel(featuredCarouselEl, carouselInner);
                                }
                            };
                        }
                    });
                    if (loadedImages === images.length && images.length > 0) { // All images were already cached
                         initCarousel(featuredCarouselEl, carouselInner);
                    }
                }
            }

            if (trendingGrid) {
                trendingGrid.innerHTML = '';
                books.filter(b => b.trending).slice(0, 6).forEach(book => {
                    trendingGrid.innerHTML += createBookCard(book, true);
                });
            }

            if (editorsGrid) {
                editorsGrid.innerHTML = '';
                books.filter(b => b.editorsChoice).slice(0, 6).forEach(book => {
                    editorsGrid.innerHTML += createBookCard(book, true);
                });
            }

            if (hotPressGrid) {
                hotPressGrid.innerHTML = '';
                books.filter(b => b.hotOffPress).slice(0, 6).forEach(book => {
                    hotPressGrid.innerHTML += createBookCard(book, true);
                });
            }

            if (genreGrid) {
                genreGrid.innerHTML = '';
                const uniqueGenres = [...new Set(books.map(b => b.genre).filter(g => g))].slice(0, 6);
                uniqueGenres.forEach(genre => {
                    genreGrid.innerHTML += createGenreItem(genre);
                });
            }

            if (personalizedGrid) {
                personalizedGrid.innerHTML = '';
                books.filter(b => b.rating >= 4.5).slice(0, 3).forEach(book => {
                    personalizedGrid.innerHTML += createBookCard(book, true);
                });
            }

        } catch (error) {
            console.error("Failed to load books for homepage:", error);
            const grids = document.querySelectorAll('.book-grid, .carousel, .genre-grid');
            grids.forEach(grid => {
                if(grid) grid.innerHTML = `<p>Error loading content. Please try again later.</p>`;
            });
        }
    }

    function createGenreItem(genre) {
        return `
            <div class="genre-item" data-genre="${genre.toLowerCase()}">
                ${genre}
            </div>
        `;
    }

    // --- Single Book Page Specific Functions ---
    async function loadSingleBookPageContent() {
        const bookDetailContent = document.getElementById('book-detail-content');
        const relatedBooksGrid = document.getElementById('related-books-grid');
        if (!bookDetailContent || !relatedBooksGrid) return;

        const params = new URLSearchParams(window.location.search);
        const bookId = params.get('id');

        if (!bookId) {
            bookDetailContent.innerHTML = "<p>Book ID not provided. Cannot display details.</p>";
            relatedBooksGrid.innerHTML = "";
            return;
        }

        try {
            // In a real app, allBooksData might be globally available or managed by a state system
            // For now, re-fetch if not already loaded, or assume it's loaded by another part of the script.
            // To be safe for this isolated page load:
            let booksData = [];
            if (typeof allBooksStore !== 'undefined' && allBooksStore.length > 0) { // Check if store page already loaded it
                booksData = allBooksStore;
            } else if (typeof allBooks !== 'undefined' && allBooks.length > 0) { // Check if homepage already loaded it (less likely for single page)
                 booksData = allBooks; // 'allBooks' is used by homepage, 'allBooksStore' by store page
            } else {
                const response = await fetch('data/books.json');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                booksData = await response.json();
            }

            const currentBook = booksData.find(book => book.id === bookId);

            if (!currentBook) {
                bookDetailContent.innerHTML = `<p>Book with ID ${bookId} not found.</p>`;
                relatedBooksGrid.innerHTML = "";
                return;
            }

            displayBookDetails(currentBook, bookDetailContent);
            displayRelatedBooks(currentBook, booksData, relatedBooksGrid);

        } catch (error) {
            console.error("Failed to load single book page content:", error);
            bookDetailContent.innerHTML = `<p>Error loading book details. Please try again later.</p>`;
            relatedBooksGrid.innerHTML = "";
        }
    }

    function displayBookDetails(book, container) {
        const rating = typeof book.rating === 'number' ? book.rating.toFixed(1) : 'N/A';
        const badgeClass = book.accessBadge ? book.accessBadge.toLowerCase() : 'free';

        let reviewsHTML = '<h3>Reviews</h3><div class="reviews-list">';
        if (book.reviews && book.reviews.length > 0) {
            book.reviews.forEach(review => {
                reviewsHTML += `
                    <div class="review-item">
                        <p class="review-user">${review.user || 'Anonymous'}</p>
                        <p class="review-rating">Rating: ${'⭐'.repeat(Math.round(review.rating || 0))} (${review.rating || 'N/A'})</p>
                        <p class="review-comment">${review.comment}</p>
                    </div>
                `;
            });
        } else {
            reviewsHTML += '<p>No reviews yet for this book.</p>';
        }
        reviewsHTML += '</div>';

        const authorBio = book.authorBio || `More information about ${book.author} is coming soon. This is a placeholder bio.`;

        container.innerHTML = `
            <div class="book-cover-container">
                <img src="${book.coverImage || 'images/placeholder_cover.png'}" alt="${book.title}" class="book-cover-high-res" onerror="this.onerror=null;this.src='images/placeholder_cover.png';">
            </div>
            <div class="book-info">
                <h2 class="book-main-title">${book.title}</h2>
                <p class="book-main-author">${book.author}
                    <a href="#" class="author-bio-link" data-author="${book.author}">(see bio)</a>
                </p>
                <span class="access-badge-single access-badge ${badgeClass}">${book.accessBadge}</span>
                <div class="rating" style="margin-bottom: 15px;">Overall Rating: ⭐ ${rating} (${book.reviews ? book.reviews.length : 0} reviews)</div>

                <p class="book-description">${book.description || 'No description available.'}</p>

                <div class="author-bio-section" style="display:none;">
                    <h3>About ${book.author}</h3>
                    <p class="author-bio-text">${authorBio}</p>
                </div>

                <div class="book-sample-preview">
                    <h3>Sample Preview</h3>
                    <div class="book-sample-preview-text">
                        ${book.sample || 'No sample available.'}
                    </div>
                </div>
                <div class="book-reviews">
                    ${reviewsHTML}
                </div>
                 <button class="add-to-list" data-book-id="${book.id}" style="margin-top: 20px; padding: 10px 15px;">Add to List</button>
                 <!-- Add more buttons like "Read Now", "Rent", "Buy" as needed -->
            </div>
        `;

        const authorBioLink = container.querySelector('.author-bio-link');
        if(authorBioLink) {
            authorBioLink.addEventListener('click', (e) => {
                e.preventDefault();
                const bioSection = container.querySelector('.author-bio-section');
                if(bioSection) {
                    bioSection.style.display = bioSection.style.display === 'none' ? 'block' : 'none';
                }
            });
        }
    }

    function displayRelatedBooks(currentBook, allBooksParam, container) {
        container.innerHTML = '';
        const related = allBooksParam.filter(book =>
            book.genre === currentBook.genre && book.id !== currentBook.id
        ).slice(0, 4);

        if (related.length > 0) {
            related.forEach(book => {
                // Using createBookCardForStore to ensure related books also link to their single pages
                container.innerHTML += createBookCardForStore(book);
            });
        } else {
            const popularFallback = allBooksParam.filter(book => book.id !== currentBook.id && (book.rating || 0) >= 4.5).slice(0,4);
            if (popularFallback.length > 0) {
                 popularFallback.forEach(book => {
                    container.innerHTML += createBookCardForStore(book);
                });
            } else {
                container.innerHTML = '<p>No related books found at this time.</p>';
            }
        }
    }
    // --- End of Single Book Page Specific Functions ---

    // --- Store Page Specific Functions ---
    let allBooksStore = []; // To store all books fetched for client-side filtering/sorting on store page

    async function loadStorePageContent() {
        try {
            // Use fetchAllBooks to ensure data is loaded and cached if needed
            allBooksStore = await fetchAllBooks();
            populateStoreBooks(allBooksStore);
            populateGenreFilterStore(allBooksStore);
            setupStoreEventListeners();
        } catch (error) {
            console.error("Failed to load store page content:", error);
            const storeGrid = document.getElementById('store-book-grid');
            if (storeGrid) storeGrid.innerHTML = `<p>Error loading books. Please try again later.</p>`;
        }
    }

    function populateStoreBooks(booksToDisplay) {
        const storeGrid = document.getElementById('store-book-grid');
        if (!storeGrid) return;

        storeGrid.innerHTML = ''; // Clear current books or loading message
        if (booksToDisplay.length === 0) {
            storeGrid.innerHTML = '<p>No books match your criteria.</p>';
            return;
        }
        booksToDisplay.forEach(book => {
            // Modify createBookCard to add a link to single.html
            const bookCardHTML = createBookCardForStore(book); // Use a modified card function
            storeGrid.innerHTML += bookCardHTML;
        });
    }

    // createBookCardForStore is now a global helper, no need to redefine if it's the same.

    function populateGenreFilterStore(books) {
        const genreFilterList = document.getElementById('genre-filter-list');
        if (!genreFilterList) return;

        const uniqueGenres = [...new Set(books.map(book => book.genre).filter(g => g))].sort(); // Filter out undefined/null genres and sort
        genreFilterList.innerHTML = ''; // Clear static/default genres
        uniqueGenres.forEach(genre => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<label><input type="checkbox" name="genre" value="${genre.toLowerCase()}"> ${genre}</label>`;
            genreFilterList.appendChild(listItem);
        });
    }

    function setupStoreEventListeners() {
        const searchBar = document.getElementById('search-bar');
        const sortDropdown = document.getElementById('sort-dropdown');
        const applyFiltersBtn = document.getElementById('apply-filters-btn');
        const ratingFilter = document.getElementById('rating-filter');

        if (searchBar) {
            searchBar.addEventListener('input', performSearchAndFilterAndSort);
        }
        if (sortDropdown) {
            sortDropdown.addEventListener('change', performSearchAndFilterAndSort);
        }
        if (ratingFilter) {
            ratingFilter.addEventListener('change', performSearchAndFilterAndSort);
        }
        const genreFilterList = document.getElementById('genre-filter-list');
        if (genreFilterList) {
             genreFilterList.addEventListener('change', function(event) {
                if (event.target.name === 'genre' && event.target.type === 'checkbox') {
                    performSearchAndFilterAndSort();
                }
            });
        }
        // If using Apply Filters button:
        if (applyFiltersBtn) { // This button might be removed if live filtering is preferred
            applyFiltersBtn.addEventListener('click', performSearchAndFilterAndSort);
        }
    }

    function performSearchAndFilterAndSort() {
        let filteredBooks = [...allBooksStore];

        const searchTerm = document.getElementById('search-bar')?.value.toLowerCase() || '';
        if (searchTerm) {
            filteredBooks = filteredBooks.filter(book =>
                book.title.toLowerCase().includes(searchTerm) ||
                book.author.toLowerCase().includes(searchTerm) ||
                (book.genre && book.genre.toLowerCase().includes(searchTerm))
            );
        }

        const selectedGenres = Array.from(document.querySelectorAll('#genre-filter-list input[name="genre"]:checked'))
                                    .map(cb => cb.value);
        if (selectedGenres.length > 0) {
            filteredBooks = filteredBooks.filter(book => book.genre && selectedGenres.includes(book.genre.toLowerCase()));
        }

        const minRating = parseFloat(document.getElementById('rating-filter')?.value || '0');
        if (minRating > 0) {
            filteredBooks = filteredBooks.filter(book => book.rating !== undefined && book.rating >= minRating);
        }

        const sortBy = document.getElementById('sort-dropdown')?.value || 'newest';
        switch (sortBy) {
            case 'popular':
                filteredBooks.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'title-asc':
                filteredBooks.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'title-desc':
                filteredBooks.sort((a, b) => b.title.localeCompare(a.title));
                break;
            case 'newest':
            default:
                 filteredBooks.sort((a, b) => parseInt(b.id || 0) - parseInt(a.id || 0));
                break;
        }
        populateStoreBooks(filteredBooks);
    }
    // --- End of Store Page Specific Functions ---

    // --- Charts Page Specific Functions ---
    async function loadChartsPageContent() {
        const readersChoiceList = document.getElementById('readers-choice-list');
        const criticsPicksList = document.getElementById('critics-picks-list');
        const timelessClassicsList = document.getElementById('timeless-classics-list');

        if (!readersChoiceList || !criticsPicksList || !timelessClassicsList) {
            console.warn("One or more chart list containers not found on charts page.");
            return;
        }

        try {
            let booksData = await fetchAllBooks(); // Ensure books are loaded

            if (booksData.length === 0) {
                throw new Error("No books data available to populate charts.");
            }

            // Reader's Choice: Highly rated (e.g., top 5 by rating)
            const readersChoiceBooks = [...booksData].sort((a,b) => (b.rating || 0) - (a.rating || 0)).slice(0, 5);
            populateChartList(readersChoiceBooks, readersChoiceList, true, "Reader's Choice");

            // Critic's Picks: Books flagged as "editorsChoice" (e.g., top 5)
            const criticsPicksBooks = booksData.filter(b => b.editorsChoice === true).slice(0, 5);
            populateChartList(criticsPicksBooks, criticsPicksList, false, "Critic's Pick");

            // Timeless Classics: (Simulated) e.g., older books (lower ID) with good ratings (e.g. >= 4.0)
            const timelessClassicsBooks = [...booksData]
                                            .filter(b => (b.rating || 0) >= 4.0)
                                            .sort((a,b) => parseInt(a.id || '9999') - parseInt(b.id || '9999'))
                                            .slice(0, 5);
            populateChartList(timelessClassicsBooks, timelessClassicsList, false, "Timeless Classic");

            setupChartsEventListeners();

        } catch (error) {
            console.error("Failed to load charts page content:", error);
            if(readersChoiceList) readersChoiceList.innerHTML = `<p>Error loading Reader's Choice: ${error.message}</p>`;
            if(criticsPicksList) criticsPicksList.innerHTML = `<p>Error loading Critic's Picks: ${error.message}</p>`;
            if(timelessClassicsList) timelessClassicsList.innerHTML = `<p>Error loading Timeless Classics: ${error.message}</p>`;
        }
    }

    function populateChartList(books, container, showVoting, chartNameForTooltip) {
        container.innerHTML = '';
        if (!books || books.length === 0) {
            container.innerHTML = `<p>No books to display in the ${chartNameForTooltip} chart currently.</p>`;
            return;
        }
        books.forEach((book, index) => {
            container.innerHTML += createChartItem(book, index + 1, showVoting, chartNameForTooltip);
        });
    }

    function createChartItem(book, rank, showVoting, chartNameForTooltip) {
        const voteButtonHTML = showVoting ? `<button class="vote-button" data-book-id="${book.id}" aria-label="Vote for ${book.title}">Vote</button>` : '';
        const shareButtonHTML = `<a href="#" class="share-button" data-book-id="${book.id}" title="Share ${book.title}" aria-label="Share ${book.title}">Share</a>`;
        const tooltipText = `${chartNameForTooltip} - Rank #${rank}: ${book.title}`;
        // The tooltip is attached to the rank span itself via title attribute for simplicity, CSS handles the styled tooltip via sibling selector
        const tooltipSpanHTML = `<span class="tooltip-text">${tooltipText}</span>`;


        return `
            <div class="chart-item" data-book-id="${book.id}">
                <span class="chart-item-rank" title="${tooltipText}" aria-label="Rank ${rank}">${rank}</span>
                <img src="${book.coverImage || 'images/placeholder_cover.png'}" alt="Cover of ${book.title}" class="chart-item-cover" onerror="this.src='images/placeholder_cover.png'; this.alt='Placeholder cover image';">
                <div class="chart-item-info">
                    <h3><a href="single.html?id=${book.id}">${book.title}</a></h3>
                    <p>by ${book.author}</p>
                    <div class="rating">⭐ ${typeof book.rating === 'number' ? book.rating.toFixed(1) : 'N/A'}</div>
                </div>
                <div class="chart-item-actions">
                    ${voteButtonHTML}
                    ${shareButtonHTML}
                </div>
                ${tooltipSpanHTML}
            </div>
        `;
    }

    function setupChartsEventListeners() {
        // Use event delegation on the .charts-page for dynamically added buttons
        const chartsPageContainer = document.querySelector('.charts-page');
        if (!chartsPageContainer) return;

        chartsPageContainer.addEventListener('click', function(event) {
            const target = event.target;

            if (target.classList.contains('vote-button') && !target.disabled) {
                const bookId = target.dataset.bookId;
                console.log(`Vote cast for book ID: ${bookId} (dummy action)`);
                target.textContent = 'Voted!';
                target.classList.add('voted');
                target.disabled = true;
                alert(`You voted for Book ID ${bookId}! (This is a dummy action)`);
            }

            if (target.classList.contains('share-button')) {
                event.preventDefault();
                const bookId = target.dataset.bookId;
                const chartItem = target.closest('.chart-item');
                let bookTitle = 'this book';
                if (chartItem) {
                    const titleElement = chartItem.querySelector('.chart-item-info h3 a');
                    if (titleElement) bookTitle = titleElement.textContent;
                }
                console.log(`Share button clicked for book ID: ${bookId} - ${bookTitle} (dummy action)`);
                alert(`Share '${bookTitle}' (ID: ${bookId}) - (Dummy link, no actual sharing implemented)`);
            }
        });
    }
    // --- End of Charts Page Specific Functions ---

    // --- Single Book Page Specific Functions ---
>>>>>>> REPLACE
```
```javascript
document.addEventListener('DOMContentLoaded', function() {
    console.log('LITLOUNGE-3 JavaScript loaded');

    // --- Global Variables & Initial Setup ---
    let allBooksData = []; // Cache for all book data
    let currentUserData = null; // To store the logged-in user's data (simulated)

    // --- Global Helper Functions ---
    async function fetchAllBooks() {
        if (allBooksData.length === 0) { // Only fetch if not already loaded
            try {
                const response = await fetch('data/books.json');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                allBooksData = await response.json();
            } catch (error) {
                console.error("Failed to load books data:", error);
                allBooksData = []; // Ensure it's an array even on error
            }
        }
        return allBooksData;
    }

    async function fetchUserData(userId = "user1") { // Default to user1 for demo
        // In a real app, userId would come from session/auth
        if (!currentUserData || currentUserData.id !== userId) {
            try {
                const response = await fetch('data/users.json');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const users = await response.json();
                currentUserData = users.find(user => user.id === userId);
                if (!currentUserData) {
                    console.warn(`User with ID ${userId} not found. Using default empty user.`);
                    // Provide a default structure if user not found, to prevent errors
                    currentUserData = {
                        id: userId,
                        username: "Guest",
                        profileImage: "images/user_avatar_placeholder.png",
                        readingLists: { currentlyReading: [], favorites: [], wantToRead: [] },
                        library: { saved: [], rented: [], subscribed: [] },
                        preferences: { favoriteGenres: [], notifications: false, darkMode: false },
                        readingStats: { booksReadThisMonth: 0, pagesReadThisWeek: 0, readingStreak: "0 days" }
                    };
                }
            } catch (error) {
                console.error("Failed to load user data:", error);
                currentUserData = null;
            }
        }
        return currentUserData;
    }

    function createBookCard(book, linkToSinglePage = false) {
        const rating = typeof book.rating === 'number' ? book.rating.toFixed(1) : 'N/A';
        const badgeClass = book.accessBadge ? book.accessBadge.toLowerCase() : 'free';
        const linkStart = linkToSinglePage ? `<a href="single.html?id=${book.id}" class="book-card-link">` : '';
        const linkEnd = linkToSinglePage ? '</a>' : '';

        return `
            <div class="book-card" data-book-id="${book.id}">
                ${linkStart}
                <img src="${book.coverImage || 'images/placeholder_cover.png'}" alt="${book.title}" class="book-cover" onerror="this.onerror=null;this.src='images/placeholder_cover.png';">
                <h3 class="book-title">${
