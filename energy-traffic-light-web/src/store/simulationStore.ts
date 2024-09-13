import { createStore } from "solid-js/store";
import { fetchLoadData } from "../LoadGraph";

interface PowerLoadEntry {
  timestamp: number;
  Wert: number;
  is_peak: boolean;
}
const defaultStartTime = new Date("2024-09-10T18:00:00").getTime()

interface SimulationState {
  currentTime: number;
  gridPowerLoad: PowerLoadEntry[];
  householdPowerLoad: PowerLoadEntry[];
  allGridPowerLoad: PowerLoadEntry[];
  allHouseholdPowerLoad: PowerLoadEntry[];
  gridStatus: 'peak' | 'normal';
}

const [state, setState] = createStore<SimulationState>({
  currentTime: defaultStartTime,
  gridPowerLoad: [],
  householdPowerLoad: [],
  allGridPowerLoad: [],
  allHouseholdPowerLoad: [],
  gridStatus: 'normal',
});

const filterLast24Hours = (data: PowerLoadEntry[], currentTime: number): PowerLoadEntry[] => {
  const oneDayAgo = currentTime - 24 * 60 * 60 * 1000;
  return data.filter(entry => entry.timestamp * 1000 <= currentTime && entry.timestamp * 1000 > oneDayAgo);
};

export const simulationStore = {
  get state() {
    return state;
  },
  setCurrentTime(time: number) {
    console.log('here setCurrentTime', time)
    setState("currentTime", time);
    setState({
      gridPowerLoad: filterLast24Hours(state.allGridPowerLoad, time),
      householdPowerLoad: filterLast24Hours(state.allHouseholdPowerLoad, time),
    });
  },
  async initializeData() {
    let gridData = await fetchLoadData("grid");
    let householdData = await fetchLoadData("household");
  
    // Sort both datasets by timestamp in ascending order
    gridData = gridData.sort((a, b) => a.timestamp - b.timestamp);
    householdData = householdData.sort((a, b) => a.timestamp - b.timestamp);

    // Find the most recent timestamp available in both datasets
    const mostRecentOverlap = Math.min(
      gridData[gridData.length - 1].timestamp,
      householdData[householdData.length - 1].timestamp
    );

    // Find the index of the most recent overlap in gridData
    const gridCutoffIndex = gridData.findIndex(entry => entry.timestamp > mostRecentOverlap);
    const householdCutoffIndex = householdData.findIndex(entry => entry.timestamp > mostRecentOverlap);

    // Slice the arrays up to the cutoff indices (or keep all if no cutoff found)
    gridData = gridData.slice(0, gridCutoffIndex === -1 ? undefined : gridCutoffIndex);
    householdData = householdData.slice(0, householdCutoffIndex === -1 ? undefined : householdCutoffIndex);

    setState({
      currentTime: defaultStartTime, // Convert to milliseconds
      allGridPowerLoad: gridData,
      allHouseholdPowerLoad: householdData,
      gridPowerLoad: filterLast24Hours(gridData, defaultStartTime),
      householdPowerLoad: filterLast24Hours(householdData, defaultStartTime),
    });
  },
  updateGridStatus(isPeak: boolean) {
    setState("gridStatus", isPeak ? 'peak' : 'normal');
  },
};
