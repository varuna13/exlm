import { decorateIcons } from "../../scripts/lib-franklin.js";

// Function to decorate buttons inside the ribbon block
function decorateButtons(...buttons) {
  return buttons
    .map((button) => {
      const link = button.querySelector('a');
      if (link) {
        link.classList.add('button');
        if (link.parentElement.tagName === 'EM') link.classList.add('secondary');
        if (link.parentElement.tagName === 'STRONG') link.classList.add('primary');
        return link.outerHTML;
      }
      return '';
    })
    .join('');
}

// Function to hide a specific ribbon and update session storage based on data-id
function hideRibbon(ribbonContainer) {
  const ribbonId = ribbonContainer.dataset.id;
  if (ribbonId) {
    ribbonContainer.style.display = 'none';
    sessionStorage.setItem(`hideRibbonBlock-${ribbonId}`, 'true');
  }
}

// Function to check session storage and hide the ribbon if it was previously closed
function checkRibbonDisplay(ribbonContainer) {
  const ribbonId = ribbonContainer.dataset.id;
  const isRibbonHidden = sessionStorage.getItem(`hideRibbonBlock-${ribbonId}`) === 'true';
  if (isRibbonHidden) {
    ribbonContainer.style.display = 'none';
  }
}

// Function to observe data-section-status change and apply logic when it's "loaded"
function observeRibbonLoad(ribbonContainer) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (
        mutation.attributeName === 'data-section-status' &&
        ribbonContainer.getAttribute('data-section-status') === 'loaded'
      ) {
        // Section is fully loaded, now apply checkRibbonDisplay logic
        checkRibbonDisplay(ribbonContainer);
        observer.disconnect(); // Stop observing once loaded
      }
    });
  });

  // Start observing the ribbon container for attribute changes
  observer.observe(ribbonContainer, { attributes: true });
}

// Function to set a unique data-id for each ribbon container if not already set
function setRibbonDataId() {
  document.querySelectorAll('.announcement-ribbon-container').forEach((ribbon, index) => {
    if (!ribbon.dataset.id) {
      ribbon.dataset.id = `ribbon${index + 1}`;
    }
  });
}

export default function decorate(block) {
  // Call setRibbonDataId to ensure all ribbon containers have a unique data-id
  setRibbonDataId();

  // Find the ribbon container for the current block
  const ribbonContainer = block.closest('.announcement-ribbon-container');

  const [heading, description, firstCta, secondCta] = [...block.children].map(
    (row) => row.firstElementChild
  );

  heading?.classList.add('ribbon-heading');
  description?.classList.add('ribbon-description');

  const ribbonContent = `
    <div class="ribbon-text-content">
      ${heading ? heading.outerHTML : ''}
      ${description ? description.outerHTML : ''}
    </div>
    <div class="ribbon-cta">
      ${decorateButtons(firstCta, secondCta)}
    </div>
    <span class="icon icon-close"></span>
  `;

  // Clear block and append the new structure
  block.innerHTML = ribbonContent;

  // Decorate icons
  decorateIcons(block);

  // Add close button functionality
  const closeIcon = block.querySelector('.icon-close');
  if (closeIcon && !window.location.href.includes(".html")) {
    closeIcon.addEventListener('click', () => hideRibbon(ribbonContainer));
  }

  // Observe when the ribbon is fully loaded by checking data-section-status
  observeRibbonLoad(ribbonContainer);
}
