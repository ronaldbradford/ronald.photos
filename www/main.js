import { imageData } from './data.js';

// DOM elements
const content = document.getElementById('signupContent');
const toggleIcon = document.getElementById('toggleIcon');
const checkIcon = document.getElementById('checkIcon');
const placeholder = document.getElementById('placeholder');
const grid = document.getElementById('masonry-grid');

let hasScrolled = false;
let msnry;
let isInputFocused = false;

// Variables for infinite scroll
let currentPage = 0;
const itemsPerPage = 21; // Adjust based on your needs
let isLoading = false;
const loadingThreshold = 200; // px from bottom to trigger loading

// Declare observers at global scope so they're accessible everywhere
let observer;
let animationObserver;

// Lazy loading function
function lazyLoadMedia(card) {
  const img = card.querySelector('img.grid-image');

  if (img && img.dataset.src) {
    img.onload = () => {
      card.classList.add('visible');
      if (msnry) msnry.layout();
    };
    img.src = img.dataset.src;
  }
}

// Create and add items to the grid
function createGridItems() {
  if (!imageData || !Array.isArray(imageData)) {
    console.error('Waitlist data is missing or not an array');
    return;
  }

  // Function to check if device is mobile
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
  };

  const randomizedImageData = [...imageData].sort(() => Math.random() - 0.5);
  randomizedImageData.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'grid-item';

    card.innerHTML = `<img data-src="images/${item.image}" alt="${item.title}" class="grid-image" />`;

    // Desktop hover behavior
    if (isMobile()) {
      // Mobile tap behavior
      card.addEventListener('click', (e) => {
        // Don't trigger if clicking on a link
        if (e.target.closest('a')) return;

        // Toggle active state
        const wasActive = card.classList.contains('active');

        // Remove active class from all cards
        document.querySelectorAll('.grid-item.active').forEach(item => {
          item.classList.remove('active');
        });

        // Toggle this card
        if (!wasActive) {
          card.classList.add('active');
        }
      });
    }
    grid.appendChild(card);
  });
}

function loadMoreItems() {
  if (isLoading) return;

  isLoading = true;

  // Clone the existing data to simulate loading more
  const fragment = document.createDocumentFragment();
  const newItems = [];

  // Append all new items at once
  grid.appendChild(fragment);

  // Use imagesLoaded to wait for images to load before updating layout
  imagesLoaded(newItems).on('progress', (instance, image) => {
    // Lazy load the image that just loaded
    const card = image.img.closest('.grid-item');
    if (card) {
      lazyLoadMedia(card);
    }
  }).on('always', () => {
    // All images have loaded (or failed)

    // Add new items to Masonry
    msnry.appended(newItems);

    // Observe new items for animation
    newItems.forEach(card => {
      if (animationObserver) {
        animationObserver.observe(card);
      }
    });

    // Force layout update
    msnry.layout();

    isLoading = false;
    currentPage++;
  });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {

  // Modify your scroll event handler
  window.addEventListener('scroll', () => {
    hasScrolled = window.scrollY > 100;

    // Only collapse if input is not focused
    if (hasScrolled && !isInputFocused) {
      if (toggleIcon) toggleIcon.classList.remove('hidden');
    } else {
      if (toggleIcon) toggleIcon.classList.add('hidden');
    }

    // Handle infinite scroll
    //const scrollY = window.scrollY || window.pageYOffset;
    //const windowHeight = window.innerHeight;
    //const documentHeight = document.documentElement.scrollHeight;

    //if (scrollY + windowHeight >= documentHeight - loadingThreshold) {
    //  loadMoreItems();
    //}
  });

  // Create grid items
  createGridItems();

  // Add a grid sizer element for percentage-based sizing
  const gridSizer = document.createElement('div');
  gridSizer.className = 'grid-sizer';
  grid.prepend(gridSizer);

  // Initialize Masonry
  msnry = new Masonry(grid, {
    itemSelector: '.grid-item',
    columnWidth: '.grid-sizer',
    gutter: 24,
    percentPosition: true,
    horizontalOrder: false,
    fitWidth: false,
    transitionDuration: 0,
    stagger: 1000,
    initLayout: true
  });

  // Initialize Intersection Observer for lazy loading
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const card = entry.target;
        lazyLoadMedia(card);
        observer.unobserve(card);
      }
    });
  }, { threshold: 0.1 });

  // Create a separate observer for scroll-in animation
  animationObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Add a small delay before adding the visible class
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, 100);
        animationObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px' // Trigger slightly before items come into view
  });

  // Observe all items for animation and lazy loading (except placeholder)
  document.querySelectorAll('.grid-item:not(.placeholder-item)').forEach(item => {
    observer.observe(item);
    animationObserver.observe(item);
  });

  // Layout Masonry after images have loaded
  imagesLoaded(grid).on('progress', (instance, image) => {
    // Individual image has loaded
    msnry.layout();
  }).on('always', () => {
    msnry.layout();
  });

  // Force a layout update after a short delay
  setTimeout(() => {
    msnry.layout();
  }, 500);
});
