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

export default function decorate(block) {
  const [heading, description, firstCta, secondCta] = [...block.children].map(
    (row) => row.firstElementChild
  );

  console.log(heading);
  
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
}