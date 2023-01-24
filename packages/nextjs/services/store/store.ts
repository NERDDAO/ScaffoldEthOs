import create from "zustand";
import { createTempSlice } from "~~/services/store/slices/tempSlice";
import { createEthPriceSlice } from "~~/services/store/slices/ethPriceSlice";
import { createFarmingPositionRequestSlice } from "~~/services/store/slices/farmingPositionRequestSlice";
import { TAppStore } from "~~/services/store/storeTypes";

// -----------------------
// Add those slices to the store
// -----------------------
export const useAppStore = create<TAppStore>()((...set) => ({
  tempSlice: createTempSlice(...set),
  ethPriceSlice: createEthPriceSlice(...set),
  farmingPositionRequestSlice: createFarmingPositionRequestSlice(...set),
}));
