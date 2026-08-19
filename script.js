const form = document.querySelector("#estimateForm");
const gatesEl = document.querySelector("#gates");
const bomRows = document.querySelector("#bomRows");
const canvas = document.querySelector("#fenceCanvas");
const ctx = canvas.getContext("2d");

const PRICES = [
  {
    id: "picket",
    name: "5/8 in. x 5-1/2 in. x 6 ft cedar dog-ear picket",
    unit: "each",
    price: 4.18,
    source: "Home Depot",
    url: "https://www.homedepot.com/b/Lumber-Composites-Fencing-Gates-Wood-Fencing-Wood-Fence-Pickets/Alta-Forest-Products/Cedar/Dog-Eared/N-5yc1vZc3moZel2Z1z19wkoZ1z1v1zz"
  },
  {
    id: "post",
    name: "4x4x8 ground-contact pressure-treated post",
    unit: "each",
    price: 16.37,
    source: "Retail benchmark",
    url: "https://www.boltmaxx.com/product/4-in-x-4-in-x-8-ft-ground-contact-pressure-treated-post/"
  },
  {
    id: "rail",
    name: "2x4x8 kiln-dried rail lumber",
    unit: "each",
    price: 6.75,
    source: "2026 retail range midpoint",
    url: "https://constructmath.com/fence-calculator"
  },
  {
    id: "bracket",
    name: "Simpson Strong-Tie FB24Z 2x4 fence rail bracket",
    unit: "each",
    price: 0.98,
    source: "Home Depot",
    url: "https://www.homedepot.com/p/100375311"
  },
  {
    id: "concrete",
    name: "60 lb fast-setting concrete mix",
    unit: "bag",
    price: 6.98,
    source: "2026 retail range midpoint",
    url: "https://constructmath.com/fence-calculator"
  },
  {
    id: "staples",
    name: "Hot-dipped galvanized collated fence staples",
    unit: "box",
    price: 48.00,
    source: "Estimator allowance",
    url: "https://www.homedepot.com/p/318183027"
  },
  {
    id: "screws",
    name: "Exterior connector screws or galvanized nails",
    unit: "box",
    price: 18.00,
    source: "Estimator allowance",
    url: "https://www.capitallumber.co/products/fencing"
  },
  {
    id: "gateHardware",
    name: "Typical gate hinge and latch set",
    unit: "set",
    price: 26.37,
    source: "Home Depot",
    url: "https://www.homedepot.com/p/327599432"
  },
  {
    id: "antiSag",
    name: "Anti-sag gate brace kit",
    unit: "kit",
    price: 11.47,
    source: "Home Depot benchmark",
    url: "https://www.gardenista.com/brand/everbilt/"
  }
];

const savedPrices = JSON.parse(localStorage.getItem("woodFencePrices") || "{}");
const state = {
  gates: [{ width: 42 }],
  prices: Object.fromEntries(PRICES.map((item) => [item.id, savedPrices[item.id] ?? item.price]))
};

function money(value) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function number(value) {
  return Number.isFinite(value) ? value : 0;
}

function readInputs() {
  return {
    lengthFt: Math.max(0, number(Number(document.querySelector("#lengthFt").value))),
    heightFt: Number(document.querySelector("#heightFt").value),
    spacingFt: Math.min(8, Math.max(4, number(Number(document.querySelector("#postSpacingFt").value)))),
    wastePct: Math.max(0, number(Number(document.querySelector("#wastePct").value))),
    gates: state.gates.map((gate) => ({ width: Math.max(0, number(Number(gate.width))) }))
  };
}

function calculate() {
  const input = readInputs();
  const gateOpeningsFt = input.gates.reduce((sum, gate) => sum + gate.width / 12, 0);
  const boardFenceFt = Math.max(0, input.lengthFt - gateOpeningsFt);
  const railRows = input.heightFt >= 6 ? 3 : 2;
  const fenceBays = Math.max(1, Math.ceil(boardFenceFt / input.spacingFt));
  const fencePosts = boardFenceFt > 0 ? fenceBays + 1 : 0;
  const gatePosts = input.gates.length * 2;
  const posts = fencePosts + gatePosts;
  const fencePickets = Math.ceil((boardFenceFt * 12) / 5.5);
  const gatePickets = input.gates.reduce((sum, gate) => sum + Math.ceil(gate.width / 5.5), 0);
  const pickets = Math.ceil((fencePickets + gatePickets) * (1 + input.wastePct / 100));
  const fenceRailPieces = Math.ceil((boardFenceFt * railRows) / 8);
  const gateRailPieces = input.gates.length * 3;
  const rails = fenceRailPieces + gateRailPieces;
  const brackets = fenceBays * railRows * 2;
  const concrete = posts * 2;
  const stapleCount = Math.ceil((fencePickets + gatePickets) * railRows * 2 * 1.1);
  const stapleBoxes = Math.max(1, Math.ceil(stapleCount / 1000));
  const screwBoxes = Math.max(1, Math.ceil((brackets * 6 + input.gates.length * 40) / 350));

  return {
    input,
    boardFenceFt,
    railRows,
    fenceBays,
    posts,
    pickets,
    rails,
    brackets,
    concrete,
    stapleBoxes,
    screwBoxes,
    gateHardware: input.gates.length,
    antiSag: input.gates.length
  };
}

function lineItems(takeoff) {
  const quantities = {
    picket: takeoff.pickets,
    post: takeoff.posts,
    rail: takeoff.rails,
    bracket: takeoff.brackets,
    concrete: takeoff.concrete,
    staples: takeoff.stapleBoxes,
    screws: takeoff.screwBoxes,
    gateHardware: takeoff.gateHardware,
    antiSag: takeoff.antiSag
  };

  return PRICES.map((item) => ({
    ...item,
    qty: quantities[item.id] || 0,
    price: state.prices[item.id]
  })).filter((item) => item.qty > 0);
}

function renderGates() {
  gatesEl.innerHTML = "";
  state.gates.forEach((gate, index) => {
    const row = document.createElement("div");
    row.className = "gate-row";
    row.innerHTML = `
      <span>Gate ${index + 1}</span>
      <input type="number" min="1" step="1" value="${gate.width}" aria-label="Gate ${index + 1} width in inches">
      <span>in.</span>
      <button type="button" class="remove-gate" title="Remove gate">x</button>
    `;
    row.querySelector("input").addEventListener("input", (event) => {
      state.gates[index].width = Number(event.target.value);
      render();
    });
    row.querySelector("button").addEventListener("click", () => {
      state.gates.splice(index, 1);
      render();
    });
    gatesEl.appendChild(row);
  });
}

function renderBom(takeoff) {
  let grandTotal = 0;
  bomRows.innerHTML = "";
  lineItems(takeoff).forEach((item) => {
    const lineTotal = item.qty * item.price;
    grandTotal += lineTotal;
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.qty}</td>
      <td>${item.unit}</td>
      <td class="price-cell"><input type="number" min="0" step="0.01" value="${item.price.toFixed(2)}" aria-label="${item.name} unit price"></td>
      <td class="source-cell"><a href="${item.url}" target="_blank" rel="noreferrer">${item.source}</a></td>
      <td>${money(lineTotal)}</td>
    `;
    row.querySelector("input").addEventListener("input", (event) => {
      state.prices[item.id] = Math.max(0, number(Number(event.target.value)));
      localStorage.setItem("woodFencePrices", JSON.stringify(state.prices));
      render();
    });
    bomRows.appendChild(row);
  });
  document.querySelector("#grandTotal").textContent = money(grandTotal);
}

function renderWarnings(takeoff) {
  const warnings = [];
  takeoff.input.gates.forEach((gate, index) => {
    if (gate.width > 45) {
      warnings.push(`Gate ${index + 1} is ${gate.width} in. wide. Standard wood gates should not exceed 45 in.; split this opening into double gates or revise the width.`);
    }
  });
  if (takeoff.input.lengthFt <= 0) {
    warnings.push("Enter a fence length greater than zero to produce a material takeoff.");
  }
  if (takeoff.boardFenceFt === 0 && takeoff.input.gates.length > 0) {
    warnings.push("Gate openings equal or exceed the fence length. Check whether total fence length includes gate openings.");
  }

  const warningsEl = document.querySelector("#warnings");
  warningsEl.innerHTML = warnings.map((warning) => `<div class="warning">${warning}</div>`).join("");
}

function drawFence(takeoff) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f7efe0";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const x0 = 46;
  const yGround = 198;
  const width = canvas.width - 92;
  const height = takeoff.input.heightFt * 22;
  const top = yGround - height;

  ctx.strokeStyle = "#d3b895";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(28, yGround);
  ctx.lineTo(canvas.width - 28, yGround);
  ctx.stroke();

  const postsToDraw = Math.min(18, Math.max(2, takeoff.fenceBays + 1));
  const postGap = width / (postsToDraw - 1);

  ctx.fillStyle = "#70452e";
  for (let i = 0; i < postsToDraw; i += 1) {
    const x = x0 + i * postGap;
    ctx.fillRect(x - 5, top - 12, 10, height + 30);
  }

  ctx.fillStyle = "#a95f34";
  const picketsToDraw = 44;
  const picketGap = width / picketsToDraw;
  for (let i = 0; i < picketsToDraw; i += 1) {
    const x = x0 + i * picketGap + 2;
    ctx.fillRect(x, top, Math.max(5, picketGap - 3), height);
  }

  ctx.fillStyle = "#6d3d26";
  for (let row = 0; row < takeoff.railRows; row += 1) {
    const y = top + 24 + row * ((height - 42) / Math.max(1, takeoff.railRows - 1));
    ctx.fillRect(x0, y, width, 8);
  }

  takeoff.input.gates.forEach((gate, index) => {
    const gateWidth = Math.min(86, Math.max(42, gate.width * 1.4));
    const x = x0 + width - gateWidth - index * 96;
    ctx.fillStyle = gate.width > 45 ? "#a7422b" : "#3f5962";
    ctx.fillRect(x, top - 8, gateWidth, height + 12);
    ctx.fillStyle = "#fffaf1";
    ctx.fillRect(x + 5, top - 2, gateWidth - 10, height);
    ctx.strokeStyle = "#3f5962";
    ctx.lineWidth = 4;
    ctx.strokeRect(x + 7, top + 6, gateWidth - 14, height - 14);
    ctx.beginPath();
    ctx.moveTo(x + 10, yGround - 12);
    ctx.lineTo(x + gateWidth - 12, top + 10);
    ctx.stroke();
  });

  ctx.fillStyle = "#22231f";
  ctx.font = "700 16px Arial";
  ctx.fillText(`${takeoff.input.lengthFt} ft line | ${takeoff.input.heightFt} ft high | ${takeoff.input.gates.length} gate(s)`, 46, 232);
}

function render() {
  const takeoff = calculate();
  document.querySelector("#summaryPickets").textContent = takeoff.pickets;
  document.querySelector("#summaryPosts").textContent = takeoff.posts;
  document.querySelector("#summaryRails").textContent = takeoff.rails;
  document.querySelector("#summaryBrackets").textContent = takeoff.brackets;
  renderBom(takeoff);
  renderWarnings(takeoff);
  drawFence(takeoff);
}

document.querySelector("#addGate").addEventListener("click", () => {
  state.gates.push({ width: 42 });
  renderGates();
  render();
});

document.querySelector("#resetButton").addEventListener("click", () => {
  document.querySelector("#lengthFt").value = 120;
  document.querySelector("#heightFt").value = 6;
  document.querySelector("#postSpacingFt").value = 8;
  document.querySelector("#wastePct").value = 5;
  state.gates = [{ width: 42 }];
  renderGates();
  render();
});

document.querySelector("#printButton").addEventListener("click", () => window.print());
form.addEventListener("input", render);

renderGates();
render();
