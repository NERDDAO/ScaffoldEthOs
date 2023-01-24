import { StateCreator } from "zustand";
import { TempSlice } from "~~/services/store/slices/tempSlice";
import { TEthPriceSlice } from "~~/services/store/slices/ethPriceSlice";
import { TFarmingPositionRequestSlice } from "~~/services/store/slices/farmingPositionRequestSlice";

/**
 * The App store definition
 */
export type TAppStore = {
  tempSlice: TempSlice;
  ethPriceSlice: TEthPriceSlice;
  farmingPositionRequestSlice: TFarmingPositionRequestSlice;
  /**
   * Add more slices here
   */
};

/***
 * Helper to create slices
 */
export type TAppSliceCreator<TStateSlice> = StateCreator<TAppStore, [], [], TStateSlice>;
