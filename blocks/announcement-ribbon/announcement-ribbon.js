import { decorateIcons } from "../../scripts/lib-franklin.js";

function decorateButtons(...buttons) {
  return buttons
    .map((div) => {
      const a = div.querySelector('a');
      if (a) {
        a.classList.add('button');
        if (a.parentElement.tagName === 'EM') a.classList.add('secondary');
        if (a.parentElement.tagName === 'STRONG') a.classList.add('primary');
        return a.outerHTML;
      }
      return '';
    })
    .join('');
}
function handleRibbonClose() {
//   console.log("clicked");
  const ribbonContainer = document.querySelector('.announcement-ribbon-container');
  if (ribbonContainer) {
    // Hide the ribbon container
    ribbonContainer.style.display = 'none';
    // Set session storage key to hide it across page loads
    sessionStorage.setItem('hideRibbonBlock', true);
  }
}

// Function to check session storage and hide the ribbon if it was previously closed
function checkRibbonDisplay() {
//   console.log("clicked");
  const ribbonContainer = document.querySelector('.announcement-ribbon-container');
  const isRibbonHidden = sessionStorage.getItem('hideRibbonBlock');

  if (isRibbonHidden && ribbonContainer) {
    // Hide the ribbon if session storage indicates it should be hidden
    ribbonContainer.style.display = 'none';
  }
}

export default function decorate(block) {
  const [heading, description, firstCta, secondCta] = [...block.children].map(
    (row) => row.firstElementChild
  );

//   console.log(heading);
  
  heading?.classList.add("ribbon-heading");
  description?.classList.add("ribbon-description");

  // Correctly use `description.outerHTML`
  const ribbonDOM = document.createRange().createContextualFragment(`
    <div class="ribbon-text-content">
      ${heading ? heading.outerHTML : ""}
      ${description ? description.outerHTML : ""}
    </div>
    <div class="ribbon-cta">
      ${decorateButtons(firstCta, secondCta)}
    </div>
    <span class="icon icon-close"></span>
  `);

  // Clear the block content and append the new structure
  block.textContent = "";
  block.append(ribbonDOM);

  // Decorate icons
  decorateIcons(block);

  // Add Event Listener
  const closeIcon = block.querySelector('.icon-close');
  if (closeIcon) {
    closeIcon.addEventListener('click', handleRibbonClose); // Add click handler to close icon
  }
  checkRibbonDisplay();
}