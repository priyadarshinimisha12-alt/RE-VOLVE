export type SourceCard = {
  name: string;
  publisher: string;
  url: string;
  fields: string;
  coverage: string;
  accessed: string;
  license: string;
  limitation: string;
  usedAs: string;
  apiClaim: string;
};

export const DATA_SOURCES: SourceCard[] = [
  {
    name: "VAHAN 4 Dashboard (aggregate)",
    publisher: "Ministry of Road Transport and Highways / NIC",
    url: "https://vahan.parivahan.gov.in/vahan4dashboard/vahan/dashboardview.xhtml",
    fields:
      "Public aggregate views of registrations by state, RTO, vehicle class, fuel, and emission norm.",
    coverage: "National, RTO granularity on the public dashboard; not a bulk individual-record dump.",
    accessed: "2026-03-27 (documentation review; no scrape performed)",
    license: "Government dashboard; reuse of underlying microdata is restricted.",
    limitation:
      "Individual RC, owner, PUC history, and fitness rows are not exposed as an open API. The public lookup is CAPTCHA-gated and was not integrated.",
    usedAs:
      "Qualitative reference for realistic synthetic mix (state weights, fuel and category shares). No rows were copied from VAHAN.",
    apiClaim: "No API integration. Dashboard is not treated as an open data API.",
  },
  {
    name: "Parivahan Sewa public services",
    publisher: "MoRTH / NIC",
    url: "https://parivahan.gov.in/",
    fields: "Citizen services for RC, PUC, and related forms.",
    coverage: "National citizen portal.",
    accessed: "2026-03-27",
    license: "Governed by portal terms; personal records are not open data.",
    limitation: "Not used as a live backend. No credentials, no CAPTCHA bypass.",
    usedAs: "Cited as the official channel owners already use; RE-VOLVE does not replace it.",
    apiClaim: "No API claimed.",
  },
  {
    name: "Open Government Data Platform (data.gov.in)",
    publisher: "NIC / MeitY, contributing ministries including MoRTH",
    url: "https://data.gov.in/",
    fields: "Periodically published transport statistics and catalogues.",
    coverage: "Varies by dataset; often aggregated, lagged, and incomplete.",
    accessed: "2026-03-27",
    license: "Typically Open Government Data License — India (check each dataset).",
    limitation: "Catalogues change; many files are aggregate Excel/CSV, not vehicle-level.",
    usedAs: "Referenced as a legitimate public path for official aggregates. Not ingested live in this demo.",
    apiClaim: "data.gov.in has APIs for some catalogues; none are required to run this prototype.",
  },
  {
    name: "Central Pollution Control Board — Bharat Stage / air quality",
    publisher: "CPCB, MoEFCC",
    url: "https://cpcb.nic.in/",
    fields: "Emission-standard policy context; ambient air-quality programmes.",
    coverage: "National policy; ambient stations are a separate network from vehicle registers.",
    accessed: "2026-03-27",
    license: "Public technical material; reuse subject to CPCB terms.",
    limitation:
      "Ambient AQI is not joined to vehicle records in this product, because vehicle age cannot be used to infer a city’s measured PM2.5.",
    usedAs: "Methodology context for Bharat Stage generations. Not used as a hotspot layer on the map.",
    apiClaim: "No live AQI API is wired.",
  },
  {
    name: "Motor Vehicles fitness and ELV notifications",
    publisher: "MoRTH",
    url: "https://morth.nic.in/",
    fields:
      "Fitness testing frequency; private-vehicle 15-year registration renewal; ELV-related GSR amendments (including fitness-test default pathways).",
    coverage: "National rules with state implementation differences.",
    accessed: "2026-03-27",
    license: "Official gazette / ministry publications.",
    limitation:
      "Rules evolve. This prototype encodes a simplified reading: transport vehicles need periodic fitness; non-transport vehicles need fitness at 15-year renewal. It does not auto-declare ELV status.",
    usedAs: "Recommendation language (review fitness, evaluate ELV rules) — never as a court order.",
    apiClaim: "Not an API.",
  },
  {
    name: "NITI Aayog — Enhancing Circular Economy of ELVs in India",
    publisher: "NITI Aayog",
    url: "https://www.niti.gov.in/sites/default/files/2026-01/Enhancing-Circular-Economy-of-End-of-Life-Vehicles-ELVs-in-India.pdf",
    fields: "Policy discussion of RVSF infrastructure, fitness testing, and ELV feedstock.",
    coverage: "National policy paper (2026).",
    accessed: "2026-03-27",
    license: "Public policy document.",
    limitation: "A strategy paper, not a vehicle-level dataset.",
    usedAs: "Background for why inspection-first and fitness-first pathways matter more than age-only scrappage.",
    apiClaim: "Not an API.",
  },
  {
    name: "RE-VOLVE synthetic demo fleet v1",
    publisher: "RE-VOLVE prototype",
    url: "/methodology",
    fields:
      "Anonymised record_id, year, category, fuel, Bharat Stage, PUC, fitness, usage, state/RTO, optional test readings, source_type=synthetic_demo.",
    coverage: "1,100 labelled synthetic rows across 22 states/UTs. Deterministic seed 42.",
    accessed: "Generated at first run",
    license: "Prototype demo data; not official statistics.",
    limitation:
      "Inspired by published aggregate patterns, not sampled from restricted registers. Distributions are plausible, not a census.",
    usedAs: "Default dataset so the product is usable without government credentials.",
    apiClaim: "Local database only.",
  },
];

export const METHOD_STEPS = [
  {
    title: "1. Ingest available fields",
    body: "Accept a synthetic demo row, a user CSV, or confirmed document fields. Registration numbers are optional and masked. Owner identity is not collected.",
  },
  {
    title: "2. Normalise and score data quality",
    body: "Fuel, category, and Bharat Stage aliases are mapped to a controlled vocabulary. Missing values stay missing. Completeness becomes a separate quality score.",
  },
  {
    title: "3. Rules-based inspection priority",
    body: "A documented point model (0–100) combines technology generation, duty class, PUC evidence, fitness evidence, usage, and a small missing-document weight. Age is a weak prior. Correlated factors are not fully stacked.",
  },
  {
    title: "4. Explain, then recommend a next step",
    body: "Every score lists contributing factors, evidence, gaps, and a proportionate action: verify documents, test, review fitness, maintain, or evaluate ELV rules. Scrappage is never issued from age alone.",
  },
  {
    title: "5. Population analytics and scenarios",
    body: "Filters recompute every chart from the loaded table. The simulator reports how many records a rule selects and a priority-point coverage proxy — not pollutant kilograms.",
  },
];
