# ImpactLens

ImpactLens is a browser-local decision simulator for comparing product scenarios. It provides editable projects and components, deterministic cost and emissions calculations, comparison charts, sensitivity analysis, factor metadata, snapshots, CSV exports and a printable report. The interface supports Indonesian and English.

## Run and verify

```sh
npm ci
npm run dev
npm run typecheck
npm test
npm run build
```

Open http://localhost:3000. No database, API key, or paid service is required. Projects and snapshots are stored in browser localStorage, are not encrypted or synchronized, and can be lost if browser data is cleared.

## Calculation model

Material mass is converted from g, kg, or metric tonnes to kg. Material cost is kg × price per kg × production volume; material emissions are kg × kg CO2e/kg × volume. Energy cost and emissions are kWh × price or kg CO2e/kWh × volume. Transport cost and emissions use transported mass in kg divided by 1,000, multiplied by km, price or kg CO2e per tonne-km, and volume. The transport-price model is explicitly linear per tonne-km. All values use the project's single currency; no currency conversion is performed. Totals are withheld when a required component is missing, and negative values or incompatible factor units invalidate the result. Zero-baseline percentage changes are undefined. Precision is retained internally and rounded for display.

Sensitivity varies material mass, distance, and energy one at a time by a user-selected percentage and calls the same calculation engine. The range is not a statistical confidence interval. Snapshots copy inputs and results at save time.

## Limitations

All seeded factors and prices are illustrative demo data, not verified environmental datasets. The tool is exploratory and does not replace a professional life-cycle assessment. Results depend on user-selected boundaries and source quality. Users must assess whether components overlap and avoid double counting. Automated currency conversion, probability distributions, formal uncertainty modeling, break-even analysis, cloud synchronization, and external factor databases are not implemented. Print-to-PDF uses the browser's print dialog.
