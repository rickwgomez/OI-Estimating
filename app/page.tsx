"use client";

import { useEffect, useMemo, useState } from "react";

type Gate = {
  type: "single" | "double";
  width: number;
  placement: "inline" | "end";
};

type PriceItem = {
  id: string;
  name: string;
  unit: string;
  price: number;
  source: string;
  url: string;
};

type DifficultyKey = "normal" | "hard" | "veryHard";

const laborRate = 95;
const crewProductionLfPerDay = 70;
const crewSize = 2;
const workDayHours = 8;
const difficultyOptions: Record<
  DifficultyKey,
  { label: string; factor: number }
> = {
  normal: { label: "Normal", factor: 1 },
  hard: { label: "Hard", factor: 1.25 },
  veryHard: { label: "Very Hard", factor: 1.5 },
};

const priceItems: PriceItem[] = [
  {
    id: "picket",
    name: "5/8 in. x 5-1/2 in. x 6 ft cedar dog-ear picket",
    unit: "each",
    price: 4.18,
    source: "Home Depot",
    url: "https://www.homedepot.com/b/Lumber-Composites-Fencing-Gates-Wood-Fencing-Wood-Fence-Pickets/Alta-Forest-Products/Cedar/Dog-Eared/N-5yc1vZc3moZel2Z1z19wkoZ1z1v1zz",
  },
  {
    id: "post",
    name: "4 in. x 4 in. x 8 ft. #2 ground-contact pressure-treated post",
    unit: "each",
    price: 10.18,
    source: "Home Depot",
    url: "https://www.homedepot.com/p/205220341",
  },
  {
    id: "rail",
    name: "2 in. x 4 in. x 96 in. #2 Premium Grade KD-HT rail lumber",
    unit: "each",
    price: 4.15,
    source: "Home Depot",
    url: "https://www.homedepot.com/b/Lumber-Composites-Dimensional-Lumber/2x4/8-ft/2-in/N-5yc1vZc3tcZ1z0ywxvZ1z1rkqlZ1z1soke",
  },
  {
    id: "bracket",
    name: "Simpson Strong-Tie FB24Z 2x4 fence rail bracket",
    unit: "each",
    price: 0.98,
    source: "Home Depot",
    url: "https://www.homedepot.com/p/100375311",
  },
  {
    id: "concrete",
    name: "Quikrete 50 lb. fast-setting concrete mix",
    unit: "bag",
    price: 7.97,
    source: "Home Depot",
    url: "https://www.homedepot.com/p/100318521",
  },
  {
    id: "staples",
    name: "Grip-Rite 7/16 x 1-1/2 in. stainless collated staples, 500 count",
    unit: "box",
    price: 33.78,
    source: "Home Depot",
    url: "https://www.homedepot.com/p/205309513",
  },
  {
    id: "screws",
    name: "Simpson Strong-Tie 1-1/2 in. HDG connector nails, 600 count",
    unit: "box",
    price: 25.21,
    source: "Home Depot",
    url: "https://www.homedepot.com/b/Hardware-Fasteners/Galvanized/Exterior/N-5yc1vZc255Z1z17e31Z1z1bm6h",
  },
  {
    id: "gateHardware",
    name: "Typical gate hinge and latch set",
    unit: "set",
    price: 26.37,
    source: "Home Depot",
    url: "https://www.homedepot.com/p/327599432",
  },
  {
    id: "antiSag",
    name: "Anti-sag gate brace kit",
    unit: "kit",
    price: 15.98,
    source: "Home Depot",
    url: "https://www.homedepot.com/p/327600050",
  },
  {
    id: "dropRod",
    name: "Everbilt 12 in. black cane bolt for double drive gate",
    unit: "each",
    price: 12.98,
    source: "Home Depot",
    url: "https://www.homedepot.com/p/320092607",
  },
];

const defaultPrices = Object.fromEntries(
  priceItems.map((item) => [item.id, item.price]),
) as Record<string, number>;

const defaultCheckedDates = Object.fromEntries(
  priceItems.map((item) => [item.id, "2026-08-20"]),
) as Record<string, string>;

const priceDataVersion = "2026-08-20-home-depot-only-sources";

function currency(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function cleanNumber(value: number) {
  return Number.isFinite(value) ? value : 0;
}

export default function Home() {
  const [lengthFt, setLengthFt] = useState(120);
  const [heightFt, setHeightFt] = useState(6);
  const [railRows, setRailRows] = useState(3);
  const [postSpacingFt, setPostSpacingFt] = useState(8);
  const [cornerCount, setCornerCount] = useState(4);
  const [wastePct, setWastePct] = useState(5);
  const [difficulty, setDifficulty] = useState<DifficultyKey>("normal");
  const [gates, setGates] = useState<Gate[]>([
    { type: "single", width: 42, placement: "inline" },
  ]);
  const [prices, setPrices] = useState<Record<string, number>>(defaultPrices);
  const [checkedDates, setCheckedDates] =
    useState<Record<string, string>>(defaultCheckedDates);
  const [removedItemIds, setRemovedItemIds] = useState<string[]>([]);
  const [showWeeklyReview, setShowWeeklyReview] = useState(false);

  useEffect(() => {
    const savedPrices = window.localStorage.getItem("woodFencePrices");
    const savedCheckedDates = window.localStorage.getItem(
      "woodFenceCheckedDates",
    );
    const savedPriceDataVersion = window.localStorage.getItem(
      "woodFencePriceDataVersion",
    );
    const savedRemovedItemIds = window.localStorage.getItem(
      "woodFenceRemovedItemIds",
    );

    const hasOldPriceData = savedPriceDataVersion !== priceDataVersion;

    if (savedPrices) {
      const nextPrices = hasOldPriceData
        ? defaultPrices
        : { ...defaultPrices, ...JSON.parse(savedPrices) };

      window.localStorage.setItem("woodFencePriceDataVersion", priceDataVersion);
      window.localStorage.setItem("woodFencePrices", JSON.stringify(nextPrices));
      setPrices(nextPrices);
    } else {
      window.localStorage.setItem("woodFencePriceDataVersion", priceDataVersion);
    }

    if (savedCheckedDates && !hasOldPriceData) {
      setCheckedDates({
        ...defaultCheckedDates,
        ...JSON.parse(savedCheckedDates),
      });
    } else if (hasOldPriceData) {
      window.localStorage.setItem(
        "woodFenceCheckedDates",
        JSON.stringify(defaultCheckedDates),
      );
    }

    if (savedRemovedItemIds) {
      setRemovedItemIds(JSON.parse(savedRemovedItemIds));
    }

    const now = new Date();
    setShowWeeklyReview(now.getDay() === 1 && now.getHours() >= 8);
  }, []);

  const takeoff = useMemo(() => {
    const safeSpacing = Math.min(8, Math.max(4, cleanNumber(postSpacingFt)));
    const inlineGateOpeningsFt = gates.reduce(
      (sum, gate) =>
        gate.placement === "inline" ? sum + gate.width / 12 : sum,
      0,
    );
    const boardFenceFt = Math.max(0, lengthFt - inlineGateOpeningsFt);
    const safeRailRows = railRows === 2 ? 2 : 3;
    const fenceBays = Math.max(1, Math.ceil(boardFenceFt / safeSpacing));
    const fencePosts = boardFenceFt > 0 ? fenceBays + 1 : 0;
    const gateLeaves = gates.reduce(
      (sum, gate) => sum + (gate.type === "double" ? 2 : 1),
      0,
    );
    const doubleGateCount = gates.filter((gate) => gate.type === "double").length;
    const gatePosts = gates.reduce((sum, gate) => {
      if (gate.placement === "end" && boardFenceFt > 0) {
        return sum + 1;
      }

      return sum + 2;
    }, 0);
    const posts = fencePosts + gatePosts + Math.max(0, cornerCount);
    const fencePickets = Math.ceil((boardFenceFt * 12) / 5.5);
    const gatePickets = gates.reduce(
      (sum, gate) => sum + Math.ceil(gate.width / 5.5),
      0,
    );
    const pickets = Math.ceil(
      (fencePickets + gatePickets) * (1 + wastePct / 100),
    );
    const rails = Math.ceil((boardFenceFt * safeRailRows) / 8) + gateLeaves * 3;
    const brackets = fenceBays * safeRailRows * 2;
    const concrete = posts * 2;
    const stapleCount = Math.ceil(
      (fencePickets + gatePickets) * safeRailRows * 2 * 1.1,
    );

    return {
      boardFenceFt,
      railRows: safeRailRows,
      inlineGateOpeningsFt,
      gatePosts,
      pickets,
      posts,
      rails,
      brackets,
      concrete,
      stapleBoxes: Math.max(1, Math.ceil(stapleCount / 500)),
      screwBoxes: Math.max(1, Math.ceil((brackets * 6 + gateLeaves * 40) / 350)),
      gateHardware: gateLeaves,
      antiSag: gateLeaves,
      dropRod: doubleGateCount,
    };
  }, [cornerCount, gates, lengthFt, postSpacingFt, railRows, wastePct]);

  const quantities: Record<string, number> = {
    picket: takeoff.pickets,
    post: takeoff.posts,
    rail: takeoff.rails,
    bracket: takeoff.brackets,
    concrete: takeoff.concrete,
    staples: takeoff.stapleBoxes,
    screws: takeoff.screwBoxes,
    gateHardware: takeoff.gateHardware,
    antiSag: takeoff.antiSag,
    dropRod: takeoff.dropRod,
  };

  const lineItems = priceItems
    .map((item) => ({
      ...item,
      qty: quantities[item.id] || 0,
      price: prices[item.id] ?? item.price,
    }))
    .filter((item) => item.qty > 0 && !removedItemIds.includes(item.id));
  const removedItems = priceItems.filter((item) =>
    removedItemIds.includes(item.id),
  );

  const grandTotal = lineItems.reduce(
    (sum, item) => sum + item.qty * item.price,
    0,
  );
  const retailCost = grandTotal * 1.25;
  const difficultyFactor = difficultyOptions[difficulty].factor;
  const baseFenceLaborHours =
    (takeoff.boardFenceFt / crewProductionLfPerDay) *
    workDayHours *
    crewSize;
  const gateLaborHours = gates.reduce(
    (sum, gate) => sum + (gate.type === "double" ? 5 : 2.5),
    0,
  );
  const estimatedLaborHours =
    Math.ceil((baseFenceLaborHours + gateLaborHours) * difficultyFactor * 10) /
    10;
  const laborHoursPerCrewMember =
    Math.ceil((estimatedLaborHours / crewSize) * 10) / 10;
  const estimatedLaborCost = estimatedLaborHours * laborRate;
  const totalEstimatedCost = retailCost + estimatedLaborCost;

  const warnings = [
    ...gates
      .map((gate, index) => {
        const leafWidth = gate.type === "double" ? gate.width / 2 : gate.width;

        if (leafWidth <= 48) return "";

        return gate.type === "double"
          ? `Gate ${index + 1} has ${leafWidth.toFixed(1)} in. leaves. Double drive gate leaves should not exceed 48 in. each; reduce the opening or revise the gate plan.`
          : `Gate ${index + 1} is ${gate.width} in. wide. Single swing gates should not exceed 48 in.; switch to double drive or revise the width.`;
      })
      .filter(Boolean),
    lengthFt <= 0
      ? "Enter a fence length greater than zero to produce a material takeoff."
      : "",
    takeoff.boardFenceFt === 0 && gates.length > 0
      ? "Inline gate openings equal or exceed the fence length. Check whether gate openings should be set as end/outside fence length."
      : "",
  ].filter(Boolean);

  function updatePrice(id: string, price: number) {
    const next = { ...prices, [id]: Math.max(0, cleanNumber(price)) };
    setPrices(next);
    window.localStorage.setItem("woodFencePrices", JSON.stringify(next));
  }

  function checkSource(item: PriceItem) {
    const today = new Date().toLocaleDateString("en-CA");
    const next = { ...checkedDates, [item.id]: today };

    setCheckedDates(next);
    window.localStorage.setItem("woodFenceCheckedDates", JSON.stringify(next));
    window.open(item.url, "_blank", "noopener,noreferrer");
  }

  function removeBomItem(id: string) {
    const next = Array.from(new Set([...removedItemIds, id]));
    setRemovedItemIds(next);
    window.localStorage.setItem("woodFenceRemovedItemIds", JSON.stringify(next));
  }

  function restoreBomItem(id: string) {
    const next = removedItemIds.filter((itemId) => itemId !== id);
    setRemovedItemIds(next);
    window.localStorage.setItem("woodFenceRemovedItemIds", JSON.stringify(next));
  }

  function resetInputs() {
    setLengthFt(120);
    setHeightFt(6);
    setRailRows(3);
    setPostSpacingFt(8);
    setCornerCount(4);
    setWastePct(5);
    setDifficulty("normal");
    setGates([{ type: "single", width: 42, placement: "inline" }]);
    setRemovedItemIds([]);
    window.localStorage.removeItem("woodFenceRemovedItemIds");
  }

  return (
    <main className="app-shell">
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Pacific Outdoor Fence - Salem Oregon</p>
            <h1>Wood Fencing BOM</h1>
          </div>
          <div className="total-stack">
            <div className="total-card labor-card">
              <span>Estimated Labor</span>
              <strong>{currency(estimatedLaborCost)}</strong>
            </div>
            <div className="total-card">
              <span>Estimated material total</span>
              <strong>{currency(grandTotal)}</strong>
            </div>
            <div className="total-card retail-card">
              <span>Material Retail Cost</span>
              <strong>{currency(retailCost)}</strong>
            </div>
            <div className="total-card total-estimate-card">
              <span>Total Estimated Cost</span>
              <strong>{currency(totalEstimatedCost)}</strong>
            </div>
          </div>
        </header>

        {showWeeklyReview && (
          <section className="weekly-review">
            <div>
              <strong>Weekly price review is due</strong>
              <span>
                It is Monday after 8:00 AM. Check supplier sources and update
                unit prices before using this estimate for a quote.
              </span>
            </div>
            <a href="#bill-of-materials">Review Prices</a>
          </section>
        )}

        <section className="tool-grid">
          <form className="panel controls">
            <div className="panel-header">
              <h2>Project Inputs</h2>
              <button type="button" className="ghost-button" onClick={resetInputs}>
                Reset
              </button>
            </div>

            <label>
              <span>Fence line length</span>
              <div className="input-row">
                <input
                  min="1"
                  step="1"
                  type="number"
                  value={lengthFt}
                  onChange={(event) => setLengthFt(Number(event.target.value))}
                />
                <span>ft</span>
              </div>
              <small className="field-note">
                Use total run length when gates are within the line. Use panel
                footage when gates are added at an end.
              </small>
            </label>

            <label>
              <span>Fence height</span>
              <select
                value={heightFt}
                onChange={(event) => setHeightFt(Number(event.target.value))}
              >
                <option value="4">4 ft</option>
                <option value="5">5 ft</option>
                <option value="6">6 ft</option>
              </select>
            </label>

            <fieldset className="radio-field">
              <legend>Fence rails</legend>
              <div className="radio-row">
                <label>
                  <input
                    checked={railRows === 2}
                    name="railRows"
                    type="radio"
                    value="2"
                    onChange={() => setRailRows(2)}
                  />
                  <span>2 rail</span>
                </label>
                <label>
                  <input
                    checked={railRows === 3}
                    name="railRows"
                    type="radio"
                    value="3"
                    onChange={() => setRailRows(3)}
                  />
                  <span>3 rail</span>
                </label>
              </div>
            </fieldset>

            <label>
              <span>Post spacing</span>
              <div className="input-row">
                <input
                  max="8"
                  min="4"
                  step="0.5"
                  type="number"
                  value={postSpacingFt}
                  onChange={(event) => setPostSpacingFt(Number(event.target.value))}
                />
                <span>ft max</span>
              </div>
            </label>

            <label>
              <span>Number of corners</span>
              <div className="input-row">
                <input
                  min="0"
                  step="1"
                  type="number"
                  value={cornerCount}
                  onChange={(event) => setCornerCount(Number(event.target.value))}
                />
                <span>posts</span>
              </div>
            </label>

            <label>
              <span>Board waste factor</span>
              <div className="input-row">
                <input
                  max="25"
                  min="0"
                  step="1"
                  type="number"
                  value={wastePct}
                  onChange={(event) => setWastePct(Number(event.target.value))}
                />
                <span>%</span>
              </div>
            </label>

            <div className="gate-block">
              <div className="gate-title">
                <h3>Gates</h3>
                <button
                  type="button"
                  onClick={() =>
                    setGates([
                      ...gates,
                      { type: "single", width: 42, placement: "inline" },
                    ])
                  }
                >
                  Add Gate
                </button>
              </div>
              {gates.map((gate, index) => (
                <div className="gate-row" key={`${index}-${gates.length}`}>
                  <span>Gate {index + 1}</span>
                  <select
                    aria-label={`Gate ${index + 1} type`}
                    value={gate.type}
                    onChange={(event) => {
                      const next = [...gates];
                      next[index] = {
                        ...gate,
                        type: event.target.value as Gate["type"],
                      };
                      setGates(next);
                    }}
                  >
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                  </select>
                  <select
                    aria-label={`Gate ${index + 1} placement`}
                    value={gate.placement}
                    onChange={(event) => {
                      const next = [...gates];
                      next[index] = {
                        ...gate,
                        placement: event.target.value as Gate["placement"],
                      };
                      setGates(next);
                    }}
                  >
                    <option value="inline">In Fence</option>
                    <option value="end">Outside</option>
                  </select>
                  <input
                    aria-label={`Gate ${index + 1} opening width in inches`}
                    min="1"
                    step="1"
                    type="number"
                    value={gate.width}
                    onChange={(event) => {
                      const next = [...gates];
                      next[index] = { ...gate, width: Number(event.target.value) };
                      setGates(next);
                    }}
                  />
                  <span>in.</span>
                  <button
                    aria-label={`Remove gate ${index + 1}`}
                    className="remove-gate"
                    type="button"
                    onClick={() =>
                      setGates(gates.filter((_, gateIndex) => gateIndex !== index))
                    }
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          </form>

          <section className="panel overview">
            <div className="panel-header">
              <h2>Takeoff Summary</h2>
              <button
                type="button"
                className="ghost-button"
                onClick={() => window.print()}
              >
                Print
              </button>
            </div>
            <div
              className={`fence-diagram rail-preview-${takeoff.railRows}`}
              aria-label={`${takeoff.railRows}-rail fence layout visualization`}
            >
              <div className="rail rail-top" />
              {takeoff.railRows === 3 && <div className="rail rail-mid" />}
              <div className="rail rail-bottom" />
              {Array.from({ length: 32 }).map((_, index) => (
                <span className="picket" key={index} />
              ))}
              {gates.map((gate, index) => (
                <div
                  className={
                    (gate.type === "double" ? gate.width / 2 : gate.width) > 48
                      ? "gate gate-warning"
                      : "gate"
                  }
                  key={`gate-preview-${index}`}
                  style={{ right: `${18 + index * 88}px` }}
                >
                  <span />
                </div>
              ))}
            </div>
            <div className="summary-grid">
              <div>
                <span>Wood fence footage</span>
                <strong>{takeoff.boardFenceFt.toFixed(1)}</strong>
              </div>
              <div>
                <span>Fence boards</span>
                <strong>{takeoff.pickets}</strong>
              </div>
              <div>
                <span>Posts</span>
                <strong>{takeoff.posts}</strong>
              </div>
              <div>
                <span>Gate posts counted</span>
                <strong>{takeoff.gatePosts}</strong>
              </div>
              <div>
                <span>2x4 rails</span>
                <strong>{takeoff.rails}</strong>
              </div>
              <div>
                <span>Rail rows</span>
                <strong>{takeoff.railRows}</strong>
              </div>
              <div>
                <span>Rail brackets</span>
                <strong>{takeoff.brackets}</strong>
              </div>
            </div>
            <div className="labor-summary">
              <div className="labor-control">
                <label>
                  <span>Difficulty factor</span>
                  <select
                    value={difficulty}
                    onChange={(event) =>
                      setDifficulty(event.target.value as DifficultyKey)
                    }
                  >
                    {Object.entries(difficultyOptions).map(([key, option]) => (
                      <option key={key} value={key}>
                        {option.label} ({option.factor.toFixed(2)}x)
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div>
                <span>Crew production</span>
                <strong>{crewProductionLfPerDay} lf/day</strong>
                <small>Includes post setting</small>
              </div>
              <div>
                <span>Total labor hours</span>
                <strong>{estimatedLaborHours.toFixed(1)}</strong>
                <small>
                  {crewSize} Men: {laborHoursPerCrewMember.toFixed(1)} ea.
                </small>
              </div>
              <div>
                <span>Labor rate</span>
                <strong>{currency(laborRate)}/hr</strong>
              </div>
              <div>
                <span>Estimated Labor</span>
                <strong>{currency(estimatedLaborCost)}</strong>
              </div>
            </div>
            <div className="warnings">
              {warnings.map((warning) => (
                <div className="warning" key={warning}>
                  {warning}
                </div>
              ))}
            </div>
          </section>
        </section>

        <section className="panel assumptions">
          <h2>Build Assumptions</h2>
          <div className="assumption-grid">
            <p>
              Boards are estimated as 5/8 in. x 5-1/2 in. dog-ear pickets with
              5.5 in. coverage per board.
            </p>
            <p>
              Posts are 4x4x8 ground-contact pressure-treated posts set with
              two fast-setting concrete bags each.
            </p>
            <p>
              Rails are kiln-dried 2x4x8 boards. Select either a 2-rail or
              3-rail fence in Project Inputs.
            </p>
            <p>
              Gates within the fence length replace that opening and add two
              gate posts. End gates do not reduce fence footage and add one
              extra post because the fence end post is shared.
            </p>
          </div>
        </section>

        <section className="panel bom-panel" id="bill-of-materials">
          <div className="print-labor-report">
            <h2>Estimated Labor</h2>
            <div>
              <span>Total labor hours</span>
              <strong>{estimatedLaborHours.toFixed(1)}</strong>
              <small>
                {crewSize} Men: {laborHoursPerCrewMember.toFixed(1)} ea.
              </small>
            </div>
            <div>
              <span>Labor rate</span>
              <strong>{currency(laborRate)}/hr</strong>
            </div>
            <div>
              <span>Difficulty</span>
              <strong>{difficultyOptions[difficulty].label}</strong>
            </div>
            <div>
              <span>Labor total</span>
              <strong>{currency(estimatedLaborCost)}</strong>
            </div>
            <div>
              <span>Total estimated cost</span>
              <strong>{currency(totalEstimatedCost)}</strong>
            </div>
          </div>
          <div className="panel-header">
            <h2>Bill of Materials</h2>
            <div className="source-note">
              Use Check Source to refresh a quote, then edit the unit price.
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Unit Price</th>
                  <th>Source</th>
                  <th>Last Checked</th>
                  <th>Update</th>
                  <th>Line Total</th>
                  <th>Remove</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.qty}</td>
                    <td>{item.unit}</td>
                    <td className="price-cell">
                      <input
                        aria-label={`${item.name} unit price`}
                        min="0"
                        step="0.01"
                        type="number"
                        value={item.price}
                        onChange={(event) =>
                          updatePrice(item.id, Number(event.target.value))
                        }
                      />
                    </td>
                    <td className="source-cell">
                      <a href={item.url} rel="noreferrer" target="_blank">
                        {item.source}
                      </a>
                    </td>
                    <td>{checkedDates[item.id] || "Not checked"}</td>
                    <td>
                      <button
                        className="check-button"
                        type="button"
                        onClick={() => checkSource(item)}
                      >
                        Check Source
                      </button>
                    </td>
                    <td>{currency(item.qty * item.price)}</td>
                    <td>
                      <button
                        aria-label={`Remove ${item.name} from bill of materials`}
                        className="remove-item-button"
                        type="button"
                        onClick={() => removeBomItem(item.id)}
                      >
                        X
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {removedItems.length > 0 && (
            <div className="removed-items">
              <h3>Removed Items</h3>
              <div>
                {removedItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => restoreBomItem(item.id)}
                  >
                    Restore {item.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="panel pricing-panel">
          <h2>Pricing Sources</h2>
          <p className="pricing-copy">
            Prices are not pulled live. Click Check Source on each material line,
            confirm the Home Depot page or quote, and type the current unit
            price into the bill of materials.
          </p>
          <div className="source-list">
            <a href="https://www.homedepot.com/b/Lumber-Composites-Fencing-Gates-Wood-Fencing-Wood-Fence-Pickets/Line/Cedar/Dog-Eared/N-5yc1vZc3moZ1z1977wZ1z19wkoZ1z1v1zz" rel="noreferrer" target="_blank">Home Depot cedar pickets</a>
            <a href="https://www.homedepot.com/p/205220341" rel="noreferrer" target="_blank">Home Depot 4x4 posts</a>
            <a href="https://www.homedepot.com/b/Lumber-Composites-Dimensional-Lumber/2x4/8-ft/2-in/N-5yc1vZc3tcZ1z0ywxvZ1z1rkqlZ1z1soke" rel="noreferrer" target="_blank">Home Depot 2x4 rails</a>
            <a href="https://www.homedepot.com/p/100375311" rel="noreferrer" target="_blank">Simpson FB24Z rail brackets</a>
            <a href="https://www.homedepot.com/p/100318521" rel="noreferrer" target="_blank">Home Depot fast-setting concrete</a>
            <a href="https://www.homedepot.com/p/205309513" rel="noreferrer" target="_blank">Home Depot stainless staples</a>
            <a href="https://www.homedepot.com/b/Hardware-Fasteners/Galvanized/Exterior/N-5yc1vZc255Z1z17e31Z1z1bm6h" rel="noreferrer" target="_blank">Home Depot connector nails</a>
            <a href="https://www.homedepot.com/p/327599432" rel="noreferrer" target="_blank">Typical hinge and latch set</a>
            <a href="https://www.homedepot.com/p/327600050" rel="noreferrer" target="_blank">Home Depot anti-sag kit</a>
            <a href="https://www.homedepot.com/p/320092607" rel="noreferrer" target="_blank">Home Depot cane bolt</a>
          </div>
        </section>
      </section>
    </main>
  );
}
