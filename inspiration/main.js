import { waitlist } from './data.js';

// DOM elements
const box = document.getElementById('signupBox');
const content = document.getElementById('signupContent');
const toggleIcon = document.getElementById('toggleIcon');
const checkIcon = document.getElementById('checkIcon');
const buttonText = document.getElementById('buttonText');
const emailInput = document.getElementById('emailInput');
const joinButton = document.getElementById('joinButton');
const placeholder = document.getElementById('placeholder');
const toggleArea = document.getElementById('signupToggle');
const grid = document.getElementById('masonry-grid');

let hasScrolled = false;
let msnry;
let isInputFocused = false;
let joined = false;

// Variables for infinite scroll
let currentPage = 0;
const itemsPerPage = 73; // Adjust based on your needs
let isLoading = false;
const loadingThreshold = 200; // px from bottom to trigger loading

// Declare observers at global scope so they're accessible everywhere
let observer;
let animationObserver;

// Signup box functions
function updateSignupBoxWidth() {
  if (placeholder) {
    const width = placeholder.offsetWidth;
    if (width > 0) {
      const offset = hasScrolled ? 8 : 0;
      box.style.width = `${width + offset}px`;
      box.classList.remove('opacity-0');
    }
  }
}

function collapseBox() {
  // Add a temporary class to control the content transition speed
  box.classList.add('collapsing');

  // Apply all changes at once
  requestAnimationFrame(() => {
    box.classList.add('collapsed');
    box.classList.add('scrolled');
    content.classList.remove('opacity-100');
    content.classList.add('opacity-0', 'scale-y-0');
    if (toggleIcon) toggleIcon.classList.remove('hidden');
    updateSignupBoxWidth();

    // Remove the temporary class after transition completes
    setTimeout(() => {
      box.classList.remove('collapsing');
    }, 300); // Match the main transition duration
  });
}

function expandBox() {
  // Remove the collapsing class if it exists
  box.classList.remove('collapsing');

  // Apply all changes at once
  requestAnimationFrame(() => {
    box.classList.remove('collapsed');
    content.classList.remove('opacity-0', 'scale-y-0');
    content.classList.add('opacity-100', 'scale-y-100');
    if (hasScrolled) {
      box.classList.add('scrolled');
    } else {
      box.classList.remove('scrolled');
    }
    if (toggleIcon && !hasScrolled) toggleIcon.classList.add('hidden');
    updateSignupBoxWidth();
  });
}

async function submitEmail() {
  const email = emailInput.value.trim();
  if (!email || !email.includes('@')) {
    emailInput.classList.add('border-red-500', 'text-red-500');
    return;
  }

  // Clear any previous error styling
  emailInput.classList.remove('border-red-500', 'text-red-500');

  // Update button text to show loading state
  buttonText.innerText = 'Joining...';
  joinButton.disabled = true;

  try {
    // Make API call to subscribe endpoint
    const response = await fetch('https://us-central1-job-board-d133a.cloudfunctions.net/api/recent-work-waitlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    if (response.ok) {
      // Success - show check icon and update text
      checkIcon.classList.remove('hidden');

      // Reset animations
      checkIcon.style.animation = 'none';
      const checkPath = checkIcon.querySelector('.check-path');
      if (checkPath) checkPath.style.animation = 'none';

      void checkIcon.offsetWidth;
      if (checkPath) void checkPath.offsetWidth;

      checkIcon.style.animation = '';
      if (checkPath) checkPath.style.animation = '';

      buttonText.innerText = 'Joined!';
      joined = true;
    } else {
      console.error("Failed to join waitlist. Status:", response.status);
      buttonText.innerText = 'Try again';
    }
  } catch (error) {
    console.error("Error joining waitlist:", error);
    buttonText.innerText = 'Try again';
  } finally {
    joinButton.disabled = false;
  }
}

// Lazy loading function
function lazyLoadMedia(card) {
  const img = card.querySelector('img.grid-image');
  const video = card.querySelector('video.hover-video');

  if (img && img.dataset.src) {
    img.onload = () => {
      card.classList.add('visible');
      if (msnry) msnry.layout();
    };
    img.src = img.dataset.src;
  } else if (video && video.dataset.src) {
    // Remove existing <source> if any
    while (video.firstChild) {
      video.removeChild(video.firstChild);
    }

    // Create and append new source element
    const source = document.createElement('source');
    source.src = video.dataset.src;
    source.type = 'video/mp4';
    video.appendChild(source);

    // Load and show after video is ready
    video.load();
    video.onloadeddata = () => {
      card.classList.add('visible');
      if (msnry) msnry.layout();
    };
  }
}

// Create and add items to the grid
function createGridItems() {
  // Make sure we have the waitlist data
  if (!waitlist || !Array.isArray(waitlist)) {
    console.error('Waitlist data is missing or not an array');
    return;
  }

  waitlist.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'grid-item';

    const isVideo = item.type === 'video';
    const mediaElement = isVideo
      ? `<div class="video-container">
          <video data-src="https://vz-9bfac59c-07e.b-cdn.net/${item.image}/play_720p.mp4"
                 muted preload="metadata" class="hover-video"
                 playsinline loop
                 poster="https://vz-9bfac59c-07e.b-cdn.net/${item.image}/thumbnail.jpg"></video>
         </div>`
      : `<img data-src="https://recent-work.b-cdn.net/${item.image}" alt="${item.title ? item.title : item.name}" class="grid-image" />`;

    card.innerHTML = `
    ${mediaElement}
    <div class="overlay">
      <div class="top-row">
        ${item.name && item.link ? `
          <a href="${item.link}" target="_blank" rel="noopener noreferrer">
            <div class="name-group">
              ${item.avatar ? `<img src="https://recent-work.b-cdn.net/${item.avatar}" alt="${item.name}" />` : ''}
              <p>${item.name}</p>
            </div>
          </a>` : ''}
        ${item.name && !item.link ? `
          <div class="name-group">
            ${item.avatar ? `<img src="https://recent-work.b-cdn.net/${item.avatar}" alt="${item.name}" />` : ''}
            <p>${item.name}</p>
          </div>` : ''}
        ${item.link ? `
          <div class="link-icon">
            <a href="${item.link}" target="_blank" rel="noopener noreferrer">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.8076 8.46864L18.8808 0H17.2046L11.063 7.3532L6.15769 0H0.5L7.91779 11.1193L0.5 20H2.17621L8.66194 12.2348L13.8423 20H19.5L11.8072 8.46864H11.8076ZM9.51178 11.2173L8.7602 10.1101L2.78017 1.29968H5.35474L10.1807 8.40994L10.9323 9.51718L17.2054 18.7594H14.6309L9.51178 11.2177V11.2173Z" fill="black"/>
              </svg>
            </a>
          </div>` : ''}
      </div>
      ${item.title ? `
        <div class="bottom-text">
          <p>${item.title}</p>
        </div>` : ''}
    </div>
  `;

    const video = card.querySelector('video');
    const container = video ? video.closest('.video-container') : null;

    // Function to check if device is mobile
    const isMobile = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    };

    // Desktop hover behavior
    if (!isMobile()) {
      if (video) {
        card.addEventListener('mouseenter', () => {
          video.play();
          if (container) container.classList.add('video-playing');
        });

        card.addEventListener('mouseleave', () => {
          video.pause();
          video.currentTime = 0;
          if (container) container.classList.remove('video-playing');
        });
      }
    } else {
      // Mobile tap behavior
      card.addEventListener('click', (e) => {
        // Don't trigger if clicking on a link
        if (e.target.closest('a')) return;

        // Toggle active state
        const wasActive = card.classList.contains('active');

        // Remove active class from all cards
        document.querySelectorAll('.grid-item.active').forEach(item => {
          item.classList.remove('active');

          // Pause any playing videos in other cards
          const otherVideo = item.querySelector('video');
          if (otherVideo && otherVideo !== video) {
            otherVideo.pause();
            otherVideo.currentTime = 0;
            const otherContainer = otherVideo.closest('.video-container');
            if (otherContainer) otherContainer.classList.remove('video-playing');
          }
        });

        // Toggle this card
        if (!wasActive) {
          card.classList.add('active');
          if (video) {
            video.play();
            if (container) container.classList.add('video-playing');
          }
        } else {
          if (video) {
            video.pause();
            video.currentTime = 0;
            if (container) container.classList.remove('video-playing');
          }
        }
      });
    }

    // Create an Intersection Observer for videos on mobile
    if (isMobile() && video) {
      const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          // When video comes into view
          if (entry.isIntersecting) {
            // Only autoplay if not already playing from tap
            if (!card.classList.contains('active')) {
              video.play();
              if (container) container.classList.add('video-playing');
            }
          } else {
            // When video goes out of view
            video.pause();
            if (container) container.classList.remove('video-playing');
          }
        });
      }, { threshold: 0.5 }); // Play when at least 50% visible

      videoObserver.observe(video);
    }

    grid.appendChild(card);
  });
}

function loadMoreItems() {
  if (isLoading) return;

  isLoading = true;

  // Clone the existing data to simulate loading more
  const itemsToAdd = [...waitlist].slice(0, itemsPerPage);
  const fragment = document.createDocumentFragment();
  const newItems = [];

  // Create and add new items
  itemsToAdd.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'grid-item grid-item new-item';

    const isVideo = item.type === 'video';
    const mediaElement = isVideo
      ? `<div class="video-container">
          <video data-src="https://vz-9bfac59c-07e.b-cdn.net/${item.image}/play_720p.mp4"
                 muted preload="metadata" class="hover-video"
                 playsinline loop
                 poster="https://vz-9bfac59c-07e.b-cdn.net/${item.image}/thumbnail.jpg"></video>
         </div>`
      : `<img data-src="https://recent-work.b-cdn.net/${item.image}" alt="${item.title ? item.title : item.name}" class="grid-image" />`;

    card.innerHTML = `
      ${mediaElement}
      <div class="overlay">
        <div class="top-row">
          ${item.name && item.link ? `
            <a href="${item.link}" target="_blank" rel="noopener noreferrer">
              <div class="name-group">
                ${item.avatar ? `<img src="https://recent-work.b-cdn.net/${item.avatar}" alt="${item.name}" />` : ''}
                <p>${item.name}</p>
              </div>
            </a>` : ''}
          ${item.name && !item.link ? `
            <div class="name-group">
              ${item.avatar ? `<img src="https://recent-work.b-cdn.net/${item.avatar}" alt="${item.name}" />` : ''}
              <p>${item.name}</p>
            </div>` : ''}
          ${item.link ? `
            <div class="link-icon">
              <a href="${item.link}" target="_blank" rel="noopener noreferrer">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.8076 8.46864L18.8808 0H17.2046L11.063 7.3532L6.15769 0H0.5L7.91779 11.1193L0.5 20H2.17621L8.66194 12.2348L13.8423 20H19.5L11.8072 8.46864H11.8076ZM9.51178 11.2173L8.7602 10.1101L2.78017 1.29968H5.35474L10.1807 8.40994L10.9323 9.51718L17.2054 18.7594H14.6309L9.51178 11.2177V11.2173Z" fill="black"/>
                </svg>
              </a>
            </div>` : ''}
        </div>
        ${item.title ? `
          <div class="bottom-text">
            <p>${item.title}</p>
          </div>` : ''}
      </div>
    `;

    const video = card.querySelector('video');
    if (video) {
      const container = video.closest('.video-container');

      card.addEventListener('mouseenter', () => {
        video.play();
        if (container) container.classList.add('video-playing');
      });

      card.addEventListener('mouseleave', () => {
        video.pause();
        video.currentTime = 0;
        if (container) container.classList.remove('video-playing');
      });
    }

    fragment.appendChild(card);
    newItems.push(card);
  });

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
  // Event listeners for signup box
  joinButton.addEventListener('click', submitEmail);

  // Add event listener for Enter key in email input
  emailInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent form submission if inside a form
      submitEmail();
    }
  });

  toggleArea.addEventListener('click', () => {
    if (box.classList.contains('collapsed')) {
      expandBox();
    } else {
      collapseBox();
    }
  });

  window.addEventListener('load', () => {
    updateSignupBoxWidth();
    expandBox();
  });

  window.addEventListener('resize', updateSignupBoxWidth);

  // Modify your scroll event handler
  window.addEventListener('scroll', () => {
    hasScrolled = window.scrollY > 100;

    // Only collapse if input is not focused
    if (hasScrolled && !isInputFocused) {
      collapseBox();
      if (toggleIcon) toggleIcon.classList.remove('hidden');
    } else {
      box.classList.remove('scrolled');
      expandBox();
      if (toggleIcon) toggleIcon.classList.add('hidden');
    }

    // Handle infinite scroll
    const scrollY = window.scrollY || window.pageYOffset;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    if (scrollY + windowHeight >= documentHeight - loadingThreshold) {
      loadMoreItems();
    }
  });

    // Add focus and blur event listeners to the email input
  if (emailInput) {
    emailInput.addEventListener('focus', () => {
      isInputFocused = true;
      // Prevent collapse while input is focused
      expandBox();
    });

    emailInput.addEventListener('blur', () => {
      isInputFocused = false;
      // After a short delay, check if we should collapse based on scroll position
      setTimeout(() => {
        if (hasScrolled && !isInputFocused) {
          collapseBox();
        }
      }, 300);
    });
  }

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
    updateSignupBoxWidth();
  }, 500);
});
