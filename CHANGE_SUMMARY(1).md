# Desired Battery Level — merge summary

- `src/components/trip/TripForm.tsx` — initializes the trip with the selected model's desired charge target; changing vehicle updates the model default. The user can still override the target per trip. Also exposes occupancy/cargo inputs required by the battery model.
- `src/lib/services/optimize.ts` — uses `vehicle.batteryProfile.desiredChargePercent` through `desiredChargePercent()` instead of the old global 80–88% heuristic when selecting charging departure SOC.
- `src/lib/__tests__/desired-battery.test.ts` — verifies different models have different defaults and that defaults stay inside their safe windows.

This workstream depends on the Battery Model files from Task 1 because the desired target is stored in `BatteryProfile`.
