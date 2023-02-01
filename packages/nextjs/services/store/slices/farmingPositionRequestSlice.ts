import { TAppSliceCreator, TAppStore } from "~~/services/store/storeTypes";

/* Create a store for the following data:
struct FarmingPositionRequest {
  uint256 setupIndex; // index of the chosen setup.
  uint256 amount0; // amount of main token or liquidity pool token.
  uint256 amount1; // amount of other token or liquidity pool token. Needed for gen2
  address positionOwner; // position extension or address(0) [msg.sender].
  uint256 amount0Min;
  uint256 amount1Min;
}
*/
//todo import BigNumber;
export type TFarmingPositionRequest = {
  setupIndex: number;
  amount0: number;
  amount1: number;
  positionOwner: string;
  amount0Min: number;
  amount1Min: number;
};

export const defaultFarmingPositionRequest = (): TFarmingPositionRequest => {
  return {
    setupIndex: 0,
    amount0: 0,
    amount1: 0,
    positionOwner: "0x0000000000000000000000000000000000000000",
    amount0Min: 0,
    amount1Min: 0,
  };
};

export type TFarmingPositionRequestSlice = {
  farmingPositionRequest: TFarmingPositionRequest;
  setFarmingPositionRequest: (newValue: TFarmingPositionRequest) => void;
};

export const createFarmingPositionRequestSlice: TAppSliceCreator<TFarmingPositionRequestSlice> = set => ({
  farmingPositionRequest: defaultFarmingPositionRequest(),
  setFarmingPositionRequest: (newValue: TFarmingPositionRequest): void =>
    set(
      (state): TAppStore => ({
        ...state,
        farmingPositionRequestSlice: {
          ...state.farmingPositionRequestSlice,
          farmingPositionRequest: newValue,
        },
      }),
    ),
});
