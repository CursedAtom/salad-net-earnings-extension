// popup.js
const machines = ['5f64831f', '9b7ac367', 'b35de0a9', 'c7b32046', 'e80b5484'];

document.addEventListener('DOMContentLoaded', async () => {
  const data = await chrome.storage.sync.get(['cost_kwh', 'wattages', 'names']);
  document.getElementById('cost_kwh').value = data.cost_kwh || 0.10;
  const wattages = data.wattages || {};
  const names = data.names || {};
  const div = document.getElementById('machines');
  machines.forEach(id => {
    const container = document.createElement('div');
    container.className = 'machine';
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Name: ';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = names[id] || id;
    nameLabel.appendChild(nameInput);
    const wattLabel = document.createElement('label');
    wattLabel.textContent = 'Wattage: ';
    const wattInput = document.createElement('input');
    wattInput.type = 'number';
    wattInput.value = wattages[id] || 250;
    wattLabel.appendChild(wattInput);
    container.appendChild(nameLabel);
    container.appendChild(wattLabel);
    div.appendChild(container);
  });
  document.getElementById('save').addEventListener('click', () => {
    const cost_kwh = parseFloat(document.getElementById('cost_kwh').value);
    const wattages = {};
    const names = {};
    div.querySelectorAll('.machine').forEach((cont, i) => {
      const nameIn = cont.querySelector('input[type="text"]');
      const wattIn = cont.querySelector('input[type="number"]');
      names[machines[i]] = nameIn.value.trim() || machines[i];
      wattages[machines[i]] = parseFloat(wattIn.value);
    });
    chrome.storage.sync.set({ cost_kwh, wattages, names });
    window.close();
  });
});