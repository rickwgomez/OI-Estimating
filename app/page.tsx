"use client";

import { useEffect, useMemo, useState } from "react";

type AssemblyType = "single" | "double";
type PicketSize = "half" | "fiveEighths" | "threeQuarter";
type TopStyle = "flat" | "frenchCurve" | "arch";
type TrussRodMode = "auto" | "yes" | "no";
type PostMode = "auto" | "five" | "six";
type DifficultyKey = "normal" | "hard" | "veryHard";
type PanelType = "ld72";

type PriceItem = {
  id: string;
  name: string;
  unit: string;
  price: number;
  source: string;
  sourceDetail: string;
};

const laborRate = 95;
const targetSellPerLf = 150;
const laborHoursPerLf = 1.45;
const panelLaborHoursEach = 3;
const stockLengthFt = 20;
const defaultWastePct = 7;
const priceDataVersion = "2026-09-03-ramco-quote-1210175-hinge-weight";
const nominalPanelWidthFt = 6;
const panelPicketSpacingIn = 3.9375;
const standardPanelHeightIn = 72;
const ld72PanelPicketCutLengthIn = 66;
const hingeWeightThresholdLb = 200;
const tubeWeightsLbPerFt: Record<PicketSize | "frame", number> = {
  frame: 2.25,
  half: 0.37,
  fiveEighths: 0.48,
  threeQuarter: 0.81,
};

const difficultyOptions: Record<
  DifficultyKey,
  { label: string; factor: number }
> = {
  normal: { label: "Normal", factor: 1 },
  hard: { label: "Hard", factor: 1.2 },
  veryHard: { label: "Very Hard", factor: 1.4 },
};

const picketOptions: Record<
  PicketSize,
  { label: string; itemId: string; widthIn: number; spacingIn: number }
> = {
  half: {
    label: '1/2" pickets',
    itemId: "picketHalf",
    widthIn: 0.5,
    spacingIn: 4,
  },
  fiveEighths: {
    label: '5/8" pickets',
    itemId: "picketFiveEighths",
    widthIn: 0.625,
    spacingIn: 4,
  },
  threeQuarter: {
    label: '3/4" pickets',
    itemId: "picketThreeQuarter",
    widthIn: 0.75,
    spacingIn: 4,
  },
};

const topStyleOptions: Record<TopStyle, { label: string; frameFactor: number }> =
  {
    flat: { label: "Flat top", frameFactor: 1 },
    frenchCurve: { label: "French curve", frameFactor: 1.12 },
    arch: { label: "Arch top", frameFactor: 1.1 },
  };

const priceItems: PriceItem[] = [
  {
    id: "frameTube",
    name: '1-1/2" x 1-1/2" x .120 wall frame tube allowance',
    unit: "20 ft stick",
    price: 105.45,
    source: "Ramco quote",
    sourceDetail:
      'Quote 1210175 line 8 uses 1-1/2" x 1-1/2" x .180 steel tube as the nearest listed frame tube.',
  },
  {
    id: "picketFiveEighths",
    name: '5/8" x 5/8" x .063 square tube pickets',
    unit: "20 ft stick",
    price: 13.71,
    source: "Ramco quote",
    sourceDetail: "Quote 1210175 line 2, item 3ST5858063.",
  },
  {
    id: "picketHalf",
    name: '1/2" x 1/2" x .063 square tube pickets',
    unit: "20 ft stick",
    price: 11.33,
    source: "Ramco quote",
    sourceDetail: "Quote 1210175 line 1, item 3ST1212063.",
  },
  {
    id: "picketThreeQuarter",
    name: '3/4" x .120 round steel tube pickets',
    unit: "20 ft stick",
    price: 41.8,
    source: "Ramco quote",
    sourceDetail:
      'Quote 1210175 line 25, item 3TU34120. Use as the quoted 3/4" picket option until square picket pricing is supplied.',
  },
  {
    id: "postFive",
    name: '5" x 5" x .120 gate post tube',
    unit: "20 ft stick",
    price: 313.2,
    source: "Ramco quote",
    sourceDetail: "Quote 1210175 line 21, item 3ST55120.",
  },
  {
    id: "postSix",
    name: '6" gate post tube allowance',
    unit: "20 ft stick",
    price: 420,
    source: "Allowance",
    sourceDetail:
      '6" post was requested for openings over 12 ft, but the uploaded quote did not include a 6" square post tube.',
  },
  {
    id: "panelPostOneHalf",
    name: '1-1/2" x 1-1/2" panel post tube',
    unit: "20 ft stick",
    price: 105.45,
    source: "Ramco quote",
    sourceDetail:
      'Quote 1210175 line 8, item 3ST112112180. Drawing calls for 1.5" panel posts.',
  },
  {
    id: "panelRailOne",
    name: '1" x 1" x .063 panel top and bottom rail tube',
    unit: "20 ft stick",
    price: 25.47,
    source: "Ramco quote",
    sourceDetail: "Quote 1210175 line 3, item 3ST11063.",
  },
  {
    id: "panelTabs",
    name: "Tabbed panel mounting tabs",
    unit: "each",
    price: 4.5,
    source: "Allowance",
    sourceDetail:
      "LD-72 Single Panel W-T drawing calls for custom tabs, 2 per tabbed panel.",
  },
  {
    id: "panelTechScrews",
    name: '1/4" tech screws for panel tabs',
    unit: "each",
    price: 0.25,
    source: "Allowance",
    sourceDetail:
      "One 1/4 in. tech screw per LD-72 W-Tabs mounting tab.",
  },
  {
    id: "trussRod",
    name: '3/8" truss rod and adjuster allowance',
    unit: "assembly",
    price: 28,
    source: "Allowance",
    sourceDetail:
      "Editable allowance for double drive gate truss rod hardware.",
  },
  {
    id: "hingeFive",
    name: '5" block hinge set',
    unit: "leaf set",
    price: 55,
    source: "Allowance",
    sourceDetail: "Use for gate leaves estimated under 200 lb.",
  },
  {
    id: "hingeSeven",
    name: '7" block hinge set',
    unit: "leaf set",
    price: 85,
    source: "Allowance",
    sourceDetail: "Use for gate leaves estimated at 200 lb or heavier.",
  },
  {
    id: "latch",
    name: "Gate latch allowance",
    unit: "set",
    price: 45,
    source: "Allowance",
    sourceDetail: "Editable hardware allowance.",
  },
  {
    id: "dropRod",
    name: "Drop rod for double drive gate",
    unit: "each",
    price: 38,
    source: "Allowance",
    sourceDetail: "Editable hardware allowance.",
  },
  {
    id: "shopSupplies",
    name: "Tabs, caps, welding wire, paint, and shop supplies",
    unit: "assembly",
    price: 85,
    source: "Allowance",
    sourceDetail: "Editable fabrication supply allowance.",
  },
];

const defaultPrices = Object.fromEntries(
  priceItems.map((item) => [item.id, item.price]),
) as Record<string, number>;

const defaultCheckedDates = Object.fromEntries(
  priceItems.map((item) => [item.id, "2026-09-02"]),
) as Record<string, string>;

function currency(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function cleanNumber(value: number) {
  return Number.isFinite(value) ? value : 0;
}

function ceilTo(value: number, increment: number) {
  return Math.ceil(value / increment) * increment;
}

export default function Home() {
  const [assemblyType, setAssemblyType] = useState<AssemblyType>("double");
  const [noGates, setNoGates] = useState(false);
  const [noPanels, setNoPanels] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [openingFt, setOpeningFt] = useState(12);
  const [heightFt, setHeightFt] = useState(6);
  const [picketSize, setPicketSize] = useState<PicketSize>("fiveEighths");
  const [topStyle, setTopStyle] = useState<TopStyle>("flat");
  const [includeMidRail, setIncludeMidRail] = useState(false);
  const [trussRodMode, setTrussRodMode] = useState<TrussRodMode>("auto");
  const [postMode, setPostMode] = useState<PostMode>("auto");
  const [wastePct, setWastePct] = useState(defaultWastePct);
  const [difficulty, setDifficulty] = useState<DifficultyKey>("normal");
  const [materialMarkupPct, setMaterialMarkupPct] = useState(70);
  const [panelType, setPanelType] = useState<PanelType>("ld72");
  const [panelRunFt, setPanelRunFt] = useState(0);
  const [panelHeightFt, setPanelHeightFt] = useState(6);
  const [prices, setPrices] = useState<Record<string, number>>(defaultPrices);
  const [checkedDates, setCheckedDates] =
    useState<Record<string, string>>(defaultCheckedDates);
  const [removedItemIds, setRemovedItemIds] = useState<string[]>([]);
  const [showWeeklyReview, setShowWeeklyReview] = useState(false);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const savedPriceDataVersion = window.localStorage.getItem(
        "oiGatePriceDataVersion",
      );
      const savedPrices = window.localStorage.getItem("oiGatePrices");
      const savedCheckedDates = window.localStorage.getItem(
        "oiGateCheckedDates",
      );
      const savedRemovedItemIds = window.localStorage.getItem(
        "oiGateRemovedItemIds",
      );
      const hasOldPriceData = savedPriceDataVersion !== priceDataVersion;

      if (savedPrices && !hasOldPriceData) {
        setPrices({ ...defaultPrices, ...JSON.parse(savedPrices) });
      } else {
        window.localStorage.setItem("oiGatePriceDataVersion", priceDataVersion);
        window.localStorage.setItem(
          "oiGatePrices",
          JSON.stringify(defaultPrices),
        );
      }

      if (savedCheckedDates && !hasOldPriceData) {
        setCheckedDates({
          ...defaultCheckedDates,
          ...JSON.parse(savedCheckedDates),
        });
      } else {
        window.localStorage.setItem(
          "oiGateCheckedDates",
          JSON.stringify(defaultCheckedDates),
        );
      }

      if (savedRemovedItemIds) {
        setRemovedItemIds(JSON.parse(savedRemovedItemIds));
      }

      const now = new Date();
      setShowWeeklyReview(now.getDay() === 1 && now.getHours() >= 8);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  const takeoff = useMemo(() => {
    const safeQty = Math.max(1, Math.ceil(cleanNumber(quantity)));
    const safeOpeningFt = Math.max(0, cleanNumber(openingFt));
    const safeHeightFt = Math.max(1, cleanNumber(heightFt));
    const leafCount =
      assemblyType === "double" ? 2 : assemblyType === "single" ? 1 : 0;
    const bayCount = Math.max(1, leafCount || 1);
    const leafWidthFt = leafCount ? safeOpeningFt / leafCount : safeOpeningFt;
    const selectedPicket = picketOptions[picketSize];
    const selectedTop = topStyleOptions[topStyle];
    const autoTruss = assemblyType === "double" && safeOpeningFt * 12 > 48;
    const trussRodCount =
      trussRodMode === "yes" || (trussRodMode === "auto" && autoTruss)
        ? safeQty
        : 0;
    const autoPostSize = safeOpeningFt > 12 ? "six" : "five";
    const resolvedPostSize = postMode === "auto" ? autoPostSize : postMode;
    const postCount = 2 * safeQty;
    const postLf = postCount * 8;
    const framePerBayLf = (leafWidthFt + safeHeightFt) * 2;
    const curvedTopExtraLf =
      topStyle === "flat" ? 0 : bayCount * leafWidthFt * (topStyle === "arch" ? 0.18 : 0.22);
    const midRailLf = includeMidRail ? safeOpeningFt * safeQty : 0;
    const frameLf =
      (framePerBayLf * bayCount * selectedTop.frameFactor + curvedTopExtraLf) *
        safeQty +
      midRailLf;
    const picketCountPerAssembly =
      Math.ceil((safeOpeningFt * 12) / selectedPicket.spacingIn) + bayCount;
    const picketLf =
      picketCountPerAssembly *
      safeHeightFt *
      safeQty *
      (topStyle === "flat" ? 1 : 1.04);
    const hingeLeafCount = leafCount * safeQty;
    const estimatedGateWeightLb =
      frameLf * tubeWeightsLbPerFt.frame +
      picketLf * tubeWeightsLbPerFt[picketSize] +
      trussRodCount * 10 +
      hingeLeafCount * 8 +
      (assemblyType === "double" ? safeQty * 8 : 0);
    const estimatedLeafWeightLb =
      hingeLeafCount > 0 ? estimatedGateWeightLb / hingeLeafCount : 0;
    const hingeSize = estimatedLeafWeightLb >= hingeWeightThresholdLb ? 7 : 5;
    const wasteFactor = 1 + Math.max(0, cleanNumber(wastePct)) / 100;
    const frameSticks = Math.max(1, Math.ceil((frameLf * wasteFactor) / stockLengthFt));
    const picketSticks = Math.max(
      1,
      Math.ceil((picketLf * wasteFactor) / stockLengthFt),
    );
    const postSticks = postCount > 0 ? Math.ceil(postLf / stockLengthFt) : 0;
    const laborHours =
      ceilTo(safeOpeningFt * safeQty * laborHoursPerLf * difficultyOptions[difficulty].factor, 0.25);
    const laborTarget = safeOpeningFt * safeQty * targetSellPerLf;

    return {
      safeQty,
      safeOpeningFt,
      safeHeightFt,
      leafCount,
      bayCount,
      leafWidthFt,
      picketCountPerAssembly,
      frameLf,
      frameSticks,
      picketLf,
      picketSticks,
      estimatedGateWeightLb,
      estimatedLeafWeightLb,
      hingeSize,
      midRailLf,
      trussRodCount,
      autoTruss,
      postCount,
      postSticks,
      resolvedPostSize,
      laborHours,
      laborTarget,
    };
  }, [
    assemblyType,
    difficulty,
    heightFt,
    includeMidRail,
    openingFt,
    picketSize,
    postMode,
    quantity,
    topStyle,
    trussRodMode,
    wastePct,
  ]);

  const panelTakeoff = useMemo(() => {
    const safeRunFt = noPanels ? 0 : Math.max(0, cleanNumber(panelRunFt));
    const panelCount =
      safeRunFt > 0 ? Math.max(1, Math.ceil(safeRunFt / nominalPanelWidthFt)) : 0;
    const fullPanelCount = panelCount > 0 ? 1 : 0;
    const tabbedPanelCount = Math.max(0, panelCount - fullPanelCount);
    const safeOpeningFt = panelCount > 0 ? safeRunFt / panelCount : 0;
    const safeHeightFt = Math.max(1, cleanNumber(panelHeightFt));
    const wasteFactor = 1 + Math.max(0, cleanNumber(wastePct)) / 100;
    const postCount = fullPanelCount * 2 + tabbedPanelCount;
    const postLf = postCount * safeHeightFt;
    const railLf = panelCount * safeOpeningFt * 2;
    const picketCountPerPanel =
      panelCount > 0
        ? Math.max(2, Math.round((safeOpeningFt * 12) / panelPicketSpacingIn))
        : 0;
    const picketCutLengthFt = Math.max(
      1,
      (safeHeightFt * 12 -
        (standardPanelHeightIn - ld72PanelPicketCutLengthIn)) /
        12,
    );
    const picketLf = panelCount * picketCountPerPanel * picketCutLengthFt;

    return {
      safeQty: panelCount,
      safeRunFt,
      safeOpeningFt,
      safeHeightFt,
      panelType,
      fullPanelCount,
      tabbedPanelCount,
      postCount,
      postSticks: postCount > 0 ? Math.ceil(postLf / stockLengthFt) : 0,
      railSticks:
        panelCount > 0 ? Math.ceil((railLf * wasteFactor) / stockLengthFt) : 0,
      picketCountPerPanel,
      picketCutLengthFt,
      picketSticks:
        panelCount > 0 ? Math.ceil((picketLf * wasteFactor) / stockLengthFt) : 0,
      tabQty: tabbedPanelCount * 2,
      shopSupplyQty: panelCount > 0 ? panelCount : 0,
      laborHours: panelCount * panelLaborHoursEach,
      laborTarget: safeRunFt * targetSellPerLf,
    };
  }, [
    noPanels,
    panelHeightFt,
    panelRunFt,
    panelType,
    wastePct,
  ]);

  const hasGateMaterials = !noGates;
  const gateQuantities: Record<string, number> = {
    frameTube: hasGateMaterials ? takeoff.frameSticks : 0,
    [picketOptions[picketSize].itemId]: hasGateMaterials
      ? takeoff.picketSticks
      : 0,
    postFive:
      hasGateMaterials && takeoff.resolvedPostSize === "five"
        ? takeoff.postSticks
        : 0,
    postSix:
      hasGateMaterials && takeoff.resolvedPostSize === "six"
        ? takeoff.postSticks
        : 0,
    trussRod: hasGateMaterials ? takeoff.trussRodCount : 0,
    hingeFive:
      hasGateMaterials && takeoff.hingeSize === 5
        ? takeoff.leafCount * takeoff.safeQty
        : 0,
    hingeSeven:
      hasGateMaterials && takeoff.hingeSize === 7
        ? takeoff.leafCount * takeoff.safeQty
        : 0,
    latch: hasGateMaterials ? takeoff.safeQty : 0,
    dropRod:
      hasGateMaterials && assemblyType === "double" ? takeoff.safeQty : 0,
    shopSupplies: hasGateMaterials ? takeoff.safeQty : 0,
  };

  const panelQuantities: Record<string, number> = {
    panelPostOneHalf: panelTakeoff.postSticks,
    panelRailOne: panelTakeoff.railSticks,
    picketHalf: panelTakeoff.picketSticks,
    panelTabs: panelTakeoff.tabQty,
    panelTechScrews: panelTakeoff.tabQty,
    shopSupplies: panelTakeoff.shopSupplyQty,
  };

  const gateLineItems = priceItems
    .map((item) => ({
      ...item,
      qty: gateQuantities[item.id] || 0,
      price: prices[item.id] ?? item.price,
    }))
    .filter((item) => item.qty > 0 && !removedItemIds.includes(item.id));

  const panelLineItems = priceItems
    .map((item) => ({
      ...item,
      qty: panelQuantities[item.id] || 0,
      price: prices[item.id] ?? item.price,
    }))
    .filter((item) => item.qty > 0 && !removedItemIds.includes(item.id));

  const lineItems = [...gateLineItems, ...panelLineItems];
  const combinedLineItems = priceItems
    .map((item) => ({
      ...item,
      qty: (gateQuantities[item.id] || 0) + (panelQuantities[item.id] || 0),
      price: prices[item.id] ?? item.price,
    }))
    .filter((item) => item.qty > 0 && !removedItemIds.includes(item.id));
  const removedItems = priceItems.filter((item) =>
    removedItemIds.includes(item.id),
  );

  const materialCost = lineItems.reduce(
    (sum, item) => sum + item.qty * item.price,
    0,
  );
  const materialRetail = materialCost * (1 + materialMarkupPct / 100);
  const totalLaborHours =
    (hasGateMaterials ? takeoff.laborHours : 0) + panelTakeoff.laborHours;
  const totalLaborTarget =
    (hasGateMaterials ? takeoff.laborTarget : 0) + panelTakeoff.laborTarget;
  const laborCost = totalLaborHours * laborRate;
  const totalEstimatedCost = materialRetail + laborCost;
  const ruleOfThumbTotal = materialRetail + totalLaborTarget;

  const warnings = [
    prices.frameTube === defaultPrices.frameTube
      ? 'Frame tube uses the quoted .180 wall line as the editable default because the uploaded quote does not list 1-1/2" x 1-1/2" x .120 wall tube.'
      : "",
    takeoff.resolvedPostSize === "six" && prices.postSix === defaultPrices.postSix
      ? '6" post pricing is an allowance because the uploaded quote did not include a 6" square post tube.'
      : "",
    hasGateMaterials &&
    assemblyType === "double" &&
    trussRodMode === "no" &&
    takeoff.autoTruss
      ? "This double drive gate is over 48 in. and normally should include a truss rod."
      : "",
    hasGateMaterials && assemblyType === "single" && takeoff.safeOpeningFt * 12 > 48
      ? "Single swing openings over 48 in. should be reviewed before quoting."
      : "",
  ].filter(Boolean);

  function updatePrice(id: string, price: number) {
    const next = { ...prices, [id]: Math.max(0, cleanNumber(price)) };
    setPrices(next);
    window.localStorage.setItem("oiGatePrices", JSON.stringify(next));
  }

  function markChecked(id: string) {
    const today = new Date().toLocaleDateString("en-CA");
    const next = { ...checkedDates, [id]: today };

    setCheckedDates(next);
    window.localStorage.setItem("oiGateCheckedDates", JSON.stringify(next));
  }

  function removeBomItem(id: string) {
    const next = Array.from(new Set([...removedItemIds, id]));
    setRemovedItemIds(next);
    window.localStorage.setItem("oiGateRemovedItemIds", JSON.stringify(next));
  }

  function restoreBomItem(id: string) {
    const next = removedItemIds.filter((itemId) => itemId !== id);
    setRemovedItemIds(next);
    window.localStorage.setItem("oiGateRemovedItemIds", JSON.stringify(next));
  }

  function resetInputs() {
    setAssemblyType("double");
    setNoGates(false);
    setNoPanels(true);
    setQuantity(1);
    setOpeningFt(12);
    setHeightFt(6);
    setPicketSize("fiveEighths");
    setTopStyle("flat");
    setIncludeMidRail(false);
    setTrussRodMode("auto");
    setPostMode("auto");
    setWastePct(defaultWastePct);
    setDifficulty("normal");
    setMaterialMarkupPct(70);
    setPanelType("ld72");
    setPanelRunFt(0);
    setPanelHeightFt(6);
    setRemovedItemIds([]);
    window.localStorage.removeItem("oiGateRemovedItemIds");
  }

  function renderBomRows(items: typeof lineItems, emptyMessage: string) {
    if (items.length === 0) {
      return (
        <tr>
          <td colSpan={9}>{emptyMessage}</td>
        </tr>
      );
    }

    return items.map((item, index) => (
      <tr key={`${item.id}-${index}`}>
        <td>
          <strong className="item-name">{item.name}</strong>
          <small className="item-detail">{item.sourceDetail}</small>
        </td>
        <td>{item.qty}</td>
        <td>{item.unit}</td>
        <td className="price-cell">
          <input
            aria-label={`${item.name} unit price`}
            min="0"
            step="0.01"
            type="number"
            value={item.price}
            onChange={(event) => updatePrice(item.id, Number(event.target.value))}
          />
        </td>
        <td>{item.source}</td>
        <td>{checkedDates[item.id] || "Not checked"}</td>
        <td>
          <button
            className="check-button"
            type="button"
            onClick={() => markChecked(item.id)}
          >
            Mark Checked
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
    ));
  }

  return (
    <main className="app-shell">
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Pacific Outdoor Fence - OI Gate Shop</p>
            <h1>OI Gate & Panel BOM</h1>
          </div>
          <div className="total-stack">
            <div className="total-card labor-card">
              <span>Estimated Labor</span>
              <strong>{currency(laborCost)}</strong>
            </div>
            <div className="total-card">
              <span>Material Cost</span>
              <strong>{currency(materialCost)}</strong>
            </div>
            <div className="total-card retail-card">
              <span>Material Retail</span>
              <strong>{currency(materialRetail)}</strong>
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
                It is Monday after 8:00 AM. Review the Ramco quote and update
                unit prices before using this estimate for a customer quote.
              </span>
            </div>
            <a href="#bill-of-materials">Review Prices</a>
          </section>
        )}

        <section className="tool-grid">
          <form className="panel controls">
            <div className="panel-header">
              <h2>Gate Inputs</h2>
              <button type="button" className="ghost-button" onClick={resetInputs}>
                Reset
              </button>
            </div>

            <fieldset className="radio-field">
              <legend>Gate type</legend>
              <div className="radio-row">
                {(["double", "single"] as AssemblyType[]).map((type) => (
                  <label key={type}>
                    <input
                      checked={assemblyType === type}
                      name="assemblyType"
                      type="radio"
                      value={type}
                      disabled={noGates}
                      onChange={() => setAssemblyType(type)}
                    />
                    <span>{type === "double" ? "Double" : "Single"}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="switch-row">
              <label>
                <input
                  checked={noGates}
                  type="checkbox"
                  onChange={(event) => setNoGates(event.target.checked)}
                />
                <span>No Gates</span>
              </label>
            </div>

            <div className="input-pair">
              <label>
                <span>Gate quantity</span>
                <input
                  disabled={noGates}
                  min="1"
                  step="1"
                  type="number"
                  value={quantity}
                  onChange={(event) => setQuantity(Number(event.target.value))}
                />
              </label>
              <label>
                <span>Opening width</span>
                <div className="input-row">
                  <input
                    disabled={noGates}
                    min="1"
                    step="0.5"
                    type="number"
                    value={openingFt}
                    onChange={(event) => setOpeningFt(Number(event.target.value))}
                  />
                  <span>ft</span>
                </div>
              </label>
            </div>

            <div className="input-pair">
              <label>
                <span>Height</span>
                <div className="input-row">
                  <input
                    disabled={noGates}
                    min="3"
                    step="0.5"
                    type="number"
                    value={heightFt}
                    onChange={(event) => setHeightFt(Number(event.target.value))}
                  />
                  <span>ft</span>
                </div>
              </label>
              <label>
                <span>Material markup</span>
                <div className="input-row">
                  <input
                    min="0"
                    step="1"
                    type="number"
                    value={materialMarkupPct}
                    onChange={(event) =>
                      setMaterialMarkupPct(Number(event.target.value))
                    }
                  />
                  <span>%</span>
                </div>
              </label>
            </div>

              <label>
                <span>Picket size</span>
              <select
                disabled={noGates}
                value={picketSize}
                onChange={(event) => setPicketSize(event.target.value as PicketSize)}
              >
                {Object.entries(picketOptions).map(([key, option]) => (
                  <option key={key} value={key}>
                    {option.label}
                  </option>
                ))}
              </select>
              <small className="field-note">
                Gate pickets default to 5/8 in. Panel runs use fixed 1/2 in.
                pickets per the LD-72 drawings.
              </small>
            </label>

            <label>
              <span>Top style</span>
              <select
                disabled={noGates}
                value={topStyle}
                onChange={(event) => setTopStyle(event.target.value as TopStyle)}
              >
                {Object.entries(topStyleOptions).map(([key, option]) => (
                  <option key={key} value={key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="switch-row">
              <label>
                <input
                  checked={includeMidRail}
                  disabled={noGates}
                  type="checkbox"
                  onChange={(event) => setIncludeMidRail(event.target.checked)}
                />
                <span>Include mid-rail</span>
              </label>
            </div>

            <div className="input-pair">
              <label>
                <span>Truss rod</span>
                <select
                  disabled={noGates}
                  value={trussRodMode}
                  onChange={(event) =>
                    setTrussRodMode(event.target.value as TrussRodMode)
                  }
                >
                  <option value="auto">Auto for double over 48 in.</option>
                  <option value="yes">Always include</option>
                  <option value="no">Do not include</option>
                </select>
              </label>
              <label>
                <span>Post size</span>
                <select
                  disabled={noGates}
                  value={postMode}
                  onChange={(event) => setPostMode(event.target.value as PostMode)}
                >
                  <option value="auto">Auto: 6 in. over 12 ft</option>
                  <option value="five">5 in.</option>
                  <option value="six">6 in.</option>
                </select>
              </label>
            </div>

            <div className="gate-block">
              <div className="gate-title">
                <h3>Panels</h3>
                <span className="field-note">
                  Light Duty / LD-72: one starter panel, remaining panels W-Tabs
                </span>
              </div>
              <div className="switch-row">
                <label>
                  <input
                    checked={noPanels}
                    type="checkbox"
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setNoPanels(checked);
                      if (!checked && panelRunFt === 0) {
                        setPanelRunFt(8);
                      }
                    }}
                  />
                  <span>No Panels</span>
                </label>
              </div>
              <label>
                <span>Panel type</span>
                <select
                  disabled={noPanels}
                  value={panelType}
                  onChange={(event) => setPanelType(event.target.value as PanelType)}
                >
                  <option value="ld72">Light Duty / LD-72</option>
                </select>
                <small className="field-note">
                  Starts with one LD-72 Single Panel with posts on both ends.
                  Additional panels use LD-72 Single Panel W-Tabs and fasten
                  with one 1/4 in. tech screw per tab.
                </small>
              </label>
              <div className="input-pair">
                <label>
                  <span>Panel run</span>
                  <div className="input-row">
                    <input
                      disabled={noPanels}
                      min="0"
                      step="0.5"
                      type="number"
                      value={panelRunFt}
                      onChange={(event) => setPanelRunFt(Number(event.target.value))}
                    />
                    <span>ft</span>
                  </div>
                </label>
                <label>
                  <span>Panel height</span>
                  <div className="input-row">
                    <input
                      disabled={noPanels}
                      min="3"
                      step="0.5"
                      type="number"
                      value={panelHeightFt}
                      onChange={(event) =>
                        setPanelHeightFt(Number(event.target.value))
                      }
                    />
                    <span>ft</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="input-pair">
              <label>
                <span>Waste factor</span>
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
              <label>
                <span>Difficulty</span>
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
              className={`fence-diagram oi-diagram top-${topStyle}`}
              aria-label="OI gate layout visualization"
            >
              <div className="oi-frame">
                {includeMidRail && <span className="oi-midrail" />}
                {takeoff.trussRodCount > 0 && <span className="oi-truss" />}
                {Array.from({ length: Math.min(32, takeoff.picketCountPerAssembly) }).map(
                  (_, index) => (
                    <span className="oi-picket" key={index} />
                  ),
                )}
              </div>
            </div>
            <div className="summary-grid">
              <div>
                <span>Opening</span>
                <strong>{takeoff.safeOpeningFt.toFixed(1)} ft</strong>
              </div>
              <div>
                <span>Leaves / bays</span>
                <strong>{takeoff.bayCount}</strong>
              </div>
              <div>
                <span>Leaf width</span>
                <strong>{takeoff.leafWidthFt.toFixed(1)} ft</strong>
              </div>
              <div>
                <span>Pickets per assembly</span>
                <strong>{takeoff.picketCountPerAssembly}</strong>
              </div>
              <div>
                <span>Frame tube</span>
                <strong>{takeoff.frameSticks}</strong>
                <small>20 ft sticks</small>
              </div>
              <div>
                <span>Picket tube</span>
                <strong>{takeoff.picketSticks}</strong>
                <small>20 ft sticks</small>
              </div>
              <div>
                <span>Posts</span>
                <strong>{takeoff.postCount}</strong>
                <small>
                  {takeoff.resolvedPostSize === "six"
                      ? '6" post rule'
                      : '5" post rule'}
                </small>
              </div>
              <div>
                <span>Truss rods</span>
                <strong>{takeoff.trussRodCount}</strong>
              </div>
              <div>
                <span>Gate weight</span>
                <strong>{Math.round(takeoff.estimatedLeafWeightLb)} lb</strong>
                <small>estimated per leaf</small>
              </div>
              <div>
                <span>Block hinges</span>
                <strong>{takeoff.hingeSize}&quot;</strong>
                <small>
                  {takeoff.hingeSize === 7 ? "200 lb and up" : "under 200 lb"}
                </small>
              </div>
              <div>
                <span>Panels</span>
                <strong>{panelTakeoff.safeQty}</strong>
                <small>
                  {panelTakeoff.safeRunFt.toFixed(1)} ft run /{" "}
                  {panelTakeoff.safeOpeningFt.toFixed(2)} ft each
                </small>
              </div>
              <div>
                <span>Full / tabbed</span>
                <strong>
                  {panelTakeoff.fullPanelCount} / {panelTakeoff.tabbedPanelCount}
                </strong>
                <small>
                  {panelTakeoff.safeHeightFt.toFixed(1)} ft
                </small>
              </div>
              <div>
                <span>Panel posts</span>
                <strong>{panelTakeoff.postCount}</strong>
                <small>1.5&quot; x 1.5&quot;</small>
              </div>
              <div>
                <span>Panel pickets</span>
                <strong>{panelTakeoff.picketCountPerPanel}</strong>
                <small>
                  per panel, {panelTakeoff.picketCutLengthFt.toFixed(2)} ft cut
                </small>
              </div>
            </div>
            <div className="labor-summary">
              <div>
                <span>Labor rule</span>
                <strong>{laborHoursPerLf.toFixed(2)} hr/lf</strong>
                <small>{currency(targetSellPerLf)}/lf rule of thumb</small>
              </div>
              <div>
                <span>Total labor hours</span>
                <strong>{totalLaborHours.toFixed(2)}</strong>
              </div>
              <div>
                <span>Labor rate</span>
                <strong>{currency(laborRate)}/hr</strong>
              </div>
              <div>
                <span>Labor target</span>
                <strong>{currency(totalLaborTarget)}</strong>
              </div>
              <div>
                <span>Rule total</span>
                <strong>{currency(ruleOfThumbTotal)}</strong>
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
              Gate frames are built as 1-1/2 in. x 1-1/2 in. x .120 wall tube.
              The uploaded quote does not list that exact tube, so the nearest
              quoted frame tube line is used as an editable default.
            </p>
            <p>
              Double drive gates over 48 in. automatically include a truss rod
              unless the selector is changed. The truss rod can also be forced
              on for any assembly.
            </p>
            <p>
              Gate hinge sizing uses estimated leaf weight: 5 in. block hinges
              under 200 lb and 7 in. block hinges at 200 lb or heavier.
            </p>
            <p>
              Gate posts default to 5 in. for openings up to 12 ft and 6 in.
              above 12 ft. Panel runs use LD-72 style panels: one full panel,
              remaining panels with tabs, equalized across the run.
            </p>
            <p>
              Labor uses 1.45 hours per linear foot at $95/hr, with the $150/lf
              target shown alongside the calculated labor cost.
            </p>
          </div>
        </section>

        <section className="panel bom-panel" id="bill-of-materials">
          <div className="print-labor-report">
            <h2>Estimated Labor</h2>
            <div>
              <span>Total labor hours</span>
              <strong>{totalLaborHours.toFixed(2)}</strong>
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
              <strong>{currency(laborCost)}</strong>
            </div>
            <div>
              <span>Total estimated cost</span>
              <strong>{currency(totalEstimatedCost)}</strong>
            </div>
          </div>
          <div className="panel-header">
            <h2>Gate Bill of Materials</h2>
            <div className="source-note">
              Prices came from Quote 1210175 where listed. Allowance rows are
              editable.
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
              <tbody>{renderBomRows(gateLineItems, "No gate materials selected.")}</tbody>
            </table>
          </div>

          <div className="panel-subsection">
            <div className="panel-header">
              <h2>Panel Bill of Materials</h2>
              <div className="source-note">
                LD-72 panels use 1.5 in. posts, 1 in. top and bottom rails,
                1/2 in. pickets, and 2 tabs on each tabbed panel.
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
                  {renderBomRows(panelLineItems, "No panel materials selected.")}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="panel bom-panel">
          <div className="panel-header">
            <h2>Combined Bill of Materials</h2>
            <div className="source-note">
              Combined material total includes gate and panel tables.
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
                {renderBomRows(combinedLineItems, "No materials selected.")}
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
            Supplier pricing is editable because the quote is a point-in-time
            price book. The exact .120 frame tube and 6 in. post should be
            updated when those current Ramco rows are available.
          </p>
          <div className="source-list">
            {priceItems.map((item) => (
              <span key={item.id}>{item.sourceDetail}</span>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
