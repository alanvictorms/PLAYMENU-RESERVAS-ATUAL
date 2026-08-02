/*
 * PlayMenu UI
 * Interacoes compartilhadas do painel administrativo de restaurantes.
 *
 * Este arquivo e inicializado somente em:
 *   <body class="ui-kit-page restaurant-admin-page">
 *
 * Os seletores seguem o UI Kit oficial. Regras de negocio e contratos
 * especificos de pagina permanecem nos respectivos arquivos PHP.
 */
(function () {
  'use strict';

  var BODY_SELECTOR = 'body.ui-kit-page.restaurant-admin-page';
  var MOBILE_QUERY = '(max-width: 860px)';
  var OVERLAY_SELECTOR = '[data-ui-overlay], .ui-overlay';
  var FOCUSABLE_SELECTOR = [
    'a[href]',
    'area[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'details > summary:first-of-type',
    '[contenteditable="true"]',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  var body = null;
  var sidebar = null;
  var sidebarOverlay = null;
  var sidebarToggles = [];
  var mainContent = null;
  var lastSidebarTrigger = null;
  var mobileMedia = null;
  var reducedMotionMedia = null;
  var mainInertState = null;
  var toastStack = null;
  var toastSequence = 0;
  var idSequence = 0;
  var overlayObserver = null;
  var overlayStates = new WeakMap();
  var activeOverlays = [];
  var scrollLockState = { locked: false, overflow: '' };

  function query(selector, context) {
    return (context || document).querySelector(selector);
  }

  function queryAll(selector, context) {
    return Array.prototype.slice.call((context || document).querySelectorAll(selector));
  }

  function closest(element, selector) {
    if (!element || element.nodeType !== 1 || typeof element.closest !== 'function') return null;
    return element.closest(selector);
  }

  function ensureId(element, prefix) {
    if (!element) return '';
    if (!element.id) {
      idSequence += 1;
      element.id = prefix + '-' + idSequence;
    }
    return element.id;
  }

  function aplicarMicroZoom() {
  const elemento = document.documentElement;
  const zoomOriginal = elemento.style.zoom;

  // Aumenta exatamente 0,01%
  elemento.style.zoom = "100.01%";

  // Aguarda dois frames para o navegador renderizar a alteração
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      elemento.style.zoom = zoomOriginal;
    });
  });
}

// Executa assim que toda a página terminar de carregar
if (document.readyState === "complete") {
  aplicarMicroZoom();
} else {
  window.addEventListener("load", aplicarMicroZoom, { once: true });
}

  function prefersReducedMotion() {
    return Boolean(reducedMotionMedia && reducedMotionMedia.matches);
  }

  function transitionDelay(milliseconds) {
    return prefersReducedMotion() ? 0 : milliseconds;
  }

  function isMobileViewport() {
    return mobileMedia ? mobileMedia.matches : window.innerWidth <= 860;
  }

  function isVisible(element) {
    if (!element || element.hidden || element.getAttribute('aria-hidden') === 'true') return false;
    var style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
  }

  function focusableElements(container) {
    if (!container) return [];
    return queryAll(FOCUSABLE_SELECTOR, container).filter(function (element) {
      return isVisible(element);
    });
  }

  function safeFocus(element) {
    if (!element || typeof element.focus !== 'function') return;
    try {
      element.focus({ preventScroll: true });
    } catch (error) {
      element.focus();
    }
  }

  function topOverlay() {
    return activeOverlays.length ? activeOverlays[activeOverlays.length - 1] : null;
  }

  function isSidebarOpen() {
    return Boolean(sidebar && sidebar.classList.contains('open'));
  }

  function syncBodyScrollLock() {
    var shouldLock = isSidebarOpen() || activeOverlays.length > 0;

    if (shouldLock && !scrollLockState.locked) {
      scrollLockState.overflow = body.style.overflow;
      body.style.overflow = 'hidden';
      scrollLockState.locked = true;
      return;
    }

    if (!shouldLock && scrollLockState.locked) {
      body.style.overflow = scrollLockState.overflow;
      scrollLockState.overflow = '';
      scrollLockState.locked = false;
    }
  }

  function setMainContentInert(inert) {
    if (!mainContent) return;

    if (inert) {
      if (!mainInertState) {
        mainInertState = {
          hadInert: mainContent.hasAttribute('inert'),
          ariaHidden: mainContent.getAttribute('aria-hidden')
        };
      }
      mainContent.setAttribute('inert', '');
      mainContent.setAttribute('aria-hidden', 'true');
      return;
    }

    if (!mainInertState) {
      mainContent.removeAttribute('inert');
      mainContent.removeAttribute('aria-hidden');
      return;
    }

    if (!mainInertState.hadInert) mainContent.removeAttribute('inert');
    if (mainInertState.ariaHidden === null) mainContent.removeAttribute('aria-hidden');
    else mainContent.setAttribute('aria-hidden', mainInertState.ariaHidden);
    mainInertState = null;
  }

  /* Sidebar oficial e navegacao mobile acessivel. */
  function setSidebarToggleState(open) {
    sidebarToggles.forEach(function (toggle) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Fechar menu de navegação' : 'Abrir menu de navegação');
    });
  }

  function syncSidebarSemantics(open) {
    if (!sidebar) return;
    sidebar.setAttribute('aria-hidden', isMobileViewport() && !open ? 'true' : 'false');

    if (sidebarOverlay) {
      sidebarOverlay.classList.toggle('visible', open);
      sidebarOverlay.hidden = !open;
      sidebarOverlay.setAttribute('aria-hidden', open ? 'false' : 'true');
    }
  }

  function updateSidebarClip() {
    if (!sidebar) return;
    var active = query('.nav-btn.active, .nav-btn[aria-current="page"]', sidebar);
    var width = sidebar.offsetWidth;
    var height = sidebar.offsetHeight;

    if (!active || !width || !height) {
      sidebar.style.removeProperty('--sidebar-clip');
      return;
    }

    var sidebarRect = sidebar.getBoundingClientRect();
    var activeRect = active.getBoundingClientRect();
    var centerY = activeRect.top + activeRect.height / 2 - sidebarRect.top;
    var centerX = activeRect.left + activeRect.width / 2 - sidebarRect.left;
    var cutoutRadius = 50;
    var cornerRadius = 28;
    var deltaX = width - cornerRadius - centerX;
    var distance = cutoutRadius + cornerRadius;
    var deltaY = Math.sqrt(Math.max(distance * distance - deltaX * deltaX, 0));
    var tangentX = centerX + (deltaX * cutoutRadius) / distance;
    var tangentY = (deltaY * cutoutRadius) / distance;
    var round = function (number) { return Math.round(number * 100) / 100; };
    var path =
      'M0,0 H' + (width - 40) +
      ' A40,40 0 0 1 ' + width + ',40' +
      ' V' + round(centerY - deltaY) +
      ' A' + cornerRadius + ',' + cornerRadius + ' 0 0 1 ' + round(tangentX) + ',' + round(centerY - tangentY) +
      ' A' + cutoutRadius + ',' + cutoutRadius + ' 0 1 0 ' + round(tangentX) + ',' + round(centerY + tangentY) +
      ' A' + cornerRadius + ',' + cornerRadius + ' 0 0 1 ' + width + ',' + round(centerY + deltaY) +
      ' V' + (height - 40) +
      ' A40,40 0 0 1 ' + (width - 40) + ',' + height +
      ' H0 Z';

    sidebar.style.setProperty('--sidebar-clip', 'path("' + path + '")');
  }

  function setSidebarOpen(open, options) {
    if (!sidebar) return;
    options = options || {};
    open = Boolean(open && isMobileViewport());

    if (open && topOverlay()) closeOverlay(topOverlay(), false);
    if (open && options.trigger) lastSidebarTrigger = options.trigger;

    sidebar.classList.toggle('open', open);
    setSidebarToggleState(open);
    syncSidebarSemantics(open);
    setMainContentInert(open);
    syncBodyScrollLock();

    window.requestAnimationFrame(function () {
      updateSidebarClip();
      if (!open || options.focus === false) return;
      var firstControl = query('.sidebar__nav a[href], .sidebar__nav button:not([disabled]), a[href], button:not([disabled])', sidebar);
      safeFocus(firstControl || sidebar);
    });

    if (!open && options.restoreFocus && lastSidebarTrigger) safeFocus(lastSidebarTrigger);
  }

  function openSidebar(trigger) {
    if (!isMobileViewport()) return;
    setSidebarOpen(true, { trigger: trigger, focus: true });
  }

  function closeSidebar(restoreFocus) {
    setSidebarOpen(false, { restoreFocus: restoreFocus !== false });
  }

  function toggleSidebar(trigger) {
    if (isSidebarOpen()) closeSidebar(true);
    else openSidebar(trigger);
  }

  function handleSidebarViewportChange() {
    if (!sidebar) return;
    if (!isMobileViewport()) {
      setSidebarOpen(false, { restoreFocus: false });
      sidebar.setAttribute('aria-hidden', 'false');
    } else {
      syncSidebarSemantics(isSidebarOpen());
    }
    window.requestAnimationFrame(updateSidebarClip);
  }

  function trapSidebarFocus(event) {
    if (event.key !== 'Tab' || !isSidebarOpen() || !isMobileViewport()) return;
    var controls = sidebarToggles.concat(focusableElements(sidebar)).filter(function (element, index, items) {
      return isVisible(element) && items.indexOf(element) === index;
    });
    if (!controls.length) return;

    var first = controls[0];
    var last = controls[controls.length - 1];
    var current = document.activeElement;

    if (event.shiftKey && current === first) {
      event.preventDefault();
      safeFocus(last);
    } else if (!event.shiftKey && current === last) {
      event.preventDefault();
      safeFocus(first);
    } else if (controls.indexOf(current) === -1) {
      event.preventDefault();
      safeFocus(event.shiftKey ? last : first);
    }
  }

  function initSidebar() {
    sidebar = query('[data-ui-sidebar], .sidebar', body);
    sidebarOverlay = query('[data-ui-sidebar-overlay], .sidebar-overlay', body);
    sidebarToggles = queryAll('[data-ui-sidebar-toggle], .hamburger', body);
    mainContent = query('.ui-kit-main, main', body);
    mobileMedia = window.matchMedia ? window.matchMedia(MOBILE_QUERY) : null;

    if (!sidebar) return;
    ensureId(sidebar, 'playmenu-sidebar');

    sidebarToggles.forEach(function (toggle) {
      toggle.setAttribute('aria-controls', sidebar.id);
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menu de navegação');
    });

    syncSidebarSemantics(false);
    updateSidebarClip();

    if (mobileMedia) {
      if (typeof mobileMedia.addEventListener === 'function') {
        mobileMedia.addEventListener('change', handleSidebarViewportChange);
      } else if (typeof mobileMedia.addListener === 'function') {
        mobileMedia.addListener(handleSidebarViewportChange);
      }
    } else {
      window.addEventListener('resize', handleSidebarViewportChange);
    }
    window.addEventListener('resize', updateSidebarClip);
  }

  /* Toasts sem conteudo demonstrativo. */
  function ensureToastStack() {
    if (toastStack && document.documentElement.contains(toastStack)) return toastStack;
    toastStack = query('.ui-toast-stack', body);
    if (!toastStack) {
      toastStack = document.createElement('div');
      toastStack.className = 'ui-toast-stack';
      toastStack.setAttribute('aria-live', 'polite');
      toastStack.setAttribute('aria-atomic', 'true');
      body.appendChild(toastStack);
    }
    return toastStack;
  }

  function removeToast(toast) {
    if (!toast || toast.classList.contains('is-leaving')) return;
    toast.classList.add('is-leaving');
    window.setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, transitionDelay(240));
  }

  function showToast(message, type, duration) {
    if (!message) return null;
    var stack = ensureToastStack();
    var resolvedType = ['info', 'success', 'warning', 'danger'].indexOf(type) !== -1 ? type : 'info';
    var iconId = {
      info: 'ui-icon-info',
      success: 'ui-icon-check-circle',
      warning: 'ui-icon-alert',
      danger: 'ui-icon-x-circle'
    }[resolvedType];

    toastSequence += 1;
    var toast = document.createElement('div');
    toast.className = 'ui-toast-item ui-toast-item--' + resolvedType;
    toast.setAttribute('role', resolvedType === 'danger' ? 'alert' : 'status');
    toast.setAttribute('data-ui-toast-id', String(toastSequence));

    var icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('class', 'ui-icon');
    icon.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#' + iconId);
    icon.appendChild(use);

    var text = document.createElement('p');
    text.textContent = String(message);

    var close = document.createElement('button');
    close.type = 'button';
    close.setAttribute('aria-label', 'Fechar notificação');
    close.innerHTML = '<svg class="ui-icon" aria-hidden="true"><use href="#ui-icon-close"></use></svg>';
    close.addEventListener('click', function () { removeToast(toast); });

    toast.appendChild(icon);
    toast.appendChild(text);
    toast.appendChild(close);
    stack.appendChild(toast);

    while (stack.children.length > 4) stack.removeChild(stack.firstElementChild);
    window.setTimeout(function () { removeToast(toast); }, Math.max(1200, Number(duration) || 3600));
    return toast;
  }

  /* Dropdowns e menus contextuais. */
  function dropdownMenuFor(trigger) {
    var root = closest(trigger, '.ui-dropdown');
    return root ? query('.ui-dropdown__menu', root) : null;
  }

  function syncTableMenuShell(menu) {
    var shell = closest(menu, '.ui-table-shell');
    if (!shell) return;
    var hasOpenMenu = queryAll('.ui-dropdown__menu', shell).some(function (candidate) {
      return !candidate.hidden;
    });
    shell.classList.toggle('is-menu-open', hasOpenMenu);
  }

  function closeDropdowns(except, restoreFocus) {
    var focusTarget = null;
    queryAll('.ui-dropdown__menu', body).forEach(function (menu) {
      if (menu === except) return;
      var root = closest(menu, '.ui-dropdown');
      var trigger = root ? query('[data-ui-dropdown-button]', root) : null;
      if (!menu.hidden && restoreFocus && trigger) focusTarget = trigger;
      menu.hidden = true;
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
      syncTableMenuShell(menu);
    });
    if (focusTarget) safeFocus(focusTarget);
  }

  function setDropdownOpen(trigger, open, focusPosition) {
    var menu = dropdownMenuFor(trigger);
    if (!menu) return;
    closeDropdowns(menu, false);
    menu.hidden = !open;
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    syncTableMenuShell(menu);

    if (open && focusPosition) {
      var items = focusableElements(menu);
      safeFocus(focusPosition === 'last' ? items[items.length - 1] : items[0]);
    }
  }

  function initDropdowns() {
    queryAll('[data-ui-dropdown-button]', body).forEach(function (trigger) {
      var menu = dropdownMenuFor(trigger);
      if (!menu) return;
      var open = trigger.getAttribute('aria-expanded') === 'true' && !menu.hidden;
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.hidden = !open;
    });
  }

  function handleDropdownKeydown(event) {
    var trigger = closest(event.target, '[data-ui-dropdown-button]');
    if (trigger && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      setDropdownOpen(trigger, true, event.key === 'ArrowUp' ? 'last' : 'first');
      return true;
    }

    var menu = closest(event.target, '.ui-dropdown__menu');
    if (!menu) return false;
    var items = focusableElements(menu);
    var index = items.indexOf(document.activeElement);

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      var direction = event.key === 'ArrowDown' ? 1 : -1;
      var next = (index + direction + items.length) % items.length;
      safeFocus(items[next]);
      return true;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      safeFocus(event.key === 'Home' ? items[0] : items[items.length - 1]);
      return true;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDropdowns(null, true);
      return true;
    }
    if (event.key === 'Tab') closeDropdowns(null, false);
    return false;
  }

  /* Tabs com navegacao por teclado. */
  function tabPanelFor(button) {
    var reference = (button.getAttribute('data-ui-tab-target') || '').replace(/^#/, '');
    return reference ? document.getElementById(reference) : null;
  }

  function activateTab(root, activeButton, moveFocus) {
    var buttons = queryAll('[data-ui-tab-target]', root);
    var panels = queryAll('.ui-tab-content', root);

    buttons.forEach(function (button) {
      var active = button === activeButton;
      var panel = tabPanelFor(button);
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
      button.setAttribute('tabindex', active ? '0' : '-1');
      if (panel) {
        ensureId(panel, 'playmenu-tab-panel');
        button.setAttribute('aria-controls', panel.id);
      }
    });

    panels.forEach(function (panel) {
      var active = panel === tabPanelFor(activeButton);
      panel.classList.toggle('is-active', active);
      panel.hidden = !active;
    });
    if (moveFocus) safeFocus(activeButton);
  }

  function initTabs() {
    queryAll('[data-ui-tabs]', body).forEach(function (root) {
      var buttons = queryAll('[data-ui-tab-target]', root);
      if (!buttons.length) return;
      var active = buttons.filter(function (button) {
        return button.classList.contains('is-active') || button.getAttribute('aria-selected') === 'true';
      })[0] || buttons[0];

      buttons.forEach(function (button, index) {
        ensureId(button, 'playmenu-tab');
        button.setAttribute('role', 'tab');
        var panel = tabPanelFor(button);
        if (panel) {
          panel.setAttribute('role', 'tabpanel');
          panel.setAttribute('aria-labelledby', button.id);
        }

        button.addEventListener('click', function (event) {
          event.preventDefault();
          activateTab(root, button, false);
        });
        button.addEventListener('keydown', function (event) {
          var targetIndex = null;
          if (event.key === 'ArrowRight') targetIndex = (index + 1) % buttons.length;
          else if (event.key === 'ArrowLeft') targetIndex = (index - 1 + buttons.length) % buttons.length;
          else if (event.key === 'Home') targetIndex = 0;
          else if (event.key === 'End') targetIndex = buttons.length - 1;
          if (targetIndex === null) return;
          event.preventDefault();
          activateTab(root, buttons[targetIndex], true);
        });
      });

      activateTab(root, active, false);
    });
  }

  /* Accordions exclusivos, como no componente oficial. */
  function accordionParts(item) {
    return {
      button: query('button', item),
      content: query('.ui-accordion__content', item)
    };
  }

  function setAccordionItem(item, open) {
    var parts = accordionParts(item);
    if (!parts.button || !parts.content) return;
    var contentId = ensureId(parts.content, 'playmenu-accordion-panel');
    parts.button.setAttribute('aria-controls', contentId);
    parts.button.setAttribute('aria-expanded', open ? 'true' : 'false');
    item.classList.toggle('is-open', open);
    parts.content.hidden = !open;
  }

  function initAccordions() {
    queryAll('[data-ui-accordion]', body).forEach(function (accordion) {
      var items = queryAll('.ui-accordion__item', accordion);
      var buttons = [];
      items.forEach(function (item) {
        var parts = accordionParts(item);
        if (!parts.button || !parts.content) return;
        buttons.push(parts.button);
        setAccordionItem(item, item.classList.contains('is-open'));

        parts.button.addEventListener('click', function () {
          var willOpen = !item.classList.contains('is-open');
          items.forEach(function (other) { setAccordionItem(other, false); });
          if (willOpen) setAccordionItem(item, true);
        });
      });

      buttons.forEach(function (button, index) {
        button.addEventListener('keydown', function (event) {
          var targetIndex = null;
          if (event.key === 'ArrowDown') targetIndex = (index + 1) % buttons.length;
          else if (event.key === 'ArrowUp') targetIndex = (index - 1 + buttons.length) % buttons.length;
          else if (event.key === 'Home') targetIndex = 0;
          else if (event.key === 'End') targetIndex = buttons.length - 1;
          if (targetIndex === null) return;
          event.preventDefault();
          safeFocus(buttons[targetIndex]);
        });
      });
    });
  }

  /* Uploads e rotulos de arquivo. */
  function fileLabelFor(input) {
    var reference = (input.getAttribute('data-ui-file-name') || '').trim();
    if (reference) {
      var referenced = resolveReference(reference, input);
      if (referenced && referenced !== input) return referenced;
    }

    var holder = closest(input, '.ui-upload-zone, .ui-upload-compact, [data-ui-file-field]');
    if (holder) {
      var nested = query('[data-ui-file-name]:not(input)', holder);
      if (nested) return nested;
    }
    return null;
  }

  function updateFileLabel(input, suppliedFiles) {
    if (!input || input.type !== 'file') return;
    var output = fileLabelFor(input);
    if (!output) return;

    if (!output.hasAttribute('data-ui-file-empty')) {
      output.setAttribute('data-ui-file-empty', (output.textContent || '').trim() || 'Nenhum arquivo selecionado');
    }

    var files = suppliedFiles || Array.prototype.slice.call(input.files || []);
    var names = Array.prototype.map.call(files, function (file) { return file.name; });
    var emptyText = output.getAttribute('data-ui-file-empty') || 'Nenhum arquivo selecionado';
    var label = names.length ? names.join(', ') : emptyText;
    output.textContent = label;
    output.title = names.length ? label : '';
    output.setAttribute('aria-live', 'polite');
  }

  function initFileInputs() {
    queryAll('input[type="file"][data-ui-file-input], [data-ui-file-input] input[type="file"]', body)
      .forEach(function (input) { updateFileLabel(input); });

    queryAll('[data-ui-dropzone]', body).forEach(function (zone) {
      ['dragenter', 'dragover'].forEach(function (eventName) {
        zone.addEventListener(eventName, function (event) {
          event.preventDefault();
          zone.classList.add('is-dragging');
        });
      });

      ['dragleave', 'drop'].forEach(function (eventName) {
        zone.addEventListener(eventName, function (event) {
          event.preventDefault();
          zone.classList.remove('is-dragging');
        });
      });

      zone.addEventListener('drop', function (event) {
        var input = query('input[type="file"][data-ui-file-input], input[type="file"]', zone);
        var files = event.dataTransfer && event.dataTransfer.files;
        if (!input || !files || !files.length) return;
        var assigned = false;
        var selectedFiles = input.multiple
          ? Array.prototype.slice.call(files)
          : [files[0]];
        try {
          var transfer = new DataTransfer();
          selectedFiles.forEach(function (file) { transfer.items.add(file); });
          input.files = transfer.files;
          assigned = true;
        } catch (error) {
          assigned = false;
        }
        updateFileLabel(input, selectedFiles);
        if (assigned) input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
  }

  /* Clipboard com fallback para contextos sem HTTPS. */
  function fallbackCopy(value) {
    var active = document.activeElement;
    var textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    body.appendChild(textarea);
    textarea.select();
    var copied = false;
    try { copied = document.execCommand('copy'); } catch (error) { copied = false; }
    body.removeChild(textarea);
    safeFocus(active);
    return copied;
  }

  function copyText(value) {
    var text = String(value || '');
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }).catch(function () {
        return fallbackCopy(text);
      });
    }
    return Promise.resolve(fallbackCopy(text));
  }

  function copyValueFor(button) {
    var source = (button.getAttribute('data-ui-copy') || '').trim();
    var target = source ? resolveReference(source, button) : null;
    if (!target) return source;
    if ('value' in target) return target.value;
    return target.textContent || '';
  }

  /* Overlays, modais e drawers acessiveis. */
  function resolveReference(reference, source) {
    var value = (reference || '').trim();
    if (!value && source) value = (source.getAttribute('aria-controls') || '').trim();
    if (!value && source) {
      var href = (source.getAttribute('href') || '').trim();
      if (href.charAt(0) === '#') value = href;
    }
    if (!value) return null;

    if (value.charAt(0) === '#') return document.getElementById(value.slice(1));
    var byId = document.getElementById(value);
    if (byId) return byId;
    try { return document.querySelector(value); } catch (error) { return null; }
  }

  function overlayState(overlay) {
    var state = overlayStates.get(overlay);
    if (!state) {
      state = { active: false, opener: null, panel: null, addedTabindex: false, focusFrame: 0 };
      overlayStates.set(overlay, state);
    }
    return state;
  }

  function overlayPanel(overlay) {
    if (!overlay) return null;
    if (overlay.matches('[role="dialog"], [role="alertdialog"], .ui-modal, .ui-drawer')) return overlay;
    return query('[role="dialog"], [role="alertdialog"], .ui-modal, .ui-drawer', overlay) || overlay;
  }

  function overlayIsVisible(overlay) {
    if (!overlay || overlay.hidden) return false;
    var style = window.getComputedStyle(overlay);
    return style.display !== 'none' && style.visibility !== 'hidden' && overlay.getClientRects().length > 0;
  }

  function pushActiveOverlay(overlay) {
    var index = activeOverlays.indexOf(overlay);
    if (index !== -1) activeOverlays.splice(index, 1);
    activeOverlays.push(overlay);
  }

  function removeActiveOverlay(overlay) {
    var index = activeOverlays.indexOf(overlay);
    if (index !== -1) activeOverlays.splice(index, 1);
  }

  function activateOverlay(overlay, opener, focusPanel) {
    if (!overlay) return;
    var state = overlayState(overlay);
    var panel = overlayPanel(overlay);
    state.panel = panel;

    if (opener && !overlay.contains(opener)) state.opener = opener;
    if (!state.opener && document.activeElement && !overlay.contains(document.activeElement)) {
      state.opener = document.activeElement;
    }

    if (!panel.hasAttribute('role')) panel.setAttribute('role', 'dialog');
    if (!panel.hasAttribute('aria-modal')) panel.setAttribute('aria-modal', 'true');
    if (!panel.hasAttribute('tabindex')) {
      panel.setAttribute('tabindex', '-1');
      state.addedTabindex = true;
    }

    overlay.setAttribute('aria-hidden', 'false');
    state.active = true;
    pushActiveOverlay(overlay);
    body.classList.add('ui-overlay-open');
    syncBodyScrollLock();

    if (focusPanel === false) return;
    if (state.focusFrame) window.cancelAnimationFrame(state.focusFrame);
    state.focusFrame = window.requestAnimationFrame(function () {
      state.focusFrame = 0;
      if (!state.active || !overlayIsVisible(overlay)) return;
      var autofocus = query('[autofocus]', overlay);
      var controls = focusableElements(overlay);
      safeFocus(autofocus || controls[0] || panel);
    });
  }

  function deactivateOverlay(overlay, restoreFocus) {
    if (!overlay) return;
    var state = overlayState(overlay);
    if (state.focusFrame) window.cancelAnimationFrame(state.focusFrame);
    state.focusFrame = 0;
    state.active = false;
    removeActiveOverlay(overlay);
    overlay.setAttribute('aria-hidden', 'true');

    if (state.addedTabindex && state.panel) state.panel.removeAttribute('tabindex');
    state.addedTabindex = false;
    if (!activeOverlays.length) body.classList.remove('ui-overlay-open');
    syncBodyScrollLock();

    if (state.opener) {
      state.opener.setAttribute('aria-expanded', 'false');
      if (restoreFocus !== false && document.documentElement.contains(state.opener)) safeFocus(state.opener);
    }
    state.opener = null;
  }

  function openOverlay(reference, opener) {
    var overlay = typeof reference === 'string' ? resolveReference(reference, opener) : reference;
    if (!overlay) return;
    if (isSidebarOpen()) closeSidebar(false);
    overlay.hidden = false;
    if (overlay.style.display === 'none') overlay.style.removeProperty('display');
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    if (opener) {
      if (overlay.id) opener.setAttribute('aria-controls', overlay.id);
      opener.setAttribute('aria-expanded', 'true');
    }
    activateOverlay(overlay, opener, true);
  }

  function closeOverlay(overlay, restoreFocus) {
    if (!overlay) return;
    var state = overlayState(overlay);
    overlay.classList.remove('is-open');
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
    if (state.opener) state.opener.setAttribute('aria-expanded', 'false');
    deactivateOverlay(overlay, restoreFocus !== false);
  }

  function prepareOverlay(overlay) {
    if (!overlay || !overlay.matches(OVERLAY_SELECTOR)) return;
    ensureId(overlay, 'playmenu-overlay');
    var panel = overlayPanel(overlay);
    if (!panel.hasAttribute('role')) panel.setAttribute('role', 'dialog');
    if (!panel.hasAttribute('aria-modal')) panel.setAttribute('aria-modal', 'true');
    if (overlayIsVisible(overlay)) activateOverlay(overlay, null, true);
    else overlay.setAttribute('aria-hidden', 'true');
  }

  function scanOverlay(overlay) {
    if (!overlay || !overlay.matches(OVERLAY_SELECTOR)) return;
    var state = overlayState(overlay);
    var visible = overlayIsVisible(overlay);
    if (visible && !state.active) activateOverlay(overlay, null, true);
    else if (!visible && state.active) deactivateOverlay(overlay, true);
  }

  function trapOverlayFocus(event, overlay) {
    if (event.key !== 'Tab' || !overlay) return;
    var controls = focusableElements(overlay);
    var panel = overlayPanel(overlay);
    if (!controls.length) {
      event.preventDefault();
      safeFocus(panel);
      return;
    }

    var first = controls[0];
    var last = controls[controls.length - 1];
    var current = document.activeElement;
    if (!overlay.contains(current)) {
      event.preventDefault();
      safeFocus(event.shiftKey ? last : first);
    } else if (event.shiftKey && current === first) {
      event.preventDefault();
      safeFocus(last);
    } else if (!event.shiftKey && current === last) {
      event.preventDefault();
      safeFocus(first);
    }
  }

  function initOverlays() {
    queryAll(OVERLAY_SELECTOR, body).forEach(prepareOverlay);
    if (typeof MutationObserver !== 'function') return;

    overlayObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.type === 'attributes') {
          scanOverlay(mutation.target);
          return;
        }
        Array.prototype.forEach.call(mutation.addedNodes, function (node) {
          if (!node || node.nodeType !== 1) return;
          if (node.matches(OVERLAY_SELECTOR)) prepareOverlay(node);
          queryAll(OVERLAY_SELECTOR, node).forEach(prepareOverlay);
        });
      });
    });

    overlayObserver.observe(body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'open', 'aria-hidden']
    });
  }

  /* Popovers nao modais. */
  function popoverPanelFor(button) {
    var root = closest(button, '.ui-popover');
    return root ? query('.ui-popover__panel', root) : null;
  }

  function closePopovers(except, restoreFocus) {
    var focusTarget = null;
    queryAll('.ui-popover__panel', body).forEach(function (panel) {
      if (panel === except) return;
      var root = closest(panel, '.ui-popover');
      var trigger = root ? query('[data-ui-popover-button]', root) : null;
      if (!panel.hidden && restoreFocus && trigger) focusTarget = trigger;
      panel.hidden = true;
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
    if (focusTarget) safeFocus(focusTarget);
  }

  function initPopovers() {
    queryAll('[data-ui-popover-button]', body).forEach(function (button) {
      var panel = popoverPanelFor(button);
      if (!panel) return;
      button.setAttribute('aria-expanded', panel.hidden ? 'false' : 'true');
      ensureId(panel, 'playmenu-popover');
      button.setAttribute('aria-controls', panel.id);
    });
  }

  /* Controles de selecao simples do kit, sem feedback ficticio. */
  function initChoiceControls() {
    queryAll('[data-ui-group-button]', body).forEach(function (button) {
      button.addEventListener('click', function () {
        queryAll('[data-ui-group-button]', button.parentElement).forEach(function (item) {
          var active = item === button;
          item.classList.toggle('is-active', active);
          item.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
      });
    });

    queryAll('[data-ui-pill]', body).forEach(function (pill) {
      pill.addEventListener('click', function () {
        queryAll('[data-ui-pill]', pill.parentElement).forEach(function (item) {
          var active = item === pill;
          item.classList.toggle('is-active', active);
          item.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
      });
    });

    queryAll('[data-ui-select-card]', body).forEach(function (card) {
      card.setAttribute('aria-pressed', card.classList.contains('is-selected') ? 'true' : 'false');
      card.addEventListener('click', function () {
        var selected = card.classList.toggle('is-selected');
        card.setAttribute('aria-pressed', selected ? 'true' : 'false');
      });
    });
  }

  function initAnchorNavigation() {
    var navigation = query('.ui-anchor-nav', body);
    if (!navigation) return;
    queryAll('a[href^="#"]', navigation).forEach(function (link) {
      link.addEventListener('click', function (event) {
        var target = resolveReference(link.getAttribute('href'), link);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
        if (history.replaceState) history.replaceState(null, '', link.getAttribute('href'));
      });
    });
  }

  function isSubmitControl(element) {
    if (!element) return false;
    if (element.tagName === 'BUTTON') return (element.getAttribute('type') || 'submit').toLowerCase() === 'submit' && Boolean(element.form);
    return element.tagName === 'INPUT' && /^(submit|image)$/i.test(element.type || '');
  }

  function handleDocumentClick(event) {
    var target = event.target;
    if (!target || target.nodeType !== 1) return;

    var sidebarToggle = closest(target, '[data-ui-sidebar-toggle], .hamburger');
    if (sidebarToggle && body.contains(sidebarToggle)) {
      event.preventDefault();
      toggleSidebar(sidebarToggle);
      return;
    }

    if (sidebarOverlay && (target === sidebarOverlay || closest(target, '[data-ui-sidebar-overlay], .sidebar-overlay') === sidebarOverlay)) {
      event.preventDefault();
      closeSidebar(true);
      return;
    }

    var overlayOpenTrigger = closest(target, '[data-ui-open-overlay]');
    if (overlayOpenTrigger) {
      var overlayToOpen = resolveReference(overlayOpenTrigger.getAttribute('data-ui-open-overlay'), overlayOpenTrigger);
      if (overlayToOpen) {
        event.preventDefault();
        openOverlay(overlayToOpen, overlayOpenTrigger);
      }
      return;
    }

    var overlayCloseTrigger = closest(target, '[data-ui-close-overlay]');
    if (overlayCloseTrigger && !isSubmitControl(overlayCloseTrigger)) {
      var closeReference = overlayCloseTrigger.getAttribute('data-ui-close-overlay');
      var overlayToClose = closeReference
        ? resolveReference(closeReference, overlayCloseTrigger)
        : closest(overlayCloseTrigger, OVERLAY_SELECTOR);
      if (overlayToClose) {
        event.preventDefault();
        closeOverlay(overlayToClose, true);
      }
      return;
    }

    var clickedOverlay = closest(target, OVERLAY_SELECTOR);
    if (clickedOverlay && target === clickedOverlay && clickedOverlay.getAttribute('data-ui-overlay-backdrop-close') !== 'false') {
      event.preventDefault();
      closeOverlay(clickedOverlay, true);
      return;
    }

    var dropdownTrigger = closest(target, '[data-ui-dropdown-button]');
    if (dropdownTrigger) {
      event.preventDefault();
      var menu = dropdownMenuFor(dropdownTrigger);
      setDropdownOpen(dropdownTrigger, Boolean(menu && menu.hidden), event.detail === 0 ? 'first' : null);
      return;
    }

    var copyButton = closest(target, '[data-ui-copy]');
    if (copyButton) {
      event.preventDefault();
      copyText(copyValueFor(copyButton)).then(function (copied) {
        showToast(
          copied ? (copyButton.getAttribute('data-ui-copy-success') || 'Conteúdo copiado.') : 'Não foi possível copiar.',
          copied ? 'success' : 'danger'
        );
      });
      return;
    }

    var dismissButton = closest(target, '[data-ui-dismiss]');
    if (dismissButton) {
      event.preventDefault();
      var dismissReference = dismissButton.getAttribute('data-ui-dismiss');
      var dismissTarget = dismissReference
        ? resolveReference(dismissReference, dismissButton)
        : closest(dismissButton, '.ui-alert, .ui-tag');
      if (dismissTarget) {
        dismissTarget.style.opacity = '0';
        dismissTarget.style.transform = 'translateY(-5px)';
        window.setTimeout(function () { dismissTarget.remove(); }, transitionDelay(220));
      }
      return;
    }

    var popoverButton = closest(target, '[data-ui-popover-button]');
    if (popoverButton) {
      event.preventDefault();
      var panel = popoverPanelFor(popoverButton);
      if (panel) {
        var willOpen = panel.hidden;
        closePopovers(panel, false);
        panel.hidden = !willOpen;
        popoverButton.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      }
      return;
    }

    var toastButton = closest(target, '[data-ui-toast]');
    if (toastButton) {
      showToast(
        toastButton.getAttribute('data-ui-toast'),
        toastButton.getAttribute('data-ui-toast-type') || 'info',
        toastButton.getAttribute('data-ui-toast-duration')
      );
    }

    if (closest(target, '.ui-dropdown__menu')) closeDropdowns(null, false);
    else if (!closest(target, '.ui-dropdown')) closeDropdowns(null, false);
    if (!closest(target, '.ui-popover')) closePopovers(null, false);

    if (sidebar && isMobileViewport() && sidebar.contains(target) && closest(target, 'a[href]')) {
      closeSidebar(false);
    }
  }

  function handleDocumentChange(event) {
    var input = event.target;
    if (!input || input.nodeType !== 1) return;
    if (input.matches('input[type="file"][data-ui-file-input], [data-ui-file-input] input[type="file"]')) {
      updateFileLabel(input);
    }
  }

  function handleDocumentKeydown(event) {
    var overlay = topOverlay();
    if (event.key === 'Tab' && overlay) {
      trapOverlayFocus(event, overlay);
      return;
    }
    if (event.key === 'Escape' && overlay && overlay.getAttribute('data-ui-escape-close') !== 'false') {
      event.preventDefault();
      closeOverlay(overlay, true);
      return;
    }

    if (handleDropdownKeydown(event)) return;
    if (event.key === 'Escape' && query('.ui-dropdown__menu:not([hidden])', body)) {
      event.preventDefault();
      closeDropdowns(null, true);
      return;
    }
    if (event.key === 'Escape' && query('.ui-popover__panel:not([hidden])', body)) {
      event.preventDefault();
      closePopovers(null, true);
      return;
    }

    if (event.key === 'Tab' && isSidebarOpen()) {
      trapSidebarFocus(event);
      return;
    }
    if (event.key === 'Escape' && isSidebarOpen()) {
      event.preventDefault();
      closeSidebar(true);
    }
  }

  function aplicarMicroZoom() {
      const elemento = document.documentElement;
      const zoomOriginal = elemento.style.zoom;

      // Aumenta exatamente 0,01%
      elemento.style.zoom = "100.01%";

      // Aguarda dois frames para o navegador renderizar a alteração
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          elemento.style.zoom = zoomOriginal;
        });
      });
    }

    // Executa assim que toda a página terminar de carregar
    if (document.readyState === "complete") {
      aplicarMicroZoom();
    } else {
      window.addEventListener("load", aplicarMicroZoom, { once: true });
    }

  function init() {
    body = document.querySelector(BODY_SELECTOR);
    if (!body) return;

    reducedMotionMedia = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    initSidebar();
    initDropdowns();
    initTabs();
    initAccordions();
    initFileInputs();
    initOverlays();
    initPopovers();
    initChoiceControls();
    initAnchorNavigation();
    ensureToastStack();

    document.addEventListener('click', handleDocumentClick, false);
    document.addEventListener('change', handleDocumentChange, false);
    document.addEventListener('keydown', handleDocumentKeydown, true);

    var api = window.PlayMenuUI || {};
    api.showToast = showToast;
    api.copyText = copyText;
    api.updateFileLabel = updateFileLabel;
    api.openSidebar = openSidebar;
    api.closeSidebar = closeSidebar;
    api.openOverlay = openOverlay;
    api.closeOverlay = closeOverlay;
    api.prefersReducedMotion = prefersReducedMotion;
    window.PlayMenuUI = api;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();


