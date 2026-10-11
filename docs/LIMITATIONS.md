# Limitations and assumptions

- Default rows are **synthetic** (`source_type = synthetic_demo`). They are inspired by published aggregate VAHAN-style patterns, not copied from restricted registers.
- Individual RC / PUC / fitness history is **not** pulled from Parivahan. Public lookups are CAPTCHA-gated and were not integrated.
- Inspection priority is a prototype index, not a laboratory measurement and not an official class.
- Failed PUC is treated as test evidence. Missing PUC is not treated as a fail.
- Fitness is expected for commercial-duty vehicles and for private vehicles at/after 15 years (registration renewal). This is a simplified reading of CMVR practice.
- The simulator’s costs are illustrative INR tables for comparison only.
- The simulator’s “coverage” is the share of total priority points captured — **not** kg of CO₂, PM2.5, or NOx.
- The regional view is a schematic tile map of inspection-priority share, **not** ambient air quality.
- Document OCR for images/PDFs is disabled without an external service. Paste-text extraction is local regex.
- Amazon Bedrock / SageMaker are not connected.
- RE-VOLVE is not an official government system and must not be presented as one.
