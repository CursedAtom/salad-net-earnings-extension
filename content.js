// content.js
let legendObserver = null;
let tooltipObserver = null;

const machines = ['5f64831f', '9b7ac367', 'b35de0a9', 'c7b32046', 'e80b5484'];

function debounce(func, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

function isAppropriateView() {
  const selectors = document.querySelector('.c0155');
  if (!selectors) return false;
  const viewRangeDiv = Array.from(selectors.children).find(div => div.querySelector('p')?.textContent === 'View Range');
  const activeRange = viewRangeDiv?.querySelector('.c0158')?.textContent;
  const viewDataDiv = Array.from(selectors.children).find(div => div.querySelector('p')?.textContent === 'View Data as');
  const activeData = viewDataDiv?.querySelector('.c0158')?.textContent;
  return activeRange === '24 Hours' && activeData === 'Individual';
}

function shiftPathY(d, delta) {
  return d.replace(/([MCQLZ])?([\d.-]+),([\d.-]+)/g, (match, cmd, x, y) => {
    if (y === undefined) return match;
    const newY = parseFloat(y) + delta;
    return (cmd || '') + x + ',' + newY;
  });
}

async function addNetLines() {
  if (!isAppropriateView()) return;

  const { cost_kwh, wattages } = await chrome.storage.sync.get(['cost_kwh', 'wattages']);
  if (!cost_kwh || !wattages) return;

  const svg = document.querySelector('.recharts-surface');
  if (!svg) return;

  // Remove existing net lines
  svg.querySelectorAll('path[name^="net_"]').forEach(p => p.closest('g.recharts-line')?.remove());

  const scale = 2580; // $0.1 over 258px, so px per $
  const lines = Array.from(svg.querySelectorAll('g.recharts-line')).filter(g => {
    const name = g.querySelector('path')?.getAttribute('name');
    return name && !name.startsWith('net_');
  });

  lines.forEach(line => {
    const name = line.querySelector('path').getAttribute('name');
    if (!machines.includes(name) || !wattages[name]) return;

    const dots = line.querySelectorAll('circle');
    const allZero = Array.from(dots).every(dot => parseFloat(dot.getAttribute('cy')) === 288);
    if (allZero) return;

    const cost_per_hour = (wattages[name] / 1000) * cost_kwh;
    const delta_y = cost_per_hour * scale;

    const netLine = line.cloneNode(true);
    const netPath = netLine.querySelector('path');
    netPath.setAttribute('stroke-dasharray', '5 5');
    netPath.setAttribute('name', `net_${name}`);
    const newD = shiftPathY(netPath.getAttribute('d'), delta_y);
    netPath.setAttribute('d', newD);

    netLine.querySelectorAll('circle').forEach(circle => {
      let cy = parseFloat(circle.getAttribute('cy')) + delta_y;
      if (cy > 288) cy = 288;
      circle.setAttribute('cy', cy);
    });

    line.after(netLine);
  });
}

async function renameMachines() {
  const { names } = await chrome.storage.sync.get('names');
  if (!names) return;

  // Rename in legend
  document.querySelectorAll('.c0181 span').forEach(span => {
    const text = span.textContent.trim();
    if (machines.includes(text) && names[text]) {
      span.textContent = names[text];
    }
  });

  // Rename in machines table (assuming first column is ID)
  document.querySelectorAll('table td:first-child').forEach(td => {
    const text = td.textContent.trim();
    if (machines.includes(text) && names[text]) {
      td.textContent = names[text];
    }
  });

  // Rename in tooltip (but handled in observeTooltip)

  // To replace all occurrences, search text nodes
  const walker = document.createTreeWalker(document.body, Node.TEXT_NODE);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.parentNode && !['SCRIPT', 'STYLE', 'SVG'].includes(node.parentNode.tagName)) {
      let text = node.textContent;
      machines.forEach(id => {
        if (names[id]) {
          const regex = new RegExp(`\\b${id}\\b`, 'g');
          text = text.replace(regex, names[id]);
        }
      });
      if (text !== node.textContent) {
        node.textContent = text;
      }
    }
  }
}

function syncVisibility() {
  const legendItems = document.querySelectorAll('.c0181');
  legendItems.forEach((item, i) => {
    const machineName = machines[i];
    const checkbox = item.querySelector('.c0183');
    if (!checkbox) return;
    const isChecked = checkbox.classList.contains('c0187');
    const netGroup = document.querySelector(`g.recharts-line path[name="net_${machineName}"]`)?.parentNode;
    if (netGroup) {
      netGroup.style.display = isChecked ? 'block' : 'none';
    }
  });
}

function observeLegend() {
  const legend = document.querySelector('.c0179');
  if (!legend) return;

  if (legendObserver) legendObserver.disconnect();
  legendObserver = new MutationObserver(debounce(syncVisibility, 100));
  legendObserver.observe(legend, { childList: true, subtree: true, attributes: true });
  syncVisibility();
}

function observeTooltip() {
  const tooltipWrapper = document.querySelector('.recharts-tooltip-wrapper');
  if (!tooltipWrapper) return;

  if (tooltipObserver) tooltipObserver.disconnect();
  tooltipObserver = new MutationObserver(debounce(async (mutations) => {
    if (tooltipWrapper.style.visibility === 'hidden' || !isAppropriateView()) return;

    const { cost_kwh, wattages, names } = await chrome.storage.sync.get(['cost_kwh', 'wattages', 'names']);
    if (!cost_kwh || !wattages) return;

    const inner = tooltipWrapper.querySelector('.recharts-default-tooltip');
    if (!inner) return;

    let ul = inner.querySelector('.recharts-tooltip-item-list');
    if (!ul) return;

    // Disconnect to prevent loop
    tooltipObserver.disconnect();

    // Remove previous net items
    Array.from(ul.querySelectorAll('.net-item')).forEach(el => el.remove());

    const items = Array.from(ul.querySelectorAll('.recharts-tooltip-item:not(.net-item)'));
    items.forEach(item => {
      const nameSpan = item.querySelector('.recharts-tooltip-item-name');
      if (!nameSpan) return;
      let name = nameSpan.textContent.trim();
      let originalName = name;
      if (names) {
        // Find if name is a custom name, map back to ID
        const id = Object.keys(names).find(key => names[key] === name);
        if (id) {
          originalName = id;
        }
      }
      if (machines.includes(originalName) && names && names[originalName] && name === originalName) {
        nameSpan.textContent = names[originalName];
        name = names[originalName];
      } else if (!machines.includes(originalName)) {
        return;
      }

      const valueSpan = item.querySelector('.recharts-tooltip-item-value');
      if (!valueSpan) return;
      const grossStr = valueSpan.textContent.replace('$', '').trim();
      const grossValue = parseFloat(grossStr);
      if (isNaN(grossValue) || grossValue === 0) return;

      const cost_per_hour = (wattages[originalName] / 1000) * cost_kwh;
      const netValue = grossValue - cost_per_hour;

      const li = document.createElement('li');
      li.className = 'recharts-tooltip-item net-item';
      li.style.color = item.style.color;
      li.innerHTML = `<span class="recharts-tooltip-item-name">Net ${name}</span><span class="recharts-tooltip-item-separator"> : </span><span class="recharts-tooltip-item-value">$${netValue.toFixed(4)}</span><span class="recharts-tooltip-item-unit"></span>`;
      item.after(li);
    });

    // Reconnect
    tooltipObserver.observe(tooltipWrapper, { attributes: true, childList: true, subtree: true });
  }, 50));

  tooltipObserver.observe(tooltipWrapper, { attributes: true, childList: true, subtree: true });
}

const mainObserver = new MutationObserver(debounce(async () => {
  if (document.querySelector('.recharts-surface')) {
    await addNetLines();
    await renameMachines();
    observeLegend();
    observeTooltip();
  }
}, 200));

mainObserver.observe(document.body, { childList: true, subtree: true });