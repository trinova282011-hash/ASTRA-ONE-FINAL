# Data methodology

## Classification labels

Every parameter shown in the in-app **Data & NASA Origins** reference is labeled:

- **REAL DATA** - a source observation or published reference value, shown with its source and relevant measurement scope. A real observation is not automatically a local outpost measurement.
- **DERIVED** - a value calculated from explicitly stated reference values. The displayed note should preserve the inputs or calculation basis.
- **GAME MODEL** - a training or gameplay parameter, simplification, threshold, balance value, or approximation. It is not a measured value or operational specification.

The Arabic labels are **بيانات حقيقية**, **قيمة مشتقة**, and **نموذج اللعبة**.

## How to interpret examples

- NOAA GOES proton observations are Earth-referenced real data. The game may offer a training choice to defer optional exploration; it does not calculate lunar/Mars dose or alter modeled health from that observation.
- Planetary facts may be sourced from NASA or fact sheets. A calculated ratio is labeled derived, while an unsourced game range such as the Mars communication delay is a game model.
- Crew oxygen, water, food, and CO2 rates; water-recovery percentages; greenhouse yields and water use; ISRU output; and game power loads are **GAME MODEL** values. Their numbers support gameplay and should not be described as NASA requirements.
- Radiation rates and shielding/storm modifiers used by the simulation are game-model inputs, even when a research paper is linked for historical context. The game values are not validated dose forecasts or health limits.

## Data-use rules

1. Keep measured/source data distinct from calculated values and game rules in both UI and documentation.
2. Link a source only for the claim it supports. Context about lunar water, for example, does not substantiate a crew water-consumption rate.
3. Keep units, location, instrument, time window, and uncertainty with real measurements when available.
4. Do not describe training triggers, simplified delays, or fictional thresholds as operational warnings or safety requirements.
5. If a value has no directly applicable source, label it **GAME MODEL** and explain its role instead of implying scientific validation.

See the [scientific sources](./scientific-sources.md) and the detailed [Arabic parameter catalog](./game-data-sources-ar.html).
