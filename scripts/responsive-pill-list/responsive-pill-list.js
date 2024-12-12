import { fetchLanguagePlaceholders, getPathDetails, htmlToElement } from '../scripts.js';
import { loadCSS } from '../lib-franklin.js';
import Dropdown, { DROPDOWN_VARIANTS } from '../dropdown/dropdown.js';

const CARDS_MAX_WIDTH = 645;

export default class ResponsivePillList {
  /**
   * Initializes the ResponsivePillList with provided options.
   * @param {Object} options - Configuration options for the ResponsivePillList.
   * @param {HTMLElement} options.wrapper - The wrapper element for the responsive list.
   * @param {Array} options.items - The items to be displayed in the list.
   * @param {string} options.defaultSelected - The default selected item.
   * @param {Function} options.onInitCallback - Callback function to be called on initialization.
   * @param {Function} options.onSelectCallback - Callback function to be called on item selection.
   */
  constructor({ wrapper, items, defaultSelected, onInitCallback, onSelectCallback }) {
    this.wrapper = wrapper;
    this.items = items;
    this.selectedItem = defaultSelected;
    this.onInitCallback = onInitCallback;
    this.onSelectCallback = onSelectCallback;
    this.isSelectedFromUser = false;
    this.initialize();
    this.main = document.querySelector('main');
  }

  /**
   * Initializes the component, fetching language placeholders and loading CSS.
   * @returns {Promise<void>}
   */
  async initialize() {
    const { lang } = getPathDetails();
    try {
      const [placeholders] = await Promise.all([
        fetchLanguagePlaceholders(lang),
        loadCSS(`${window.hlx.codeBasePath}/scripts/responsive-pill-list/responsive-pill-list.css`),
      ]);
      this.placeholders = placeholders;
      this.registerWrapperResizeHandler(() => {
        this.render();
      });
      this.onInitCallback?.();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error initializing: ', error);
    }
  }

  /**
   * Debounces a function call to limit its execution rate.
   * @param {number} ms - The debounce delay in milliseconds.
   * @param {Function} fn - The function to debounce.
   * @returns {Function} - The debounced function.
   */
  // eslint-disable-next-line class-methods-use-this
  debounce(func, delay) {
    let timeoutId;

    return function debounced(...args) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  }

  /**
   * Registers a resize observer for the wrapper, executing the callback on resize events.
   * @param {Function} callback - The callback to execute on resize.
   */
  registerWrapperResizeHandler(callback) {
    const debouncedCallback = this.debounce(callback, 200);
    const wrapperResizeObserver = new ResizeObserver(debouncedCallback);
    wrapperResizeObserver.observe(this.wrapper);
  }

  /**
   * Evaluates the width of the list and its wrapper to determine layout suitability.
   * @returns {Object} - An object containing the wrapper and list widths.
   */
  evaluateWidth() {
    const main = document.querySelector('main');
    const tempWrapper = document.createElement('div');
    tempWrapper.classList.add('section', 'responsive-pill-list');
    const tempUl = document.createElement('ul');
    this.items.forEach((item) => {
      const tempLi = document.createElement('li');
      tempLi.textContent = item.title;
      tempUl.appendChild(tempLi);
    });
    tempWrapper.appendChild(tempUl);
    tempWrapper.style.visibility = 'hidden';
    main.appendChild(tempWrapper);
    const wrapperWidth = tempWrapper.getBoundingClientRect().width;
    const listWidth = tempUl.getBoundingClientRect().width;
    const listItems = tempUl.querySelectorAll('li');
    const gapValueInPx = getComputedStyle(tempUl).gap;
    const gapValue = gapValueInPx ? parseInt(gapValueInPx, 10) : 0;
    const { items } = Array.from(listItems).reduce(
      (acc, curr) => {
        const itemWidth = curr.getBoundingClientRect().width;
        acc.width += itemWidth + gapValue;
        if (acc.width <= wrapperWidth && acc.width <= CARDS_MAX_WIDTH) {
          acc.items.push(curr.innerHTML);
        }
        return acc;
      },
      { width: 0, items: [] },
    );
    const widthInfo = {
      wrapperWidth,
      listWidth,
      fitItems: items,
    };
    main.removeChild(tempWrapper);
    return widthInfo;
  }

  /**
   * Selects a tab and triggers the corresponding selection callback.
   * @param {HTMLElement} selectedElement - The element representing the selected tab.
   */
  selectTab(selectedElement) {
    const currentActive = this.wrapper.querySelector('.responsive-pill-list ul li.active');
    if (currentActive === selectedElement) return;

    this.wrapper.querySelectorAll('.responsive-pill-list ul li').forEach((label) => label.classList.remove('active'));

    selectedElement.classList.add('active');
    this.selectedItem = selectedElement.dataset.tabId;

    if (this.isSelectedFromUser) {
      const value = selectedElement.dataset.tabId;
      this.onSelectCallback?.(value);
    }
  }

  prepareTabItemStructure(item) {
    const tabItem = document.createElement('li');
    tabItem.dataset.tabId = item.value;
    tabItem.textContent = item.title;
    tabItem.addEventListener('click', () => {
      this.isSelectedFromUser = true;
      this.selectTab(tabItem);
    });
    return tabItem;
  }

  renderMoreOptionsOverlay(overlayItems, tabList) {
    const moreProductsLabel = this.placeholders?.moreProductsLabel || 'More Products';
    const moreItemsWrapper = htmlToElement(`<li class="responsive-pill-list-more-options-wrapper">
          <div class="responsive-pill-list-more-option">
            <span>...</span>
          </div>
          <div class="responsive-pill-list-option-overlay">
            <p>${moreProductsLabel}</p>
            <ul class="responsive-pill-list-items-wrapper"></ul>
          <div>
        </li>`);

    const wrapperEl = moreItemsWrapper.querySelector('.responsive-pill-list-items-wrapper');
    const moreOptionsButton = moreItemsWrapper.querySelector('.responsive-pill-list-more-option');
    const moreOptionsOverlay = moreItemsWrapper.querySelector('.responsive-pill-list-option-overlay');

    const hideMoreOptionsOverlay = (e) => {
      if (e.target && !moreOptionsOverlay.contains(e.target)) {
        moreOptionsButton.classList.remove('responsive-pill-list-btn-active');
        moreOptionsOverlay.classList.remove('responsive-pill-list-option-overlay-visible');
        document.removeEventListener('click', hideMoreOptionsOverlay);
      }
    };

    moreOptionsButton.addEventListener('click', (e) => {
      moreOptionsOverlay.classList.toggle('responsive-pill-list-option-overlay-visible');
      if (moreOptionsOverlay.classList.contains('responsive-pill-list-option-overlay-visible')) {
        e.stopPropagation();
        moreOptionsButton.classList.add('responsive-pill-list-btn-active');
        const edgeScrollBuffer = 20;
        const rightEdge = moreOptionsOverlay.getBoundingClientRect().right + edgeScrollBuffer;
        const delta = rightEdge > window.innerWidth ? rightEdge - window.innerWidth : 0;
        if (delta) {
          moreOptionsOverlay.style.left = `-${delta + 24}px`;
        }
        document.addEventListener('click', hideMoreOptionsOverlay);
      } else {
        moreOptionsButton.classList.remove('responsive-pill-list-btn-active');
      }
    });
    overlayItems.forEach((overlayItem) => {
      const tabItem = this.prepareTabItemStructure(overlayItem);
      tabItem.addEventListener('click', () => {
        moreOptionsButton.classList.remove('responsive-pill-list-btn-active');
        moreOptionsOverlay.classList.remove('responsive-pill-list-option-overlay-visible');
      });
      wrapperEl.appendChild(tabItem);
    });
    tabList.appendChild(moreItemsWrapper);
  }

  /**
   * Renders the tabbed layout based on the provided items.
   */
  renderTabbedLayout(fitItems = []) {
    const tabWrapper = document.createElement('div');
    tabWrapper.classList.add('responsive-pill-list');
    const fitItemsCount = fitItems.length;
    const tabList = document.createElement('ul');
    const overlayItems = [];
    this.items.forEach((item, index) => {
      if (!fitItemsCount || (fitItemsCount && index < fitItemsCount)) {
        const tabItem = this.prepareTabItemStructure(item);
        tabList.appendChild(tabItem);
      } else {
        overlayItems.push(item);
      }
    });

    if (overlayItems.length) {
      this.renderMoreOptionsOverlay(overlayItems, tabList);
    }

    tabWrapper.appendChild(tabList);
    this.wrapper.appendChild(tabWrapper);

    if (this.selectedItem) {
      const defaultTabItem = tabList.querySelector(`[data-tab-id="${this.selectedItem}"]`);
      if (defaultTabItem) {
        this.selectTab(defaultTabItem);
      }
    }
  }

  /**
   * Renders the dropdown layout based on the provided items.
   */
  renderDropdown() {
    const uniqueId = `responsive-pill-list-item-${parseInt(Math.random() * 10 ** 8, 10)}`;
    const dropdown = new Dropdown(this.wrapper, this.selectedItem, this.items, DROPDOWN_VARIANTS.DEFAULT, uniqueId);

    dropdown.handleOnChange((selectedOptionValue) => {
      const option = this.items.find((opt) => opt.value === selectedOptionValue);
      this.selectedItem = option?.value;
      if (option?.value && this.onSelectCallback) {
        this.isSelectedFromUser = true;
        this.onSelectCallback(option.value);
      }
    });
  }

  /**
   * Renders the appropriate layout (tabbed or dropdown) based on the screen width.
   */
  render() {
    const isDesktop = window.matchMedia('(min-width:1024px)').matches;
    this.wrapper.textContent = '';
    if (isDesktop) {
      const { fitItems } = this.evaluateWidth();
      this.renderTabbedLayout(fitItems);
    } else {
      this.items = this.items.sort((a, b) => a.value - b.value);
      this.renderDropdown();
    }
  }
}