# Scientific sources and scope

This project uses references to explain space-science context. A cited source does not validate every game parameter or make the simulation suitable for mission planning.

## Data connected to the application

- **NASA CCMC DONKI CME catalog**: [DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/) and its [API reference](https://ccmc.gsfc.nasa.gov/DONKI/api/). Astra One displays a small sample of CME catalog observations. DONKI entries are research information, not operational forecasts or local lunar/Mars radiation measurements.
- **NOAA GOES solar proton data**: live data and scale references are linked in the application. The Earth-referenced observation is used as a training prompt only; it is not converted into local crew dose or health effects.

## Planetary and radiation context

- [NASA Moon facts](https://science.nasa.gov/moon/facts/)
- [NASA Mars facts](https://science.nasa.gov/mars/facts/)
- [Moon fact sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html)
- [Mars fact sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html)
- [Earth fact sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html)
- [NASA space radiation overview](https://www.nasa.gov/directorates/esdmd/hhp/space-radiation/)
- [Mars Science Laboratory cruise radiation study](https://doi.org/10.1126/science.1235989)
- [Curiosity Mars surface radiation study](https://doi.org/10.1126/science.1244797)
- [NASA NTRS record for the Curiosity surface study](https://ntrs.nasa.gov/citations/20180007641)

The linked radiation studies provide historical measurement context. The game’s specific radiation baselines, modifiers, and warning threshold have not been validated as universal forecasts, safety limits, or medical guidance.

## Food and life-support learning context

- [NASA Moon water and ice](https://science.nasa.gov/moon/moon-water-and-ices/) provides lunar-water context; it does not source the game’s per-person consumption rates or ISRU output.
- [Canadian Space Agency: food production on the Moon](https://www.asc-csa.gc.ca/eng/youth-educators/toolkits/food-production/) is an educational resource, not validation of the game greenhouse yield.
- [NASA Open Science Data Repository](https://osdr.nasa.gov/osdr/data/search?term=spaceflight%20bone%20density) and [RadLab](https://visualization.osdr.nasa.gov/radlab/gui/data-api/) provide study and instrument data. Those datasets are platform- and study-specific and are not interchangeable with Moon or Mars surface measurements.

## Full parameter inventory

The legacy [Arabic data-source catalog](./game-data-sources-ar.html) lists additional assumptions, values, and limitations referenced by the application.
