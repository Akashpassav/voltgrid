VoltGrid battery-model assumptions

2W pillion: 1.12× Wh/km for two occupants. This is a prototype engineering assumption representing added rider mass plus practical rolling/aerodynamic effects; it is not an OEM efficiency claim.

4W occupancy: 1.00×, 1.035×, 1.07×, 1.11× and 1.15× for 1–5 occupants. The curve keeps passenger-load impact explicit without pretending to be a learned model.

Cargo: 2.5 Wh/km per additional 100 kg, applied only to 4-wheelers. It is intentionally small and transparent.

Chemistry: LFP/NMC labels are seed-model assumptions where chemistry can vary by model year/variant. Do not present them as OEM-certified pack metadata.

Charge targets: NMC defaults are generally 80–86%; LFP defaults are 90%. These are planning defaults, not BMS limits. Comparative ageing research shows that chemistry and SOC/charging windows can change degradation behavior. See Journal of Power Sources (2025), DOI 10.1016/j.jpowsour.2025.237552, and Journal of Energy Storage (2017), DOI 10.1016/j.est.2017.07.004.