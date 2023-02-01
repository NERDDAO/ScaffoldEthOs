import {
  abi,
  blockchainCall,
  ethers,
  formatMoney,
  formatMoneyUniV3,
  formatNumber,
  fromDecimals,
  getEthereumPrice,
  getNetworkElement,
  getTokenPricesInDollarsOnCoingecko,
  isEthereumAddress,
  normalizeValue,
  numberToString,
  toDecimals,
  useEthosContext,
  useWeb3,
  VOID_ETHEREUM_ADDRESS,
  web3Utils,
} from "@ethereansos/interfaces-core";
import { Percent, Token } from "@uniswap/sdk-core/dist";
import {
  maxLiquidityForAmounts,
  nearestUsableTick,
  Pool,
  Position,
  TICK_SPACINGS,
  TickMath,
  tickToPrice,
} from "@uniswap/v3-sdk/dist/";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import style from "../all.module.css";
import EthereumIconLight from "../assets/images/ethereum-icon-light.svg";
import {
  addBlurToCustomBlock,
  comingSoon,
  customBlockBackgroundColor,
  customBlockIconBackgroundColor,
  customContractAddress,
  customIcon,
} from "../constants";
import { resolveToken } from "../logic/dualChain";
import { loadTokenFromAddress } from "../logic/erc20";
import { addLiquidityGen2, isValidPosition, loadFarmingPosition, loadFarmingSetup } from "../logic/farming";
import { dequeue, enqueue } from "../logic/interval";
import { getLogs } from "../logic/logger";
import { useOpenSea } from "../logic/uiUtilities";
import ActionAWeb3Button from "../Global/ActionAWeb3Button";
import OurCircularProgress from "../Global/OurCircularProgress";
import RegularButtonDuo from "../Global/RegularButtonDuo";
import TokenInputRegular from "../Global/TokenInputRegular";
import { useContract, useNetwork, useProvider, useContractRead } from "wagmi";

const MAX_UINT128 = "0x" + web3Utils.toBN(2).pow(web3Utils.toBN(128)).sub(web3Utils.toBN(1)).toString("hex");
const MAX_UINT256 = "0x" + web3Utils.toBN(2).pow(web3Utils.toBN(256)).sub(web3Utils.toBN(1)).toString("hex");

const contracts = [customContractAddress].map(web3Utils.toChecksumAddress);

// fetch the setup info from tempstate to the setup component using a variable called setupInput

export const SetupComponent = props => {
  const { element, setupInput, refresh, noInternalRefetch } = props;

  const context = useEthosContext();

  const seaport = useOpenSea();

  const web3Data = useWeb3();

  const { web3, account, chainId, newContract, block, dualChainId, dualBlock } = web3Data;

  const currentBlock = useMemo(() => parseInt(dualBlock || block), [block, dualBlock]);

  // use wagmi as ethersProvider
  const ethersProvider = useProvider();

  // general info and setup data
  // load setup from tempstate




  const [setupInfo, setSetupInfo] = useState(setupInput.setupInfo);
  const [activateLoading, setActivateLoading] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState();
  const [claimLoading, setClaimLoading] = useState();
  const [addLiqLoading, setAddLiqLoading] = useState();
  const [removeLiqLoading, setRemoveLiqLoading] = useState();
  const [withdrawAllLoading, setWithdrawAllLoading] = useState();

  const [increaseLiq, setIncreaseLiq] = useState();
  const [decreaseLiq, setDecreaseLiq] = useState();
  // panel status
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [showFreeTransfer, setShowFreeTransfer] = useState(false);
  const [canActivateSetup, setCanActivateSetup] = useState(false);
  const [setupReady, setSetupReady] = useState(false);
  const [showPrestoError, setShowPrestoError] = useState(false);
  // amm data
  const [AMM, setAMM] = useState({ name: "", version: "" });
  const [ammContract, setAmmContract] = useState(null);

  const [freeTransferAddress, setFreeTransferAddress] = useState("");
  const [extensionContract, setExtensionContract] = useState(null);
  const [farmTokenDecimals, setFarmTokenDecimals] = useState(18);
  const [farmTokenERC20Address, setFarmTokenERC20Address] = useState("");
  const [farmTokenSymbol, setFarmTokenSymbol] = useState("");
  const [farmTokenBalance, setFarmTokenBalance] = useState("0");
  const [farmTokenRes, setFarmTokenRes] = useState([]);
  const [setupTokens, setSetupTokens] = useState([]);
  const [tokenAmounts, setTokenAmounts] = useState([]);
  const [tokensApprovals, setTokensApprovals] = useState([]);
  const [lpTokenAmount, setLpTokenAmount] = useState(null);
  const [lockedEstimatedReward, setLockedEstimatedReward] = useState(0);
  const [freeEstimatedReward, setFreeEstimatedReward] = useState(0);
  const [lpTokenInfo, setLpTokenInfo] = useState(null);
  const [mainTokenInfo, setMainTokenInfo] = useState(null);
  const [rewardTokenInfo, setRewardTokenInfo] = useState(null);
  const [removalAmount, setRemovalAmount] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [manageStatus, setManageStatus] = useState(null);
  const [freeAvailableRewards, setFreeAvailableRewards] = useState(0);
  const [lockedPositions, setLockedPositions] = useState([]);
  const [lockedPositionStatuses, setLockedPositionStatuses] = useState([]);
  const [lockedPositionRewards, setLockedPositionRewards] = useState([]);
  const [updatedRewardPerBlock, setUpdatedRewardPerBlock] = useState(0);
  const [updatedRenewTimes, setUpdatedRenewTimes] = useState(0);
  const [receiver, setReceiver] = useState();
  const [apy, setApy] = useState(0);
  const [inputType, setInputType] = useState("add-pair");
  const [outputType, setOutputType] = useState("to-pair");
  const [ethAmount, setEthAmount] = useState(0);
  const [ethBalanceOf, setEthBalanceOf] = useState("0");
  const intervalId = useMemo(() => new Date().getTime() + "_" + new Date().getTime() * Math.random(), []);
  const updateAmountTimeout = useRef(null);
  const minimumStakingErrorTimeout = useRef(null);
  const [prestoData, setPrestoData] = useState(null);
  const [selectedAmmIndex, setSelectedAmmIndex] = useState(0);
  const [amms, setAmms] = useState(0);
  const [loadingPrestoData, setLoadingPrestoData] = useState(false);
  const [delayedBlock, setDelayedBlock] = useState(0);
  const [endBlockReached, setEndBlockReached] = useState(false);
  const [secondTokenIndex, setsecondTokenIndex] = useState(0);
  const [tickData, setTickData] = useState({ cursorNumber: 50 });
  const [hasSlippage, setHasSlippage] = useState(false);
  const [hasReceiver, setHasReceiver] = useState(false);

  const ethereumAddress = getNetworkElement({ context, chainId }, "wethTokenAddress");

  const [settings, setSettings] = useState(false);
  const [slippage, setSlippage] = useState(3);
  const [amountsMin, setAmountsMin] = useState(["0", "0"]);

  const [minimumStakingError, setMinimumStakingError] = useState();

  const [feeType, setFeeType] = useState("percentage");

  const [feeData, setFeeData] = useState();

  const [burnFeeAllowance, setBurnFeeAllowance] = useState();

  const [setupMustBeToggled, setSetupMustBeToggled] = useState();

  function onHasSlippageChange(e) {
    setHasSlippage(e.currentTarget.checked);
    setSlippage(3);
  }

  const ammAggregatorPromise = useMemo(
    () =>
      new Promise(async ok => {
        var amms = [];
        const ammAggregator = newContract(
          context.AMMAggregatorABI,
          getNetworkElement({ context, chainId }, "ammAggregatorAddress"),
        );
        const ammAddresses = (await ammAggregator.methods.amms().call()).map(web3Utils.toChecksumAddress);
        for (var address of ammAddresses) {
          const ammContract = newContract(context.AMMABI, address);
          const amm = {
            address,
            contract: ammContract,
            info: await ammContract.methods.info().call(),
            data: await ammContract.methods.data().call(),
          };
          amm.name = amm.info[0];
          amm.ethereumAddress = web3Utils.toChecksumAddress(amm.data[0]);
          amm.data[2] && amms.push(amm);
        }
        setSelectedAmmIndex(0);
        const uniswap = amms.filter(it => it.info[0] === "UniswapV2")[0];
        const index = amms.indexOf(uniswap);
        amms.splice(index, 1);
        amms.unshift(uniswap);
        ok({
          ammAggregator,
          amms,
        });
      }),
    [chainId],
  );

  function getFarmingPrestoAddress() {
    var prestoAddress = getNetworkElement({ context, chainId }, "farmingPrestoAddress");
    var oldPrestoAddress = getNetworkElement({ context, chainId }, "farmingPrestoAddressOld");
    var oldFarmingPrestoContracts = getNetworkElement({ context, chainId }, "oldFarmingPrestoContracts").map(it =>
      web3Utils.toChecksumAddress(it),
    );
    var lmContractAddress = web3Utils.toChecksumAddress(element.address);
    return oldFarmingPrestoContracts.indexOf(lmContractAddress) === -1 ? prestoAddress : oldPrestoAddress;
  }

  const farmingPresto = useMemo(() => newContract(context.FarmingPrestoABI, getFarmingPrestoAddress()), [chainId]);

  useEffect(
    () =>
      blockchainCall(element.contract.methods.initializer)
        .then(factoryAddress =>
          blockchainCall(newContract(context.EthereansFactoryABI, factoryAddress).methods.feeInfo),
        )
        .then(result => void (setFeeData(result), reloadData())),
    [],
  );

  useEffect(() => {
    updateEthAmount(ethAmount);
  }, [receiver, selectedAmmIndex]);

  useEffect(
    () => element.generation === "gen2" && calculateSlippageAmounts(slippage, lpTokenAmount).then(setAmountsMin),
    [element.generation, slippage, lpTokenAmount],
  );
  useEffect(() => {
    if (element.generation !== "gen1" || !tokenAmounts || tokenAmounts.length === 0) {
      return setAmountsMin(["0", "0"]);
    }
    const arr = [
      numberToString((parseInt(tokenAmounts[0].full || tokenAmounts[0]) * (100 - parseFloat(slippage))) / 100).split(
        ".",
      )[0],
      numberToString((parseInt(tokenAmounts[1].full || tokenAmounts[1]) * (100 - parseFloat(slippage))) / 100).split(
        ".",
      )[0],
    ];
    setAmountsMin(arr);
  }, [element.generation, tokenAmounts, slippage]);

  useEffect(
    () =>
      setTimeout(async () => {
        if (element.generation === "gen2") {
          try {
            var slot = await blockchainCall(lpTokenInfo.contract.methods.slot0);
            var a = formatNumber(
              tickToPrice(
                lpTokenInfo.uniswapTokens[0],
                lpTokenInfo.uniswapTokens[1],
                parseInt(setupInfo.tickLower),
              ).toSignificant(15),
            );
            var b = formatNumber(
              tickToPrice(
                lpTokenInfo.uniswapTokens[0],
                lpTokenInfo.uniswapTokens[1],
                parseInt(setupInfo.tickUpper),
              ).toSignificant(15),
            );
            var c = formatNumber(
              tickToPrice(
                lpTokenInfo.uniswapTokens[0],
                lpTokenInfo.uniswapTokens[1],
                parseInt(slot.tick),
              ).toSignificant(15),
            );
            var diluted = Math.abs(parseInt(setupInfo.tickUpper) - parseInt(setupInfo.tickLower)) >= 180000;
            var tickData = {
              diluted,
              maxPrice: tickToPrice(
                lpTokenInfo.uniswapTokens[1 - secondTokenIndex],
                lpTokenInfo.uniswapTokens[secondTokenIndex],
                parseInt(setupInfo.tickLower),
              ).toSignificant(4),
              minPrice: tickToPrice(
                lpTokenInfo.uniswapTokens[1 - secondTokenIndex],
                lpTokenInfo.uniswapTokens[secondTokenIndex],
                parseInt(setupInfo.tickUpper),
              ).toSignificant(4),
              currentPrice: tickToPrice(
                lpTokenInfo.uniswapTokens[1 - secondTokenIndex],
                lpTokenInfo.uniswapTokens[secondTokenIndex],
                parseInt(slot.tick),
              ).toSignificant(4),
              cursorNumber: !(c > a) ? 100 : !(c < b) ? 0 : null,
              outOfRangeLower: parseInt(slot.tick) <= parseInt(setupInfo.tickLower),
              outOfRangeUpper: parseInt(slot.tick) >= parseInt(setupInfo.tickUpper),
              tickLowerUSDPrice: 0,
              tickUpperUSDPrice: 0,
              tickCurrentUSDPrice: 0,
            };
            if (secondTokenIndex === 1) {
              var maxPrice = tickData.maxPrice;
              tickData.maxPrice = tickData.minPrice;
              tickData.minPrice = maxPrice;
            }
            if (tickData.cursorNumber !== 0 && tickData.cursorNumber !== 100) {
              tickData.cursorNumber = (1 / ((Math.sqrt(a * b) - Math.sqrt(b * c)) / (c - Math.sqrt(b * c)) + 1)) * 100;
            }
            tickData.cursor = formatMoneyUniV3(
              secondTokenIndex === 1 ? 100 - tickData.cursorNumber : tickData.cursorNumber,
              2,
            );

            var tokensForPrice = lpTokenInfo.uniswapTokens.map(it =>
              it.address === ethereumAddress ? VOID_ETHEREUM_ADDRESS : it.address,
            );
            var ethIndex = tokensForPrice.indexOf(VOID_ETHEREUM_ADDRESS);
            if (ethIndex !== -1) {
              var ethPrice = await getEthereumPrice({ context });
              tickData.tickLowerUSDPrice =
                formatNumber(
                  tickToPrice(
                    lpTokenInfo.uniswapTokens[1 - ethIndex],
                    lpTokenInfo.uniswapTokens[ethIndex],
                    parseInt(setupInfo.tickLower),
                  ).toSignificant(15),
                ) * ethPrice;
              tickData.tickUpperUSDPrice =
                formatNumber(
                  tickToPrice(
                    lpTokenInfo.uniswapTokens[1 - ethIndex],
                    lpTokenInfo.uniswapTokens[ethIndex],
                    parseInt(setupInfo.tickUpper),
                  ).toSignificant(15),
                ) * ethPrice;
              tickData.tickCurrentUSDPrice =
                formatNumber(
                  tickToPrice(
                    lpTokenInfo.uniswapTokens[1 - ethIndex],
                    lpTokenInfo.uniswapTokens[ethIndex],
                    parseInt(slot.tick),
                  ).toSignificant(15),
                ) * ethPrice;
              tickData.cursor = formatMoneyUniV3(
                ethIndex === 1 ? 100 - tickData.cursorNumber : tickData.cursorNumber,
                2,
              );
            }
            setTickData(tickData);
          } catch (e) {}
        }
      }),
    [lpTokenInfo, secondTokenIndex, setupInfo],
  );

  useEffect(() => {
    setReceiver();
    setMinimumStakingError();
  }, [open]);

  useEffect(() => {
    if (
      !open ||
      !setupInfo ||
      setupInfo.minStakeable === "0" ||
      !setupTokens ||
      setupTokens.length === 0 ||
      !tokenAmounts ||
      tokenAmounts.length === 0 ||
      (tokenAmounts.filter(it => parseInt(it.full || it) === 0).length === 2 &&
        minimumStakingError !== undefined &&
        minimumStakingError !== null)
    ) {
      return;
    }
    const index = setupTokens.indexOf(
      setupTokens.filter(
        it =>
          web3Utils.toChecksumAddress(it.address) ===
          web3Utils.toChecksumAddress(
            isWeth(setupInfo, setupInfo.mainTokenAddress) ? VOID_ETHEREUM_ADDRESS : setupInfo.mainTokenAddress,
          ),
      )[0],
    );

    const value = parseInt(tokenAmounts[index].full || tokenAmounts[index]);

    if (value < parseInt(setupInfo.minStakeable)) {
      if (minimumStakingError !== undefined && minimumStakingError !== null) {
        minimumStakingErrorTimeout.current && clearTimeout(minimumStakingErrorTimeout.current);
        setMinimumStakingError(
          `${setupTokens[index].symbol} value has been reset to the minimum amount of ${fromDecimals(
            setupInfo.minStakeable,
            setupTokens[index].decimals,
          )}`,
        );
        minimumStakingErrorTimeout.current = setTimeout(() => setMinimumStakingError(""), 2500);
      } else {
        setMinimumStakingError("");
      }
      return onUpdateTokenAmount(fromDecimals(setupInfo.minStakeable, setupTokens[index].decimals, true), index);
    }
  }, [setupTokens, setupInfo, tokenAmounts, open, minimumStakingError]);

  useEffect(() => {
    feeData &&
      !feeData.transferOrBurnTypeInApplication &&
      !feeData.transferOrBurnTypeInCreation &&
      setTimeout(async () => {
        const tokenToTransferOrBurnInApplication =
          feeData.tokenToTransferOrBurnAddressInApplication !== VOID_ETHEREUM_ADDRESS &&
          (await loadTokenFromAddress(
            { context, ...web3Data, seaport },
            feeData.tokenToTransferOrBurnAddressInApplication,
          ));
        const tokenToTransferOrBurnInCreation =
          feeData.tokenToTransferOrBurnAddressInCreation !== VOID_ETHEREUM_ADDRESS &&
          (await loadTokenFromAddress(
            { context, ...web3Data, seaport },
            feeData.tokenToTransferOrBurnAddressInCreation,
          ));
        const transferOrBurnTypeInApplication =
          feeData.transferOrBurnReceiverInApplication === VOID_ETHEREUM_ADDRESS ? "burn" : "transfer";
        const transferOrBurnTypeInCreation =
          feeData.transferOrBurnReceiverInCreation === VOID_ETHEREUM_ADDRESS ? "burn" : "transfer";
        setFeeData(oldValue => ({
          ...oldValue,
          tokenToTransferOrBurnInApplication,
          tokenToTransferOrBurnInCreation,
          transferOrBurnTypeInApplication,
          transferOrBurnTypeInCreation,
        }));
      });
  }, [feeData]);

  useEffect(() => {
    feeData && console.log("Fee data", feeData);
    feeType !== "burn" && setBurnFeeAllowance();
    feeData &&
      (feeData.transferOrBurnTypeInApplication || feeData.transferOrBurnTypeInCreation) &&
      feeData.tokenToTransferOrBurnAddressInApplication !== VOID_ETHEREUM_ADDRESS &&
      feeType === "burn" &&
      setTimeout(async () => {
        setBurnFeeAllowance(
          parseInt(
            await blockchainCall(
              feeData.tokenToTransferOrBurnInApplication.contract.methods.allowance,
              account,
              feeData.operator,
            ),
          ) < parseInt(feeData.transferOrBurnAmountInApplication),
        );
      });
  }, [feeData, feeType, account]);

  useEffect(setSettings, [open, edit, withdrawOpen]);

  const recalculateFeeAllowance = useCallback(() => {
    setupTokens &&
      setupTokens.length > 0 &&
      feeData &&
      (feeData.tokenToTransferOrBurnInApplication || feeData.tokenToTransferOrBurnInCreation) &&
      setTimeout(async () => {
        setFeeData(oldValue => ({
          ...oldValue,
          transferOrBurnAllowanceInCreation: undefined,
          transferOrBurnAllowanceInApplication: undefined,
        }));
        async function allowed(token, operator, account, amount) {
          if (!token || token.address === VOID_ETHEREUM_ADDRESS || amount === "0") {
            return true;
          }
          return (
            parseInt(amount) <= parseInt(await blockchainCall(token.contract.methods.allowance, operator, account))
          );
        }
        feeData.transferOrBurnAllowanceInCreation = await allowed(
          feeData.tokenToTransferOrBurnInCreation,
          feeData.operator,
          account,
          feeData.transferOrBurnAmountInCreation,
        );
        feeData.transferOrBurnAllowanceInApplication = await allowed(
          feeData.tokenToTransferOrBurnInCreation,
          feeData.operator,
          account,
          feeData.transferOrBurnAmountInApplication,
        );
        var { data } = await getTokenPricesInDollarsOnCoingecko(
          { context, web3Data },
          feeData.tokenToTransferOrBurnAddressInApplication,
        );
        data = data[feeData.tokenToTransferOrBurnAddressInApplication.toLowerCase()].usd;
        data *= parseFloat(
          fromDecimals(
            feeData.transferOrBurnAmountInApplication,
            feeData.tokenToTransferOrBurnInApplication.decimals,
            true,
          ),
        );
        const burnFeePrice = data;
        if (feeData.feePercentageForTransacted === "0") {
          return setFeeType("burn");
        }
        const events = await getLogs(web3.currentProvider, "eth_getLogs", {
          address: element.address,
          topics: [web3.utils.sha3("Transfer(uint256,address,address)"), [], [], abi.encode(["address"], [account])],
          fromBlock: web3Utils.toHex(getNetworkElement({ context, chainId }, "deploySearchStart")) || "0x0",
          toBlock: "latest",
        });
        var positionId = events.map(it => abi.decode(["uint256"], it.topics[1])[0].toString());
        try {
          positionId = positionId[positionId.length - 1];
          if (!positionId) {
            return;
          }
          const position = await loadFarmingPosition({ ...web3Data, context }, element.contract, positionId);
          const simulation = await simulateDecreaseLiquidityAndCollect(
            position.tokenId,
            element.address,
            position.liquidityPoolTokenAmount,
          );
          console.log({ simulation });
          var { data } = await getTokenPricesInDollarsOnCoingecko(
            { context, web3Data },
            setupTokens.map(it => it.address),
          );
          data = setupTokens.map(it => data[it.address.toLowerCase()].usd || data[it.address.toLowerCase()] || 0);
          data = data.map((it, i) => it * parseFloat(fromDecimals(simulation.fees[i], setupTokens[i].decimals, true)));
          data = data.reduce((acc, i) => acc + i, 0);
          if (data <= burnFeePrice) {
            return setFeeType("percentage");
          }
        } catch (e) {}
      });
  }, [feeData && feeData.transferOrBurnTypeInApplication, setupTokens, account]);

  useEffect(recalculateFeeAllowance, [recalculateFeeAllowance]);

  function toggleSetup() {
    return blockchainCall(element.contract.methods.toggleSetup, setup.infoIndex);
  }

  const loadData = useCallback(
    async (farmSetup, farmSetupInfo, reset, loop) => {
      var position = null;
      var lockPositions = [];
      reset && setLockedEstimatedReward(0);
      setUpdatedRenewTimes(farmSetupInfo.renewTimes);
      setUpdatedRewardPerBlock(farmSetup.rewardPerBlock);
      var positions = element.positions || [];
      var positionIds = positions.map(it => it.positionId);
      if (positions.length === 0) {
        const events = await getLogs(web3.currentProvider, "eth_getLogs", {
          address: element.address,
          topics: [web3.utils.sha3("Transfer(uint256,address,address)"), [], [], abi.encode(["address"], [account])],
          fromBlock: web3Utils.toHex(getNetworkElement({ context, chainId }, "deploySearchStart")) || "0x0",
          toBlock: "latest",
        });
        positionIds = events.map(it => abi.decode(["uint256"], it.topics[1])[0].toString());
      }
      for (const positionId of positionIds) {
        var pos =
          positions.filter(it => it.positionId === positionId)[0] ||
          (await loadFarmingPosition({ ...web3Data, context }, element.contract, positionId));
        if (!positions.filter(it => it.positionId === positionId)[0]) {
          var { 0: loadedSetup, 1: loadedSetupInfo } = await loadFarmingSetup(
            { ...web3Data, context },
            element.contract,
            pos.setupIndex,
          );
          loadedSetupInfo = { ...loadedSetupInfo };
          loadedSetup = { ...loadedSetup, setupIndex: pos.setupIndex, setupInfo: { ...loadedSetupInfo } };
          pos = { ...pos, positionId, setup: { ...loadedSetup } };
        }
        if (
          isValidPosition({ ...web3Data, context }, pos) &&
          parseInt(pos.setup.setupIndex) === parseInt(setup.setupIndex)
        ) {
          if (farmSetupInfo.free) {
            position = { ...pos, positionId };
          } else if (!positionIds.includes(positionId)) {
            lockPositions.push({ ...pos, positionId });
          }
        }
      }
      setSetupMustBeToggled(
        farmSetup.active &&
          parseInt(currentBlock) > parseInt(farmSetup.endBlock) &&
          (parseInt(farmSetup.totalSupply) === 0 || position === undefined || position === null) &&
          parseInt(farmSetupInfo.renewTimes) > 0,
      );
      setCurrentPosition(position);
      setLockedPositions(lockPositions);
      // if (!position && reset) {
      //     setOpen(false)
      //     setWithdrawOpen(false)
      // }
      !extensionContract && setExtensionContract(element.extensionContract);
      const rewardToken =
        rewardTokenInfo ||
        (await loadTokenFromAddress(
          { context, ...web3Data, seaport },
          await blockchainCall(element.contract.methods._rewardTokenAddress),
        ));
      const rewardTokenApproval = await blockchainCall(
        rewardToken.contract.methods.allowance,
        account,
        element.address,
      );
      setRewardTokenInfo(oldValue => ({
        ...oldValue,
        ...rewardToken,
        approval: parseInt(rewardTokenApproval) !== 0 && parseInt(rewardTokenApproval) >= parseInt(rewardToken.balance),
      }));

      const tokenAddress = farmSetupInfo.liquidityPoolTokenAddress;
      const lpToken = newContract(context.UniswapV3PoolABI, tokenAddress);

      if (!loop) {
        if (element.generation === "gen1") {
          const lpToken = newContract(context.ERC20ABI, farmSetupInfo.liquidityPoolTokenAddress);
          const lpTokenSymbol = await lpToken.methods.symbol().call();
          const lpTokenDecimals = await lpToken.methods.decimals().call();
          const lpTokenBalance = await lpToken.methods.balanceOf(account).call();
          const lpTokenApproval = await lpToken.methods.allowance(account, element.contract.options.address).call();

          const info = await blockchainCall(
            (
              await ammAggregatorPromise
            ).ammAggregator.methods.findByLiquidityPool,
            tokenAddress,
          );

          const ammAggregatorAddress = web3Utils.toChecksumAddress(info[3]);
          const amms = (await ammAggregatorPromise).amms;
          const amm = amms.filter(it => it.address === ammAggregatorAddress)[0];

          const originalTokenAddresses = info[2].map(web3Utils.toChecksumAddress);
          const tokenAddresses = originalTokenAddresses.map(it =>
            farmSetupInfo.involvingETH && it === amm.ethereumAddress ? VOID_ETHEREUM_ADDRESS : it,
          );
          const tokens = await Promise.all(
            tokenAddresses.map(it => loadTokenFromAddress({ context, ...web3Data, seaport }, it)),
          );

          const tokenValues = (
            await blockchainCall(
              amm.contract.methods.byLiquidityPoolAmount,
              farmSetupInfo.liquidityPoolTokenAddress,
              farmSetup.totalSupply,
            )
          )[0];

          setLpTokenInfo({
            originalTokenAddresses,
            tokenAddresses,
            tokens,
            tokenValues,
            amm,
            contract: lpToken,
            symbol: lpTokenSymbol,
            decimals: lpTokenDecimals,
            balance: lpTokenBalance,
            approval: parseInt(lpTokenApproval) !== 0 && parseInt(lpTokenApproval) >= parseInt(lpTokenBalance),
          });
        } else {
          const lpTokenSymbol = "UniV3";
          const lpTokenDecimals = "18";
          const lpTokenBalance = "0";
          const lpTokenApproval = "0";
          const fee = await blockchainCall(lpToken.methods.fee);
          const slot = await blockchainCall(lpToken.methods.slot0);
          var uniswapTokens = await Promise.all(
            [await blockchainCall(lpToken.methods.token0), await blockchainCall(lpToken.methods.token1)].map(
              async tkAddress => {
                const currentToken = await loadTokenFromAddress({ context, ...web3Data, seaport }, tkAddress);
                return new Token(
                  chainId,
                  tkAddress,
                  parseInt(currentToken.decimals),
                  currentToken.symbol,
                  currentToken.name,
                );
              },
            ),
          );
          console.log("Slot", farmSetup.infoIndex, {
            tick: slot.tick,
            sqrtPriceX96: slot.sqrtPriceX96,
            tickLower: farmSetupInfo.tickLower,
            tickUpper: farmSetupInfo.tickUpper,
            fee,
            inRange:
              parseInt(farmSetupInfo.tickLower) >= parseInt(slot.tick) &&
              parseInt(slot.tick) <= parseInt(farmSetupInfo.tickUpper),
          });
          setLpTokenInfo({
            uniswapTokens,
            fee,
            contract: lpToken,
            symbol: lpTokenSymbol,
            decimals: lpTokenDecimals,
            balance: lpTokenBalance,
            approval: parseInt(lpTokenApproval) !== 0 && parseInt(lpTokenApproval) >= parseInt(lpTokenBalance),
          });
        }
      }
      const activateSetup =
        parseInt(farmSetupInfo.renewTimes) > 0 &&
        !farmSetup.active &&
        parseInt(farmSetupInfo.lastSetupIndex) === parseInt(setup.setupIndex);
      setCanActivateSetup(activateSetup);
      var startBlock = formatNumber(farmSetupInfo.startBlock || 0);
      setDelayedBlock(currentBlock > startBlock ? 0 : startBlock);

      setEndBlockReached(currentBlock > formatNumber(farmSetup.endBlock));

      if (!loop) {
        const extensionBalance = await blockchainCall(rewardToken.contract.methods.balanceOf, element.extensionAddress);
        const isSetupReady =
          element.byMint ||
          parseInt(extensionBalance) >= parseInt(farmSetup.rewardPerBlock) * parseInt(farmSetupInfo.blockDuration);
        setSetupReady(isSetupReady);
      }

      var balances = ["0", "0"];
      var fees = ["0", "0"];
      if (element.generation === "gen2") {
        try {
          ({ balances, fees } = await simulateDecreaseLiquidityAndCollect(farmSetup.objectId, element.address));
        } catch (e) {
          if (farmSetup.totalSupply !== "0") {
            try {
              const lpTokenEthers = new ethers.Contract(tokenAddress, context.UniswapV3PoolABI, ethersProvider);
              var data = await lpTokenEthers.callStatic.burn(
                farmSetupInfo.tickLower,
                farmSetupInfo.tickUpper,
                farmSetup.totalSupply,
                {
                  from: getNetworkElement({ context, chainId }, "uniswapV3NonfungiblePositionManagerAddress"),
                },
              );
              balances = [data.amount0.toString(), data.amount1.toString()];
            } catch (e) {
              console.log(e);
            }
          }
        }
      }
      if (element.generation === "gen1" && lpTokenInfo) {
        balances = lpTokenInfo.tokenValues;
      }
      const tokens = [...setupTokens];
      if (tokens.length === 0) {
        const liquidityPoolTokens =
          element.generation === "gen2"
            ? await Promise.all([blockchainCall(lpToken.methods.token0), blockchainCall(lpToken.methods.token1)])
            : (
                await blockchainCall(
                  (
                    await ammAggregatorPromise
                  ).ammAggregator.methods.findByLiquidityPool,
                  tokenAddress,
                )
              )[2];
        for (var i in liquidityPoolTokens) {
          const address = liquidityPoolTokens[i];
          const token = await loadTokenFromAddress(
            { context, ...web3Data, seaport },
            isWeth(farmSetupInfo, address) ? VOID_ETHEREUM_ADDRESS : address,
          );
          tokens.push(token);
        }
        setSetupTokens(oldValue => (oldValue && oldValue.length > 0 && oldValue) || tokens);
      }

      const approvals = [];
      for (const i in tokens) {
        const token = tokens[i];
        token.balance = await blockchainCall(token.contract.methods.balanceOf, account);
        token.liquidity = balances[i];
        const approval = await blockchainCall(token.contract.methods.allowance, account, element.address);
        approvals.push(parseInt(approval) !== 0 && (parseInt(approval) >= parseInt(token.balance) || !token));
        if (
          web3Utils.toChecksumAddress(token.address) === web3Utils.toChecksumAddress(farmSetupInfo.mainTokenAddress) ||
          (web3Utils.toChecksumAddress(token.address) === VOID_ETHEREUM_ADDRESS &&
            web3Utils.toChecksumAddress(farmSetupInfo.mainTokenAddress) ===
              web3Utils.toChecksumAddress(farmSetupInfo.ethereumAddress))
        ) {
          setMainTokenInfo(oldValue => ({
            ...oldValue,
            ...token,
            approval: parseInt(approval) !== 0 && (parseInt(approval) >= parseInt(token.balance) || !token),
          }));
        }
      }

      setTokensApprovals(approvals);

      reset && setLpTokenAmount(null);
      reset && set(new Array(tokens.length).fill(0));

      // retrieve the manage data using the position
      if (position) {
        const free = position["free"];
        const creationBlock = position["creationBlock"];
        const positionSetupIndex = position["setupIndex"];
        const liquidityPoolTokenAmount = position["liquidityPoolTokenAmount"];
        const amounts = {
          tokenAmounts: [0, 0],
        };
        var additionalFees = ["0", "0"];
        try {
          var simulation = await simulateDecreaseLiquidityAndCollect(
            position.tokenId || farmSetup.objectId,
            element.address,
            position.liquidityPoolTokenAmount,
          );
          amounts.tokenAmounts = simulation.liquidity;
          additionalFees = simulation.fees;
        } catch (e) {}
        if (element.generation === "gen1") {
          const amm = (await ammAggregatorPromise).amms.filter(
            it => web3Utils.toChecksumAddress(it.address) === web3Utils.toChecksumAddress(setupInfo.ammPlugin),
          )[0];
          const result = await blockchainCall(
            amm.contract.methods.byLiquidityPoolAmount,
            setupInfo.liquidityPoolTokenAddress,
            position.liquidityPoolTokenAmount,
          );
          amounts.tokenAmounts = result[0];
        }
        console.log(position.positionId);
        const availableReward = await blockchainCall(
          element.contract.methods.calculateFreeFarmingReward,
          position.positionId,
          true,
        );
        var freeReward = parseInt(availableReward);
        if (currentBlock < parseInt(farmSetup.endBlock)) {
          freeReward +=
            parseInt(farmSetup.rewardPerBlock) *
            (parseInt(position.liquidityPoolTokenAmount) / parseInt(farmSetup.totalSupply));
        }
        freeReward = numberToString(freeReward).split(".")[0];
        setFreeAvailableRewards(freeReward);
        try {
          var result = await blockchainCall(
            element.contract.methods.calculateTradingFees,
            position.positionId,
            freeReward,
            fees[0],
            fees[1],
          );
          additionalFees = [result[0], result[1]];
        } catch (e) {}
        var withdrawOnly = !farmSetup.active || currentBlock > parseInt(farmSetup.endBlock);
        setManageStatus({
          withdrawOnly,
          additionalFees,
          free,
          creationBlock,
          positionSetupIndex,
          liquidityPoolAmount: liquidityPoolTokenAmount,
          tokenAmounts: amounts["tokenAmounts"],
          tokens,
        });
      }
      // calculate APY
      setApy(await calculateApy(farmSetup, farmSetupInfo, rewardToken.address, rewardToken.decimals, tokens));
    },
    [setupTokens, account, currentBlock],
  );

  const reloadData = useCallback(
    async (noReset, loop) => {
      try {
        var { 0: farmSetup, 1: farmSetupInfo } = await loadFarmingSetup(
          { ...web3Data, context },
          element.contract,
          setup.setupIndex,
        );
        farmSetupInfo = {
          ...farmSetupInfo,
          free: true,
          ethereumAddress: getNetworkElement({ context, chainId }, "wethTokenAddress"),
        };
        farmSetup = { ...farmSetup, togglable: farmSetup.active && currentBlock > parseInt(farmSetup.endBlock) };
        farmSetup.setupIndex = setup.setupIndex;
        farmSetup.setupInfo = farmSetupInfo;
        setSetup(farmSetup);
        setSetupInfo(farmSetupInfo);
        setShowPrestoError(false);
        await loadData(farmSetup, farmSetupInfo, !noReset, loop);
      } catch (e) {
        console.log(e);
      }
    },
    [element.address, setup && setup.setupIndex, loadData],
  );

  useEffect(() => {
    dequeue(intervalId);
    if (noInternalRefetch || !setupTokens || setupTokens.length === 0) {
      return;
    }
    enqueue(intervalId, () => reloadData(true, true));
    return () => dequeue(intervalId);
  }, [noInternalRefetch, reloadData, setupTokens]);

  async function simulateDecreaseLiquidityAndCollect(objectId, lmContractAddress, amount) {
    var nftPosMan = newContract(
      context.UniswapV3NonfungiblePositionManagerABI,
      getNetworkElement({ context, chainId }, "uniswapV3NonfungiblePositionManagerAddress"),
    );
    var bytes = [
      nftPosMan.methods
        .decreaseLiquidity({
          tokenId: objectId,
          liquidity: amount || (await blockchainCall(nftPosMan.methods.positions, objectId)).liquidity,
          amount0Min: 0,
          amount1Min: 0,
          deadline: new Date().getTime() + 10000,
        })
        .encodeABI(),
      nftPosMan.methods
        .collect({
          tokenId: objectId,
          recipient: lmContractAddress,
          amount0Max: MAX_UINT128,
          amount1Max: MAX_UINT128,
        })
        .encodeABI(),
    ];
    var result = await nftPosMan.methods.multicall(bytes).call({
      from: lmContractAddress,
    });
    var liquidity = web3.eth.abi.decodeParameters(["uint128", "uint128"], result[0]);
    var balances = web3.eth.abi.decodeParameters(["uint128", "uint128"], result[1]);
    var fees = [
      web3Utils.toBN(balances[0]).sub(web3Utils.toBN(liquidity[0])).toString(),
      web3Utils.toBN(balances[1]).sub(web3Utils.toBN(liquidity[1])).toString(),
    ];
    return {
      liquidity,
      balances,
      fees,
    };
  }

  const calculateApy = async (setup, setupInfo, rewardTokenAddress, rewardTokenDecimals, setupTokens) => {
    if (parseInt(setup.totalSupply) === 0) return -1;
    const yearlyBlocks = 2304000;
    try {
      const ethPrice = await getEthereumPrice({ context });
      const wusdAddress = getNetworkElement({ context, chainId }, "WUSDAddress") || "";
      const realRewardTokenAddress = await resolveToken({ context, ...web3Data }, rewardTokenAddress);
      const realSetupTokens = await Promise.all(
        setupTokens.map(it => resolveToken({ context, ...web3Data }, { ...it })),
      );
      if (setupInfo.free) {
        const searchTokens = [realRewardTokenAddress, ...realSetupTokens.map(it => it.address || it)]
          .filter(it => it)
          .map(web3Utils.toChecksumAddress)
          .filter((it, i, arr) => arr.indexOf(it) === i);
        const res = await getTokenPricesInDollarsOnCoingecko({ context, web3Data }, searchTokens, {
          tickToPrice,
          Token,
          Pool,
          Position,
          nearestUsableTick,
          TICK_SPACINGS,
          TickMath,
          maxLiquidityForAmounts,
        });
        const { data } = res;
        const rewardTokenPriceUsd =
          realRewardTokenAddress !== VOID_ETHEREUM_ADDRESS
            ? realRewardTokenAddress.toLowerCase() === wusdAddress.toLowerCase()
              ? 1
              : data[realRewardTokenAddress.toLowerCase()].usd
            : ethPrice;
        var den = 0;
        await Promise.all(
          realSetupTokens.map(async token => {
            if (token && token.address) {
              const tokenPrice =
                token.address !== VOID_ETHEREUM_ADDRESS
                  ? token.address.toLowerCase() === wusdAddress.toLowerCase()
                    ? 1
                    : data[token.address.toLowerCase()].usd
                  : ethPrice;
              den += tokenPrice * token.liquidity * 10 ** (18 - token.decimals);
            }
          }),
        );
        const num =
          parseInt(setup.rewardPerBlock) * 10 ** (18 - rewardTokenDecimals) * yearlyBlocks * rewardTokenPriceUsd;
        return (num * 100) / den;
      } else {
        const { mainTokenAddress } = setupInfo;
        const mainTokenContract =
          mainTokenAddress !== VOID_ETHEREUM_ADDRESS ? newContract(context.ERC20ABI, mainTokenAddress) : null;
        const decimals =
          mainTokenAddress !== VOID_ETHEREUM_ADDRESS ? await blockchainCall(mainTokenContract.methods.decimals) : 18;
        const searchTokens = `${rewardTokenAddress},${mainTokenAddress}`;
        const res = await getTokenPricesInDollarsOnCoingecko({ context, web3Data }, searchTokens);
        const { data } = res;
        const rewardTokenPriceUsd =
          rewardTokenAddress !== VOID_ETHEREUM_ADDRESS
            ? rewardTokenAddress.toLowerCase() === wusdAddress.toLowerCase()
              ? 1
              : data[rewardTokenAddress.toLowerCase()].usd
            : ethPrice;
        const mainTokenPriceUsd =
          mainTokenAddress !== VOID_ETHEREUM_ADDRESS
            ? mainTokenAddress.toLowerCase() === wusdAddress.toLowerCase()
              ? 1
              : data[mainTokenAddress.toLowerCase()].usd
            : ethPrice;
        const num =
          parseInt(setup.rewardPerBlock) * 10 ** (18 - rewardTokenDecimals) * yearlyBlocks * rewardTokenPriceUsd * 100;
        const den = parseInt(setupInfo.maxStakeable) * 10 ** (18 - decimals) * mainTokenPriceUsd * 2;
        return num / den;
      }
    } catch (error) {
      return 0;
    }
  };

  const isWeth = (setupInfo, address) => {
    return address.toLowerCase() === ethereumAddress.toLowerCase() && setupInfo.involvingETH;
  };

  const getPeriodFromDuration = duration => {
    const blockIntervals = context.blockIntervals;
    const inv = Object.entries(blockIntervals).reduce((ret, entry) => {
      const [key, value] = entry;
      ret[value] = key;
      return ret;
    }, {});
    return inv[duration];
  };

  const activateSetup = async () => {
    if (!setupReady) return;
    setActivateLoading(true);
    try {
      await blockchainCall(element.contract.methods.activateSetup, setup.infoIndex);
      await reloadData();
    } catch (error) {
      console.log(error);
    } finally {
      setActivateLoading(false);
    }
  };

  const onTokenApproval = (index, isLp) => {
    if (isLp) {
      setLpTokenInfo({ ...lpTokenInfo, approval: true });
      return;
    }
    setTokensApprovals(tokensApprovals.map((val, i) => (i === index ? true : val)));
    try {
      if (setupInfo.minStakeable !== "0") {
        const index = setupTokens.indexOf(
          setupTokens.filter(
            it =>
              web3Utils.toChecksumAddress(it.address) ===
              web3Utils.toChecksumAddress(
                isWeth(setupInfo, setupInfo.mainTokenAddress) ? VOID_ETHEREUM_ADDRESS : setupInfo.mainTokenAddress,
              ),
          )[0],
        );
        onUpdateTokenAmount(fromDecimals(setupInfo.minStakeable, setupTokens[index].decimals, true), index);
      }
    } catch (e) {}
  };

  async function calculateSlippageAmounts(slippage, liquidity, type) {
    if (slippage == 0) {
      return ["0", "0"];
    }
    if (element.generation === "gen1") {
      const amm = (await ammAggregatorPromise).amms.filter(
        it => web3Utils.toChecksumAddress(it.address) === web3Utils.toChecksumAddress(setupInfo.ammPlugin),
      )[0];
      const result = [
        ...(
          await blockchainCall(
            amm.contract.methods.byLiquidityPoolAmount,
            setupInfo.liquidityPoolTokenAddress,
            liquidity,
          )
        )[0],
      ];
      result[0] = numberToString(parseInt(result[0]) * (1 - slippage / 100)).split(".")[0];
      result[1] = numberToString(parseInt(result[1]) * (1 - slippage / 100)).split(".")[0];
      return result;
    }
    try {
      var toler = new Percent(slippage, 100);
      const partialPosition = new Position({
        pool: await createPool(liquidity),
        liquidity,
        tickLower: parseInt(setupInfo.tickLower),
        tickUpper: parseInt(setupInfo.tickUpper),
      });
      var { amount0: amount0Min, amount1: amount1Min } = partialPosition[`${type || "mint"}AmountsWithSlippage`](toler);
      amount0Min = amount0Min.toString().split(".")[0];
      amount1Min = amount1Min.toString().split(".")[0];
      return [
        {
          full: amount0Min,
          value: fromDecimals(amount0Min, setupTokens[0].decimals, true),
        },
        {
          full: amount1Min,
          value: fromDecimals(amount1Min, setupTokens[1].decimals, true),
        },
      ];
    } catch (e) {
      return ["0", "0"];
    }
  }

  async function createPool(liquidity) {
    liquidity = liquidity || 0;
    var slot0 = await blockchainCall(lpTokenInfo.contract.methods.slot0);
    var tick = nearestUsableTick(parseInt(slot0.tick), TICK_SPACINGS[lpTokenInfo.fee]);
    var sqrtPriceX96 = TickMath.getSqrtRatioAtTick(tick).toString();
    var pool;
    try {
      pool = new Pool(
        lpTokenInfo.uniswapTokens[0],
        lpTokenInfo.uniswapTokens[1],
        parseInt(lpTokenInfo.fee),
        parseInt(sqrtPriceX96),
        liquidity,
        tick,
      );
    } catch (e) {
      try {
        pool = new Pool(
          lpTokenInfo.uniswapTokens[0],
          lpTokenInfo.uniswapTokens[1],
          parseInt(lpTokenInfo.fee),
          parseInt(slot0.sqrtPriceX96),
          liquidity,
          parseInt(slot0.tick),
        );
      } catch (e) {}
    }
    return pool;
  }

  function onUpdateTokenAmount(value, index, isFull) {
    if (value === undefined || value === null || !value) {
      value = "0";
    }
    var tks = tokenAmounts.map(it => it);
    if (value.indexOf(".") !== -1 && value.split(".")[1].length > 18) {
      value = value.split(".");
      value[1] = value[1].substring(0, 18);
      value = value.join(".");
    }
    const fullValue = isFull ? value : toDecimals(value, setupTokens[index].decimals);
    tks[index] = {
      value: isFull ? fromDecimals(value, setupTokens[index].decimals, true) : value,
      full: fullValue,
    };
    //isFull && setTokenAmounts(tks.map(it => it))
    if (fromDecimals(fullValue, setupTokens[index].decimals, true) === numberToString(tokenAmounts[index].value || 0)) {
      return;
    }
    setLpTokenAmount(null);
    updateAmountTimeout.current && clearTimeout(updateAmountTimeout.current);
    if (!value) {
      setLockedEstimatedReward(0);
      setFreeEstimatedReward(0);
      //setTokenAmounts(tokenAmounts.map(() => 0))
      return;
    }
    updateAmountTimeout.current = setTimeout(async function () {
      var liquidityPoolAmount;
      var surplus = 0;
      async function elaborateValue() {
        var currentIndex = parseInt(index);
        var val = fullValue;
        if (arguments.length === 2) {
          val = tks[(currentIndex = 1 - currentIndex)].full;
        }
        var tokenAddress = setupTokens[currentIndex].address;
        if (element.generation === "gen1") {
          tokenAddress = lpTokenInfo.originalTokenAddresses[currentIndex];
          const ammContract = lpTokenInfo.amm.contract;
          var result = await blockchainCall(
            ammContract.methods.byTokenAmount,
            setupInfo.liquidityPoolTokenAddress,
            tokenAddress,
            val.ethereansosAdd(surplus),
          );
          liquidityPoolAmount = result.liquidityPoolAmount;
          result = await blockchainCall(
            ammContract.methods.byLiquidityPoolAmount,
            setupInfo.liquidityPoolTokenAddress,
            liquidityPoolAmount,
          );
          var ams = result.tokensAmounts;
          if (fullValue !== ams[index] && setupTokens[index].decimals !== "18") {
            result = await blockchainCall(
              ammContract.methods.byTokenAmount,
              setupInfo.liquidityPoolTokenAddress,
              tokenAddress,
              ams[index],
            );
            liquidityPoolAmount = result.liquidityPoolAmount;
            ams = result.tokensAmounts;
          }
          tks[0] = {
            value: index === 0 && !isFull ? value : fromDecimals(ams[0], setupTokens[0].decimals, true),
            full: ams[0],
          };
          tks[1] = {
            value: index === 1 && !isFull ? value : fromDecimals(ams[1], setupTokens[1].decimals, true),
            full: ams[1],
          };
        } else {
          tokenAddress = tokenAddress === VOID_ETHEREUM_ADDRESS ? ethereumAddress : tokenAddress;
          var pool = await createPool();
          var fromAmountData = {
            pool,
            tickLower: parseInt(setupInfo.tickLower),
            tickUpper: parseInt(setupInfo.tickUpper),
            useFullPrecision: false,
          };
          fromAmountData[`amount${currentIndex}`] = formatNumber(val) + surplus;
          var pos = Position[`fromAmount${currentIndex}`](fromAmountData);
          liquidityPoolAmount = pos.liquidity.toString();

          if (setup.objectId && setup.objectId !== "0") {
            var amount0 = pos.amount0.toSignificant(18);
            amount0 === "0" &&
              tickData.cursorNumber !== 0 &&
              tickData.cursorNumber !== 100 &&
              (amount0 = fromDecimals("1", setupTokens[0].decimals, true));

            var amount1 = pos.amount1.toSignificant(18);
            amount1 === "0" &&
              tickData.cursorNumber !== 0 &&
              tickData.cursorNumber !== 100 &&
              (amount1 = fromDecimals("1", setupTokens[1].decimals, true));
            tks[0] = {
              value: index === 0 && !isFull ? value : numberToString(amount0),
              full: toDecimals(numberToString(amount0), setupTokens[0].decimals),
            };
            tks[1] = {
              value: index === 1 && !isFull ? value : numberToString(amount1),
              full: toDecimals(numberToString(amount1), setupTokens[1].decimals),
            };
          } else {
            pos = pos.mintAmounts;
            tks[0] = {
              value:
                index === 0 && !isFull ? value : fromDecimals(pos.amount0.toString(), setupTokens[0].decimals, true),
              full: pos.amount0.toString(),
            };
            tks[1] = {
              value:
                index === 1 && !isFull ? value : fromDecimals(pos.amount1.toString(), setupTokens[1].decimals, true),
              full: pos.amount1.toString(),
            };
          }
        }
      }
      await elaborateValue();
      while (web3Utils.toBN(tks[index].full).lt(web3Utils.toBN(fullValue))) {
        await elaborateValue((surplus += 999999));
      }
      const balance =
        setupTokens[index].address === VOID_ETHEREUM_ADDRESS
          ? await web3.eth.getBalance(account)
          : await blockchainCall(setupTokens[index].contract.methods.balanceOf, account);
      if (parseInt(fullValue) === parseInt(balance)) {
        tks[index].full = balance;
      }
      const mainTokenIndex = setupTokens.indexOf(
        setupTokens.filter(
          it =>
            web3Utils.toChecksumAddress(it.address) ===
            web3Utils.toChecksumAddress(
              isWeth(setupInfo, setupInfo.mainTokenAddress) ? VOID_ETHEREUM_ADDRESS : setupInfo.mainTokenAddress,
            ),
        )[0],
      );
      while (
        element.generation === "gen2" &&
        setupInfo.minStakeable !== "0" &&
        index === mainTokenIndex &&
        parseInt(tks[index].full) >= parseInt(setupInfo.minStakeable) &&
        !(await addLiquidity({ test: true, tokenAmounts: tks, lpTokenAmount: liquidityPoolAmount }))
      ) {
        await elaborateValue((surplus += 999999), true);
      }
      tickData &&
        tickData.cursorNumber === 0 &&
        (tks[0] = {
          value: "0",
          full: "0",
        });
      tickData &&
        tickData.cursorNumber === 100 &&
        (tks[1] = {
          value: "0",
          full: "0",
        });
      setTokenAmounts(tks.map(it => it));
      setLpTokenAmount(liquidityPoolAmount);
      if (parseInt(setup.totalSupply) + parseInt(liquidityPoolAmount) > 0) {
        var val =
          (parseInt(liquidityPoolAmount) * 6400 * parseInt(setup.rewardPerBlock)) /
          (parseInt(setup.totalSupply) + parseInt(liquidityPoolAmount));
        val = numberToString(val).split(".")[0];
        if (!isNaN(val)) {
          setFreeEstimatedReward(fromDecimals(val, rewardTokenInfo.decimals));
        }
      }
    }, 300);
  }

  const onUpdateLpTokenAmount = async (value, index, isFull) => {
    updateAmountTimeout.current && clearTimeout(updateAmountTimeout.current);
    if (!value || value === "NaN") {
      setLockedEstimatedReward(0);
      setFreeEstimatedReward(0);
      // setLpTokenAmount("0")
      return;
    }
    updateAmountTimeout.current = setTimeout(async function () {
      try {
        const fullValue = isFull ? value : fromDecimals(value, lpTokenInfo.decimals);
        setLpTokenAmount({ value: numberToString(value), full: fullValue });
        const result = await blockchainCall(
          ammContract.methods.byLiquidityPoolAmount,
          setupInfo.liquidityPoolTokenAddress,
          fullValue,
        );
        const ams = result.tokenAmounts;
        setTokenAmounts(ams);
        if (!setupInfo.free) {
          var mainTokenIndex = 0;
          await setupTokens.map((t, i) => {
            if (t.address === setupInfo.mainTokenAddress) {
              mainTokenIndex = i;
            }
          });
          if (parseInt(ams[mainTokenIndex]) > 0) {
            const reward = await blockchainCall(
              element.contract.methods.calculateLockedFarmingReward,
              setup.setupIndex,
              ams[mainTokenIndex],
              false,
              0,
            );
            setLockedEstimatedReward(
              toDecimals(
                parseInt(reward.relativeRewardPerBlock) * (parseInt(setup.endBlock) - currentBlock),
                rewardTokenInfo.decimals,
              ),
            );
          }
        } else {
          const val =
            (parseInt(fromDecimals(value, parseInt(lpTokenInfo.decimals))) * 6400 * parseInt(setup.rewardPerBlock)) /
            (parseInt(setup.totalSupply) + parseInt(fromDecimals(value, parseInt(lpTokenInfo.decimals))));
          if (!isNaN(val)) {
            setFreeEstimatedReward(fromDecimals(numberToString(val), rewardTokenInfo.decimals));
          }
        }
      } catch (error) {
        console.log(error);
      }
    }, 300);
    // setFreeEstimatedReward(dfoCore.toDecimals(dfoCore.toFixed(parseInt(dfoCore.toFixed(dfoCore.fromDecimals(value, parseInt(lpTokenInfo.decimals)))) * 6400 * parseInt(setup.rewardPerBlock) / (parseInt(setup.totalSupply) + parseInt(value))), rewardTokenInfo.decimals))
  };

  async function addLiquidity(data) {
    try {
      setAddLiqLoading(true);
      if (element.generation === "gen2") {
        const bool = await addLiquidityGen2({
          setup,
          lpTokenAmount,
          receiver,
          setupTokens,
          inputType,
          setupInfo,
          ethereumAddress,
          tokenAmounts,
          element,
          currentPosition,
          prestoData,
          amountsMin,
          context,
          ...web3Data,
          ...data,
        });
        setAddLiqLoading(false);
        setOpen(false);
        setIncreaseLiq(false);
        setDecreaseLiq(false);
        return bool;
      }

      const stake = {
        setupIndex: setup.setupIndex,
        amount: 0,
        amountIsLiquidityPool: inputType === "add-lp" ? true : false,
        positionOwner: receiver || VOID_ETHEREUM_ADDRESS,
        amount0Min: amountsMin[0],
        amount1Min: amountsMin[1],
      };

      var ethTokenIndex = null;
      var ethTokenValue = 0;
      var mainTokenIndex = 0;
      var ethereumAddress = lpTokenInfo?.amm?.ethereumAddress;
      await Promise.all(
        setupTokens.map(async (token, i) => {
          if (setupInfo.involvingETH && token.address === VOID_ETHEREUM_ADDRESS) {
            ethTokenIndex = i;
          }
          if (
            token.address === setupInfo.mainTokenAddress ||
            (setupInfo.involvingETH &&
              token.address === VOID_ETHEREUM_ADDRESS &&
              setupInfo.mainTokenAddress === ethereumAddress)
          ) {
            mainTokenIndex = i;
          }
        }),
      );
      var lpAmount = numberToString((lpTokenAmount && lpTokenAmount.full) || lpTokenAmount);
      stake.amount = numberToString(
        stake.amountIsLiquidityPool ? lpAmount : tokenAmounts[mainTokenIndex].full || tokenAmounts[mainTokenIndex],
      );
      ethTokenValue =
        ethTokenIndex === undefined || ethTokenIndex === null
          ? "0"
          : numberToString(tokenAmounts[ethTokenIndex].full || tokenAmounts[ethTokenIndex]);
      var value = setupInfo.involvingETH && !stake.amountIsLiquidityPool ? ethTokenValue : "0";

      if (!currentPosition || receiver) {
        await blockchainCall(element.contract.methods.openPosition, stake, { value });
        setAddLiqLoading(false);
        setOpen(false);
        setIncreaseLiq(false);
        setDecreaseLiq(false);
      } else if (currentPosition) {
        await blockchainCall(element.contract.methods.addLiquidity, currentPosition.positionId, stake, { value });
        setAddLiqLoading(false);
        setOpen(false);
        setIncreaseLiq(false);
        setDecreaseLiq(false);
      }
    } catch {
      setAddLiqLoading(false);
      setOpen(false);
      setIncreaseLiq(false);
      setDecreaseLiq(false);
    }
  }

  async function percentageFeeOrBurn() {
    var burnData = "0x";
    if (feeType === "burn") {
      burnData = abi.encode(["bool", "bytes"], [true, "0x"]);
    }
    return burnData;
  }

  const removeLiquidity = async () => {
    setRemoveLiqLoading(true);
    if (setupInfo.free && (!removalAmount || removalAmount === 0) && setupInfo.minStakeable === "0") return;
    const removedLiquidity =
      removalAmount === 100 || setupInfo.minStakeable !== "0"
        ? manageStatus.liquidityPoolAmount
        : numberToString((parseInt(manageStatus.liquidityPoolAmount) * removalAmount) / 100).split(".")[0];
    var amMin = await calculateSlippageAmounts(slippage, removedLiquidity, "burn");
    var burnData = await percentageFeeOrBurn();
    if (element.generation === "gen1") {
      const bool = await blockchainCall(
        element.contract.methods.withdrawLiquidity,
        currentPosition.positionId,
        0,
        removedLiquidity,
        amMin[0].full || amMin[0],
        amMin[1].full || amMin[1],
        burnData,
      );
      setRemoveLiqLoading(false);
      setOpen(false);
      setIncreaseLiq(false);
      setDecreaseLiq(false);
      return bool;
    }
    try {
      const bool = await blockchainCall(
        element.contract.methods.withdrawLiquidity,
        currentPosition.positionId,
        removedLiquidity,
        amMin[0].full || amMin[0],
        amMin[1].full || amMin[1],
        burnData,
      );
      setRemoveLiqLoading(false);
      setOpen(false);
      setIncreaseLiq(false);
      setDecreaseLiq(false);
      return bool;
    } catch (e) {
      console.error(e.message);
      const message = (e.message || e).toLowerCase();
      if (message.indexOf("user denied") === -1 && message.indexOf("price slippage") === -1) {
        await blockchainCall(
          element.contract.methods.withdrawLiquidity,
          currentPosition.positionId,
          removedLiquidity,
          burnData,
        );
        setRemoveLiqLoading(false);
        setOpen(false);
        setIncreaseLiq(false);
        setDecreaseLiq(false);
      } else {
        setRemoveLiqLoading(false);
        setOpen(false);
        setIncreaseLiq(false);
        setDecreaseLiq(false);
        throw e;
      }
    }
  };

  async function withdrawAll() {
    setWithdrawAllLoading(true);
    var amMin = await calculateSlippageAmounts(slippage, manageStatus.liquidityPoolAmount, "burn");
    var burnData = await percentageFeeOrBurn();
    if (element.generation === "gen1") {
      const bool = await blockchainCall(
        element.contract.methods.withdrawLiquidity,
        currentPosition.positionId,
        0,
        manageStatus.liquidityPoolAmount,
        amMin[0].full || amMin[0],
        amMin[1].full || amMin[1],
        burnData,
      );
      // setWithdrawAllLoading(false);
      return bool;
    }
    try {
      await element.contract.methods
        .withdrawLiquidity(
          currentPosition.positionId,
          manageStatus.liquidityPoolAmount,
          amMin[0].full || amMin[0],
          amMin[1].full || amMin[1],
          burnData,
        )
        .call({ from: account });
      setWithdrawAllLoading(false);
    } catch (e) {
      // setWithdrawAllLoading(false);
      console.error(e.message);
    }
    try {
      await blockchainCall(
        element.contract.methods.withdrawLiquidity,
        currentPosition.positionId,
        manageStatus.liquidityPoolAmount,
        amMin[0].full || amMin[0],
        amMin[1].full || amMin[1],
        burnData,
      );
      setWithdrawAllLoading(false);
    } catch (e) {
      console.error(e.message);
      const message = (e.message || e).toLowerCase();
      if (message.indexOf("user denied") === -1 && message.indexOf("price slippage") === -1) {
        await blockchainCall(
          element.contract.methods.withdrawLiquidity,
          currentPosition.positionId,
          manageStatus.liquidityPoolAmount,
          burnData,
        );
        setWithdrawAllLoading(false);
      } else {
        setWithdrawAllLoading(false);
        throw e;
      }
    }
  }

  async function withdrawReward() {
    setClaimLoading(true);
    try {
      const burnData = await percentageFeeOrBurn();
      await blockchainCall(
        element.contract.methods["withdrawReward(uint256,bytes)"],
        currentPosition.positionId,
        burnData,
      );
      setClaimLoading(false);
    } catch (e) {
      if ((e.message || e).toLowerCase().indexOf("user denied") === -1) {
        await blockchainCall(element.contract.methods["withdrawReward(uint256)"], currentPosition.positionId);
        setClaimLoading(false);
      } else {
        setClaimLoading(false);
        throw e;
      }
    }
  }

  const transferPosition = async (positionId, index) => {
    if (!positionId) return;
    if (setupInfo.free) {
      setTransferLoading(true);
      try {
        //const gasLimit = await element.contract.methods.transferPosition(freeTransferAddress, positionId).estimateGas({ from: account })
        await blockchainCall(element.contract.methods.transferPosition, account, positionId);
        await reloadData();
      } catch (error) {
        console.log(error);
      } finally {
        setTransferLoading(false);
      }
    }
  };
  /*
      const updateSetup = async () => {
          setLoading(true)
          try {
              const updatedSetup = {
                  free: false,
                  blockDuration: 0,
                  originalRewardPerBlock: updatedRewardPerBlock,
                  minStakeable: 0,
                  maxStakeable: 0,
                  renewTimes: updatedRenewTimes,
                  ammPlugin: VOID_ETHEREUM_ADDRESS,
                  liquidityPoolTokenAddress: VOID_ETHEREUM_ADDRESS,
                  mainTokenAddress: VOID_ETHEREUM_ADDRESS,
                  ethereumAddress: VOID_ETHEREUM_ADDRESS,
                  involvingETH: false,
                  penaltyFee: 0,
                  setupsCount: 0,
                  lastSetupIndex: 0,
              }
              const updatedSetupConfiguration = { add: false, disable: false, index: parseInt(setup.setupIndex), info: updatedSetup }
              const gasLimit = await extensionContract.methods.setFarmingSetups([updatedSetupConfiguration]).estimateGas({ from: account })
              const result = await extensionContract.methods.setFarmingSetups([updatedSetupConfiguration]).send({ from: account, gasLimit, gas: gasLimit })
              await reloadData()
          } catch (error) {
              console.log(error)
          } finally {
              setLoading(false)
          }
      }

      const disableSetup = async () => {
          setLoading(true)
          try {
              const updatedSetup = {
                  free: false,
                  blockDuration: 0,
                  originalRewardPerBlock: 0,
                  minStakeable: 0,
                  maxStakeable: 0,
                  renewTimes: 0,
                  ammPlugin: VOID_ETHEREUM_ADDRESS,
                  liquidityPoolTokenAddress: VOID_ETHEREUM_ADDRESS,
                  mainTokenAddress: VOID_ETHEREUM_ADDRESS,
                  ethereumAddress: VOID_ETHEREUM_ADDRESS,
                  involvingETH: false,
                  penaltyFee: 0,
                  setupsCount: 0,
                  lastSetupIndex: 0,
              }
              const updatedSetupConfiguration = { add: false, disable: true, index: parseInt(setup.setupIndex), info: updatedSetup }
              const gasLimit = await extensionContract.methods.setFarmingSetups([updatedSetupConfiguration]).estimateGas({ from: account })
              const result = await extensionContract.methods.setFarmingSetups([updatedSetupConfiguration]).send({ from: account, gasLimit, gas: gasLimit })
              await reloadData()
          } catch (error) {
              console.log(error)
          } finally {
              setLoading(false)
          }
      }
      */

  const ApproveButton = ({ contract, text, onApproval, spender }) => {
    const approve = useCallback(async () => {
      setApproveLoading(true);
      try {
        await blockchainCall(contract.methods.approve, spender, MAX_UINT256);
      } catch (e) {
        setApproveLoading(false);
        throw e;
      }
    }, [contract.options.address]);

    return (
      <ActionAWeb3Button
        loading={approveLoading}
        disabled={approveLoading}
        removeDiv
        className="button l-btn "
        onClick={approve}
        onSuccess={() => void (setApproveLoading(), onApproval())}
      >
        {text}
      </ActionAWeb3Button>
    );
  };

  const approveButton = useMemo(() => {
    const notApprovedIndex = tokensApprovals.findIndex(value => !value);
    if (notApprovedIndex !== -1) {
      if (!tickData || tickData.cursorNumber === 0 || tickData.cursorNumber === 100) {
        var index = tickData?.cursorNumber === 100 ? 0 : 1;
        return (
          notApprovedIndex === index && (
            <ApproveButton
              contract={setupTokens[index].contract}
              spender={element.address}
              onApproval={() => onTokenApproval(index, false)}
              text={`Approve ${setupTokens[index].symbol}`}
            />
          )
        );
      }
      return (
        <ApproveButton
          contract={setupTokens[notApprovedIndex].contract}
          spender={element.address}
          onApproval={() => onTokenApproval(notApprovedIndex, false)}
          text={`Approve ${setupTokens[notApprovedIndex].symbol}`}
        />
      );
    } else {
      return <></>;
    }
  }, [tokensApprovals, lpTokenInfo, setupTokens, tickData, approveLoading]);

  const approveFeeButton = useMemo(() => {
    if (!burnFeeAllowance) {
      return (
        <ActionAWeb3Button
          removeDiv
          disabled={claimLoading}
          loading={claimLoading}
          setLoading={setClaimLoading}
          className="button btn-main"
          onSuccess={reloadData}
          onClick={withdrawReward}
        >
          Claim
        </ActionAWeb3Button>
      );
    }
    return (
      <ApproveButton
        className="button btn-main"
        contract={feeData.tokenToTransferOrBurnInApplication.contract}
        spender={feeData.operator}
        onApproval={setBurnFeeAllowance}
        text={`Approve ${feeData.tokenToTransferOrBurnInApplication.symbol} to transfer/burn fees`}
      />
    );
  }, [feeData, burnFeeAllowance, currentPosition, claimLoading, setClaimLoading]);

  const onInputTypeChange = async e => {
    setInputType(e.target.value);
    const ethBalance = await web3.eth.getBalance(account);
    setEthBalanceOf(ethBalance);
    setPrestoData(null);
    setShowPrestoError(false);
    setEthAmount(0);
    if (e.target.value === "add-eth") {
      setLpTokenAmount(0);
      setTokenAmounts(new Array(setupTokens.length).fill(0));
      setFreeEstimatedReward("0");
      setLockedEstimatedReward("0");
    }
  };

  const onOutputTypeChange = e => {
    setOutputType(e.target.value);
  };

  const updateEthAmount = async amount => {
    try {
      setLoadingPrestoData(true);
      setPrestoData(null);
      setEthAmount(amount || "0");
      if (!parseFloat(amount)) {
        return setLoadingPrestoData(false);
      }
      var value = toDecimals(numberToString(amount), 18);

      var halfValue = web3Utils.toBN(value).div(web3Utils.toBN(2)).toString();
      var ammEthereumAddress = (await blockchainCall(ammContract.methods.data))[0];

      var info = setupInfo;

      var liquidityPool = info.liquidityPoolTokenAddress;

      var tokens = await blockchainCall(ammContract.methods.byLiquidityPool, liquidityPool);
      var token0 = newContract(context.ERC20ABI, tokens[2][0]);
      var token1 = newContract(context.ERC20ABI, tokens[2][1]);
      var token0decimals = tokens[2][0] === VOID_ETHEREUM_ADDRESS ? 18 : await blockchainCall(token0.methods.decimals);
      var token1decimals = tokens[2][1] === VOID_ETHEREUM_ADDRESS ? 18 : await blockchainCall(token1.methods.decimals);

      var lpDecimals = await blockchainCall(newContract(context.ERC20ABI, liquidityPool).methods.decimals);

      var mainTokenIndex = tokens[2].indexOf(info.mainTokenAddress);

      var amm = ammContract; //amms[selectedAmmIndex].contract

      var ethereumAddress = (await blockchainCall(amm.methods.data))[0];

      async function calculateBestLP(firstToken, secondToken, firstDecimals, secondDecimals, hf) {
        var data = await blockchainCall(amm.methods.byTokens, [ethereumAddress, firstToken]);

        var liquidityPoolAddress = data[2];

        if (liquidityPoolAddress === VOID_ETHEREUM_ADDRESS) {
          return {};
        }

        var mainTokenIndex = data[3].indexOf(firstToken);
        var middleTokenIndex = data[3].indexOf(ethereumAddress);

        var mainAmount = formatNumber(normalizeValue(data[1][mainTokenIndex], firstDecimals));
        var middleTokenAmount = formatNumber(normalizeValue(data[1][middleTokenIndex], 18));

        var constant = mainAmount * middleTokenAmount;

        var newMiddleTokenAmount = middleTokenAmount + formatNumber(normalizeValue(halfValue, 18));

        var newMainAmount = constant / newMiddleTokenAmount;

        var mainReceived = mainAmount - newMainAmount;

        var firstTokenEthLiquidityPoolAddress = liquidityPoolAddress;
        var token0Value = (
          await blockchainCall(
            amm.methods.getSwapOutput,
            ethereumAddress,
            hf || halfValue,
            [liquidityPoolAddress],
            [firstToken],
          )
        )[1];

        var ratio = newMainAmount / mainAmount;

        if (!hf) {
          return await calculateBestLP(
            firstToken,
            secondToken,
            firstDecimals,
            secondDecimals,
            (halfValue = numberToString(formatNumber(halfValue) * ratio).split(".")[0]),
          );
        }

        var token1Value = await blockchainCall(
          ammContract.methods.byTokenAmount,
          liquidityPool,
          firstToken,
          token0Value,
        );
        var lpAmount = token1Value[0];
        token1Value = token1Value[1][token1Value[2].indexOf(secondToken)];

        lpAmount = numberToString(parseInt(lpAmount) / ratio).split(".")[0];
        token1Value = numberToString(parseInt(token1Value) / ratio).split(".")[0];

        const updatedFirstTokenAmount = formatNumber(normalizeValue(token0Value, firstDecimals));
        const updatedSecondTokenAmount = formatNumber(normalizeValue(token1Value, secondDecimals));

        liquidityPoolAddress = (await blockchainCall(amm.methods.byTokens, [ethereumAddress, secondToken]))[2];
        var secondTokenEthLiquidityPoolAddress = liquidityPoolAddress;
        var token1ValueETH = "0";
        if (secondTokenEthLiquidityPoolAddress !== VOID_ETHEREUM_ADDRESS) {
          token1ValueETH = (
            await blockchainCall(
              amm.methods.getSwapOutput,
              secondToken,
              token1Value,
              [liquidityPoolAddress],
              [ethereumAddress],
            )
          )[1];
        }

        return {
          lpAmount,
          updatedFirstTokenAmount,
          updatedSecondTokenAmount,
          token0Value,
          token1Value,
          token1ValueETH,
          firstTokenEthLiquidityPoolAddress,
          secondTokenEthLiquidityPoolAddress,
        };
      }

      var bestLP = await calculateBestLP(
        token0.options.address,
        token1.options.address,
        token0decimals,
        token1decimals,
      );

      var lpAmount = bestLP.lpAmount;
      var firstTokenAmount = bestLP.token0Value;
      var secondTokenAmount = bestLP.token1Value;
      var firstTokenETH = halfValue;
      var secondTokenETH = bestLP.token1ValueETH;
      var token0EthLiquidityPoolAddress = bestLP.firstTokenEthLiquidityPoolAddress;
      var token1EthLiquidityPoolAddress = bestLP.secondTokenEthLiquidityPoolAddress;

      if (
        token0.options.address === ammEthereumAddress ||
        !lpAmount ||
        bestLP.updatedSecondTokenAmount > bestLP.updatedFirstTokenAmount
      ) {
        bestLP = await calculateBestLP(token1.options.address, token0.options.address, token1decimals, token0decimals);

        lpAmount = bestLP.lpAmount;
        firstTokenAmount = bestLP.token1Value;
        secondTokenAmount = bestLP.token0Value;
        firstTokenETH = bestLP.token1ValueETH;
        secondTokenETH = halfValue;
        token0EthLiquidityPoolAddress = bestLP.secondTokenEthLiquidityPoolAddress;
        token1EthLiquidityPoolAddress = bestLP.firstTokenEthLiquidityPoolAddress;
      }

      var operations = [];

      token0EthLiquidityPoolAddress !== VOID_ETHEREUM_ADDRESS &&
        operations.push({
          inputTokenAddress: ethereumAddress,
          inputTokenAmount: firstTokenETH,
          ammPlugin: amm.options.address,
          liquidityPoolAddresses: [token0EthLiquidityPoolAddress],
          swapPath: [token0.options.address],
          enterInETH: true,
          exitInETH: false,
          receivers: [farmingPresto.options.address],
          receiversPercentages: [],
        });

      token1EthLiquidityPoolAddress !== VOID_ETHEREUM_ADDRESS &&
        operations.push({
          inputTokenAddress: ethereumAddress,
          inputTokenAmount: secondTokenETH,
          ammPlugin: amm.options.address,
          liquidityPoolAddresses: [token1EthLiquidityPoolAddress],
          swapPath: [token1.options.address],
          enterInETH: true,
          exitInETH: false,
          receivers: [farmingPresto.options.address],
          receiversPercentages: [],
        });

      var ethValue = 0;
      token0EthLiquidityPoolAddress !== VOID_ETHEREUM_ADDRESS &&
        (ethValue = web3Utils.toBN(ethValue).add(web3Utils.toBN(firstTokenETH)).toString());
      token1EthLiquidityPoolAddress !== VOID_ETHEREUM_ADDRESS &&
        (ethValue = web3Utils.toBN(ethValue).add(web3Utils.toBN(secondTokenETH)).toString());
      info.involvingETH &&
        token0.options.address === ammEthereumAddress &&
        (ethValue = web3Utils.toBN(ethValue).add(web3Utils.toBN(firstTokenAmount)).toString());
      info.involvingETH &&
        token1.options.address === ammEthereumAddress &&
        (ethValue = web3Utils.toBN(ethValue).add(web3Utils.toBN(secondTokenAmount)).toString());

      var request = {
        setupIndex: setup.setupIndex,
        amount: mainTokenIndex === 0 ? firstTokenAmount : secondTokenAmount,
        amountIsLiquidityPool: false,
        positionOwner: isEthereumAddress(receiver) ? receiver : account,
      };

      if (!setupInfo.free) {
        const reward = await blockchainCall(
          element.contract.methods.calculateLockedFarmingReward,
          setup.setupIndex,
          mainTokenIndex === 0 ? firstTokenAmount : secondTokenAmount,
          false,
          0,
        );
        setLockedEstimatedReward(
          fromDecimals(
            parseInt(reward.relativeRewardPerBlock) * (parseInt(setup.endBlock) - currentBlock),
            rewardTokenInfo.decimals,
          ),
        );
      } else {
        const val =
          (parseInt(lpAmount) * 6400 * parseInt(setup.rewardPerBlock)) /
          (parseInt(setup.totalSupply) + parseInt(lpAmount));
        if (!isNaN(val)) {
          setFreeEstimatedReward(fromDecimals(val, rewardTokenInfo.decimals));
        }
      }

      setPrestoData({
        ethValue: value,
        transaction: farmingPresto.methods.openPosition(
          getNetworkElement({ context, chainId }, "prestoAddress"),
          operations,
          element.address,
          request,
        ),
        firstTokenAmount,
        secondTokenAmount,
        token0decimals,
        token1decimals,
        token0Address: token0.options.address,
        token1Address: token1.options.address,
        token0Symbol:
          info.involvingETH && token0.options.address === ammEthereumAddress
            ? "ETH"
            : await blockchainCall(token0.methods.symbol),
        token1Symbol:
          info.involvingETH && token1.options.address === ammEthereumAddress
            ? "ETH"
            : await blockchainCall(token1.methods.symbol),
      });

      setLpTokenAmount({ full: lpAmount, value: fromDecimals(lpAmount, lpDecimals) });
    } catch (error) {
      console.log(error);
    }
    setLoadingPrestoData(false);
  };

  const calculateLockedFixedValue = () => {
    const { rewardPerBlock } = setup;
    const { maxStakeable } = setupInfo;
    const normalizedRewardPerBlock = parseInt(rewardPerBlock) * 10 ** (18 - rewardTokenInfo.decimals);
    const normalizedMaxStakeable = parseInt(maxStakeable) * 10 ** (18 - mainTokenInfo.decimals);
    const amount = normalizedRewardPerBlock * (1 / normalizedMaxStakeable);
    return canActivateSetup
      ? formatMoneyUniV3(amount * parseInt(setupInfo.blockDuration), 6)
      : parseInt(currentBlock) >= parseInt(setup.endBlock)
      ? 0
      : formatMoneyUniV3(amount * (parseInt(setup.endBlock) - parseInt(currentBlock)), 6);
  };

  function onSlippageChange(e) {
    var value = parseFloat(e.target.value);
    var min = parseFloat(e.target.min);
    var max = parseFloat(e.target.max);
    value = isNaN(value) ? 0 : value;
    if (value < min) {
      value = min;
    }
    if (value > max) {
      value = max;
    }
    setSlippage(value);
  }

  const getAdvanced = () => {
    return decreaseLiq
      ? getDecreaseFarm()
      : increaseLiq
      ? getManageAdvanced()
      : !increaseLiq && currentPosition
      ? getPosition()
      : getManageAdvanced();
  };

  const getPosition = () => {
    return (
      <div className="position-wrapper">
        {manageStatus && (
          <div className="position-block">
            <div className="position-block-left">Your deposit</div>
            <div className="position-block-right">
              {manageStatus.tokens.map((token, i) => (
                <span key={token.address}>
                  {formatMoneyUniV3(fromDecimals(manageStatus.tokenAmounts[i], token.decimals, true), 3)} {token.symbol}
                </span>
              ))}
            </div>
          </div>
        )}
        {!endBlockReached && (
          <div className="position-block">
            <div className="position-block-left">Daily earnings</div>
            <div className="position-block-right">
              <span>
                {calculateDailyEarnings()} {rewardTokenInfo.symbol}
              </span>
            </div>
          </div>
        )}

        {freeAvailableRewards && (
          <div className="position-block">
            <div className="position-block-left">Available</div>
            <div className="position-block-right">
              <span>
                {formatMoneyUniV3(fromDecimals(freeAvailableRewards, rewardTokenInfo.decimals, true), 4)}{" "}
                {rewardTokenInfo.symbol}
              </span>
            </div>
          </div>
        )}
        <div
          className={`position-block-dividend ${
            element.generation === "gen2" && manageStatus && !manageStatus?.withdrawOnly && !withdrawOpen
              ? ""
              : "single"
          }`}
        >
          {element.generation === "gen2" && manageStatus && (
            <div className="position-block">
              <div className="position-block-left">Fees earned</div>
              <div className="position-block-right">
                <span>
                  {formatMoneyUniV3(fromDecimals(manageStatus.additionalFees[0], setupTokens[0].decimals, true), 4)}{" "}
                  {setupTokens[0].symbol} -{" "}
                  {formatMoneyUniV3(fromDecimals(manageStatus.additionalFees[1], setupTokens[1].decimals, true), 4)}{" "}
                  {setupTokens[1].symbol}
                </span>
              </div>
            </div>
          )}
          {!manageStatus?.withdrawOnly && !withdrawOpen && (
            <div className="block-content-btm">
              <div className="position-block">
                <div className="position-block-left">Options</div>
                <div className="position-block-right">
                  <span>
                    {!manageStatus?.withdrawOnly && !withdrawOpen && (
                      <RegularButtonDuo
                        className="button l-btn"
                        onClick={() => void (setIncreaseLiq(false), setDecreaseLiq(true))}
                      >
                        Decrease
                      </RegularButtonDuo>
                    )}
                    {!manageStatus?.withdrawOnly && parseInt(setup.endBlock) > parseInt(currentBlock) && (
                      <RegularButtonDuo
                        className="button main-btn"
                        onClick={() => void (setIncreaseLiq(true), setDecreaseLiq(false))}
                      >
                        Increase
                      </RegularButtonDuo>
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className={`farm-modal-btns-btm`}>
          <button
            className="button l-btn"
            onClick={() => void (setOpen(false), setWithdrawOpen(false), setEdit(false))}
          >
            Close
          </button>
          {manageStatus?.withdrawOnly && !withdrawOpen ? (
            <ActionAWeb3Button
              removeDiv
              disabled={withdrawAllLoading}
              loading={withdrawAllLoading}
              className="button main-btn"
              onSuccess={reloadData}
              onClick={withdrawAll}
            >
              Withdraw All
            </ActionAWeb3Button>
          ) : !manageStatus?.withdrawOnly ? (
            approveFeeButton
          ) : (
            <React.Fragment></React.Fragment>
          )}
        </div>
      </div>
    );
  };

  const getDecreaseFarm = () => {
    const RemoveButton = (
      <ActionAWeb3Button
        removeDiv
        className="button btn-main"
        disabled={removeLiqLoading}
        loading={removeLiqLoading}
        nSuccess={reloadData}
        onClick={removeLiquidity}
      >
        Remove
      </ActionAWeb3Button>
    );
    return (
      <div className="position-wrapper position-decrease-wrapper">
        <div className="position-block">
          <div className="position-block-left">Amount: {removalAmount}%</div>
          <div className="position-block-right">
            {manageStatus.tokens.map((token, i) => (
              <span key={token.address}>
                {formatMoneyUniV3(
                  fromDecimals(
                    (parseInt(manageStatus.tokenAmounts[i].full || manageStatus.tokenAmounts[i]) * removalAmount) / 100,
                    token.decimals,
                    true,
                  ),
                  4,
                )}
                &nbsp;
                {token.symbol}
              </span>
            ))}
          </div>
        </div>
        {(!setupInfo || setupInfo.minStakeable === "0") && (
          <div className={style.RemoveLiquiditytools}>
            <input
              type="range"
              value={removalAmount}
              onChange={e => setRemovalAmount(parseInt(e.target.value))}
              id="formControlRange"
            />
          </div>
        )}
        <div className="position-block-btns">
          <button className="sm-btn" onClick={e => setRemovalAmount(10)}>
            10%
          </button>
          <button className="sm-btn" onClick={e => setRemovalAmount(25)}>
            25%
          </button>
          <button className="sm-btn" onClick={e => setRemovalAmount(50)}>
            50%
          </button>
          <button className="sm-btn" onClick={e => setRemovalAmount(75)}>
            75%
          </button>
          <button className="sm-btn" onClick={e => setRemovalAmount(90)}>
            90%
          </button>
          <button className="sm-btn" onClick={e => setRemovalAmount(100)}>
            Max
          </button>
        </div>
        <div
          className={`farm-modal-btns-btm ${
            (setupInfo && setupInfo.minStakeable === "0") || (decreaseLiq && currentPosition) ? "" : "single-btn"
          }`}
        >
          {decreaseLiq && currentPosition && (
            <button className="button l-btn" onClick={() => setDecreaseLiq(false)}>
              Back
            </button>
          )}
          {setupInfo && setupInfo.minStakeable === "0" && RemoveButton}
          {setupInfo && setupInfo.minStakeable !== "0" && renderSettings(true, true, undefined, RemoveButton)}
        </div>
      </div>
    );
  };

  const getManageAdvanced = () => {
    return (
      <div className={style.FarmingDynamics}>
        <div className="OptionalThingsFarmers-container">
          {renderExternalOwner()}
          {renderSlippage()}
        </div>
        {setupTokens.map((setupToken, i) => {
          return (
            <div key={setupToken.address} className={`InputTokenRegular`}>
              {(i === 1 ? tickData.cursorNumber !== 100 : tickData.cursorNumber !== 0) && (
                <TokenInputRegular
                  tokenImage={setupToken.address !== VOID_ETHEREUM_ADDRESS ? customIcon : EthereumIconLight}
                  name={setupToken.symbol}
                  selected={setupToken}
                  tokens={[setupToken]}
                  onElement={(t, _, value) =>
                    value ? onUpdateTokenAmount(fromDecimals(value, t.decimals, true), i) : null
                  }
                  outputValue={
                    tokenAmounts && tokenAmounts[i] && tokenAmounts[i].value
                      ? tokenAmounts[i].value ||
                        fromDecimals(tokenAmounts[i].full || tokenAmounts[i], setupToken.decimals, true)
                      : 0
                  }
                />
              )}
            </div>
          );
        })}
        {hasSlippage && (
          <div className="InputTokenRegular">
            <TokenInputRegular
              removeBalance
              removeMax
              placeholder="Slippage"
              min="0"
              max="99"
              className="TextRegular"
              value={slippage}
              onNormalChange
              onChange={onSlippageChange}
            />
          </div>
        )}
        {hasReceiver && (
          <div className="InputTokenRegular">
            <TokenInputRegular
              removeBalance
              removeMax
              type="text"
              placeholder="Receiver"
              className="TextRegular"
              value={receiver}
              onNormalChange
              onChange={e => setReceiver(e.target.value)}
            />
          </div>
        )}
        {setupInfo.free &&
          rewardTokenInfo &&
          lpTokenAmount !== undefined &&
          lpTokenAmount !== null &&
          lpTokenAmount !== "" &&
          lpTokenAmount !== "0" &&
          (!lpTokenAmount.full || lpTokenAmount.full !== "0") && (
            <div className="DiffWallet">
              <p className="BreefRecap">
                <b>Estimated reward per day: </b>
                <br></br>
                {formatMoneyUniV3(freeEstimatedReward, rewardTokenInfo.decimals)} {rewardTokenInfo.symbol}
              </p>
            </div>
          )}
        {minimumStakingError && (
          <div>
            <p>{minimumStakingError}</p>
          </div>
        )}
        <div
          className={`farm-modal-btns-btm ${
            tokensApprovals.some(value => !value) || (increaseLiq && currentPosition) ? "" : "single-btn"
          }`}
        >
          {tokensApprovals.some(value => !value) && <React.Fragment>{approveButton}</React.Fragment>}
          {increaseLiq && currentPosition && (
            <button className="button l-btn" onClick={() => setIncreaseLiq(false)}>
              Back
            </button>
          )}
          <ActionAWeb3Button
            removeDiv
            loading={addLiqLoading}
            className="button main-btn "
            onSuccess={reloadData}
            onClick={addLiquidity}
            disabled={tokensApprovals.some(value => !value) || tokenAmounts.some(value => value === 0) || addLiqLoading}
          >
            Add Liquidity
          </ActionAWeb3Button>
        </div>
      </div>
    );
  };

  const getEdit = () => {
    return <></>;
  };

  function calculateDailyEarnings() {
    if (!manageStatus) {
      return 0;
    }
    var rewardPerBlock = formatNumber(fromDecimals(setup.rewardPerBlock, rewardTokenInfo.decimals, true));
    var liquidityPoolAmount = formatNumber(
      fromDecimals(manageStatus.liquidityPoolAmount, rewardTokenInfo.decimals, true),
    );
    var totalSupply = formatNumber(fromDecimals(setup.totalSupply, rewardTokenInfo.decimals, true));
    var dailyEarnings = (rewardPerBlock * 6400 * liquidityPoolAmount) / totalSupply;
    dailyEarnings = numberToString(dailyEarnings);
    dailyEarnings = formatMoneyUniV3(dailyEarnings, 4);
    return dailyEarnings;
    //fromDecimals((parseInt(setup.rewardPerBlock) * 6400 * parseInt(manageStatus.liquidityPoolAmount) / parseInt(setup.totalSupply)).toString().split('.')[0], rewardTokenInfo.decimals, true)
  }

  function calculateTransactedFee(percentage, amount, setupToken) {
    amount = numberToString(parseFloat(fromDecimals(percentage, 18, true)) * parseInt(amount)).split(".")[0];

    return formatMoney(fromDecimals(amount, setupToken.decimals, true), 6);
  }

  function renderSlippage() {
    return (
      <React.Fragment>
        <label className="OptionalThingsFarmers">
          <input type="checkbox" value={hasSlippage} onChange={onHasSlippageChange} />
          <p>Slippage: {slippage}%</p>
        </label>
      </React.Fragment>
    );
  }

  function renderExternalOwner() {
    return (
      <React.Fragment>
        <label className="OptionalThingsFarmers">
          <input
            type="checkbox"
            value={hasReceiver}
            onChange={e => {
              setReceiver("");
              setHasReceiver(e.currentTarget.checked);
            }}
          />
          <p>Receiver</p>
        </label>
      </React.Fragment>
    );
  }

  function renderSettings(renderSlippage, renderFeeType, renderAddress, content) {
    const postfix =
      "_" +
      numberToString(new Date() * Math.random())
        .split(".")
        .join("");
    return (
      <div className={style.SettingFB}>
        {renderSlippage && (
          <div>
            <label className={style.SettingBLabPerch}>
              <p>Slippage: {slippage}%</p>
              <input
                type="range"
                min="0"
                max="99"
                step="0.05"
                value={slippage}
                onChange={e => setSlippage(parseFloat(e.currentTarget.value))}
              />
            </label>
          </div>
        )}
        {renderFeeType && (
          <div className={style.FarmProtocolFees}>
            <p>Protocol Fees:</p>
            <label className={style.FarmProtocolFee}>
              <span>
                <b>🧮 Transaction</b>
              </span>
              {setupTokens &&
                manageStatus &&
                manageStatus.additionalFees &&
                feeData &&
                feeData.feePercentageForTransacted && (
                  <span>
                    {calculateTransactedFee(
                      feeData.feePercentageForTransacted,
                      element.generation === "gen1" ? manageStatus.tokenAmounts[0] : manageStatus.additionalFees[0],
                      setupTokens[0],
                    )}{" "}
                    {setupTokens[0].symbol} -{" "}
                    {calculateTransactedFee(
                      feeData.feePercentageForTransacted,
                      element.generation === "gen1" ? manageStatus.tokenAmounts[1] : manageStatus.additionalFees[1],
                      setupTokens[1],
                    )}{" "}
                    {setupTokens[1].symbol}
                  </span>
                )}
              <input
                type="radio"
                name={"feeType" + postfix}
                checked={feeType === "percentage"}
                onClick={() => setFeeType("percentage")}
              />
            </label>
            {!dualChainId && contracts.indexOf(web3Utils.toChecksumAddress(element.address)) === -1 && (
              <label className={style.FarmProtocolFee}>
                <span>
                  <b>🔥 Burn</b>
                </span>
                {feeData && feeData.tokenToTransferOrBurnInApplication && feeData.transferOrBurnAmountInApplication && (
                  <span>
                    {formatMoney(
                      fromDecimals(
                        feeData.transferOrBurnAmountInApplication,
                        feeData.tokenToTransferOrBurnInApplication.decimals,
                        true,
                      ),
                      6,
                    )}{" "}
                    {feeData.tokenToTransferOrBurnInApplication.symbol}
                  </span>
                )}
                <input
                  type="radio"
                  name={"feeType" + postfix}
                  checked={feeType === "burn"}
                  onClick={() => setFeeType("burn")}
                />
              </label>
            )}
          </div>
        )}
        {renderAddress && (
          <div>
            <label className={style.SettingBLabRegular}>
              <p>Receiver:</p>
              <input type="text" value={receiver} onChange={e => setReceiver(e.currentTarget.value)} />
            </label>
          </div>
        )}
      </div>
    );
  }

  if (!setupTokens || setupTokens.length === 0 || !setup) {
    return (
      <div className="loader-wrap-text">
        <OurCircularProgress />
        <p>Fetching data...</p>
      </div>
    );
  }

  return (
    <React.Fragment>
      <React.Fragment>
        <div className={`block-modal-backdrop ${(open || withdrawOpen) && !edit ? "active" : ""}`}></div>
        <div
          className={`block-modal-center ${(open || withdrawOpen) && !edit ? "active" : ""} ${
            !increaseLiq && currentPosition ? "position-center-modal" : ""
          }`}
        >
          <div className="block-modal">
            <div
              className="block-modal-close"
              onClick={() => void (setOpen(false), setIncreaseLiq(false), setDecreaseLiq(false))}
            >
              <i className="fa-light fa-xmark"></i>
            </div>
            {getAdvanced()}
          </div>
        </div>
      </React.Fragment>
      <div className="block-wrapper">
        <div
          className="block-content block-content-left"
          style={{ backgroundColor: customBlockBackgroundColor, backdropFilter: addBlurToCustomBlock ? "" : "none" }}
        >
          {comingSoon ? (
            <div className="block-content-top">
              <div className="chip chip-orange">Soon</div>
            </div>
          ) : (
            <div className="block-content-top">
              {setup.active && parseInt(setup.endBlock) > currentBlock && <div className="chip chip-green">Active</div>}
              {!delayedBlock && (
                <React.Fragment>
                  {!setup.active && canActivateSetup ? (
                    <div className={`chip ${setupReady ? "chip-green" : "chip-orange"}`}>
                      {setupReady ? "New" : "Soon"}
                    </div>
                  ) : !setup.active ? (
                    <div className="chip chip-orange">Inactive</div>
                  ) : (
                    <React.Fragment></React.Fragment>
                  )}
                  {parseInt(setup.endBlock) <= currentBlock && parseInt(setup.endBlock) !== 0 && (
                    <div className="chip chip-red">Ended</div>
                  )}
                </React.Fragment>
              )}
              {delayedBlock !== 0 && <div className="chip chip-orange">Soon</div>}
            </div>
          )}
          <div className="block-content-btm">
            {setupTokens.map((token, i) => (
              <div className="block-info-wrap">
                {token.address !== VOID_ETHEREUM_ADDRESS ? (
                  <a
                    target="_blank"
                    href={`${getNetworkElement({ context, chainId }, "etherscanURL")}token/${token.address}`}
                    rel="noreferrer"
                  >
                    <div className="block-info-icon" style={{ backgroundColor: customBlockIconBackgroundColor }}>
                      <img src={customIcon} alt={token.address} />
                    </div>
                  </a>
                ) : (
                  <div className="block-info-icon" style={{ backgroundColor: customBlockIconBackgroundColor }}>
                    <img src={EthereumIconLight} alt={token.address} />
                  </div>
                )}
                <div className="block-info-content">
                  <div>{token.symbol}</div>
                  <span>
                    {tickData &&
                      `${formatMoneyUniV3(i === 0 ? tickData.cursorNumber : 100 - tickData.cursorNumber, 2)}%`}
                  </span>
                </div>
              </div>
            ))}
            {rewardTokenInfo && (
              <div className="block-info-wrap">
                <div className="block-info-icon" style={{ backgroundColor: customBlockIconBackgroundColor }}>
                  <i className="fa-light fa-wave-pulse"></i>
                </div>
                <div className="block-info-content">
                  <div>Daily Rate</div>
                  <span>
                    {formatMoneyUniV3(
                      fromDecimals(parseInt(setup.rewardPerBlock) * 6400, rewardTokenInfo.decimals, true),
                      4,
                    )}{" "}
                    {rewardTokenInfo.symbol}
                  </span>
                </div>
              </div>
            )}
            {parseInt(setup.endBlock) > 0 ? (
              <a
                target="_blank"
                className="block-info-wrap"
                href={`${getNetworkElement({ context, chainId: dualChainId || chainId }, "etherscanURL")}block/${
                  setup.endBlock
                }`}
                rel="noreferrer"
              >
                <div className="block-info-icon" style={{ backgroundColor: customBlockIconBackgroundColor }}>
                  <i className="fa-light fa-hourglass-start"></i>
                </div>
                <div className="block-info-content">
                  <div>End</div>
                  <span>{setup.endBlock}</span>
                </div>
              </a>
            ) : (
              <div className="block-info-wrap">
                <div className="block-info-icon" style={{ backgroundColor: customBlockIconBackgroundColor }}>
                  <img src={EthereumIconLight} alt="Ethereum" />
                </div>
                <div className="block-info-content">
                  <div>Duration</div>
                  <span>{getPeriodFromDuration(setupInfo.blockDuration)}</span>
                </div>
              </div>
            )}
            <button disabled={comingSoon} className="button btn-main" onClick={() => setOpen(true)}>
              {comingSoon ? "Coming soon" : currentPosition ? "See Position" : "Add Liquidity"}
            </button>
          </div>
        </div>
        <div
          className="block-content block-content-right"
          style={{ backgroundColor: customBlockBackgroundColor, backdropFilter: addBlurToCustomBlock ? "" : "none" }}
        >
          <div className="block-content-top">
            <div className="block-info-wrap">
              <div
                className="block-info-icon cursor-pointer"
                onClick={() => setsecondTokenIndex(1 - (secondTokenIndex || 0))}
                style={{ backgroundColor: customBlockIconBackgroundColor }}
              >
                <i className="fa-light fa-rotate"></i>
              </div>
              <div className="block-info-content">
                <div>
                  {setupTokens[secondTokenIndex].symbol} per {setupTokens[1 - secondTokenIndex].symbol}
                </div>
              </div>
            </div>
            <a
              href={context.uniswapV3PoolURLTemplate
                .split("{0}")
                .join(dualChainId ? "optimism/" : "")
                .split("{1}")
                .join(setupInfo.liquidityPoolTokenAddress)}
              target="_blank"
              className="chip chip-main"
              rel="noreferrer"
            >
              {formatMoneyUniV3(numberToString(parseInt(lpTokenInfo.fee) / 10000), "2")}%
            </a>
            {((currentPosition?.tokenId && currentPosition?.tokenId !== "0") ||
              (setup.objectId && setup.objectId !== "0")) && (
              <a
                href={context.uniswapV3NFTURLTemplate
                  .split("{0}")
                  .join(dualChainId ? "optimism/" : "")
                  .split("{1}")
                  .join(currentPosition?.tokenId || setup.objectId)}
                target="_blank"
                className="chip chip-main nft"
                rel="noreferrer"
              >
                NFT
              </a>
            )}
          </div>
          <div className="block-content-center">
            {!tickData ? (
              <OurCircularProgress />
            ) : (
              <div className={style.UniV3CurveView}>
                <div className={style.UniV3CurveViewCurv}>
                  <span className={style.CircleLeftV3Curve}></span>
                  <span className={style.CircleLeftV3CurvePrice}>
                    {tickData.diluted ? (
                      element.generation === "gen2" ? (
                        "Diluted"
                      ) : (
                        <>&#8734;</>
                      )
                    ) : tickData.tickLowerUSDPrice ? (
                      "$" + formatMoneyUniV3(tickData.tickLowerUSDPrice)
                    ) : (
                      `${formatMoneyUniV3(tickData.minPrice)} ${setupTokens[secondTokenIndex].symbol}`
                    )}
                  </span>
                  <span className={style.CircleRightV3Curve}></span>
                  <span className={style.CircleRightV3CurvePrice}>
                    {tickData.diluted ? (
                      element.generation === "gen2" ? (
                        "Diluted"
                      ) : (
                        <>&#8734;</>
                      )
                    ) : tickData.tickUpperUSDPrice ? (
                      "$" + formatMoneyUniV3(tickData.tickUpperUSDPrice)
                    ) : (
                      `${formatMoneyUniV3(tickData.maxPrice)} ${setupTokens[secondTokenIndex].symbol}`
                    )}
                  </span>
                  <div className={style.CircleActualPriceV3} style={{ left: `${tickData.cursor}%` }}>
                    <span className={style.CircleRightV3Actual}>
                      <i className="fa-solid fa-caret-down"></i>
                      <span className={style.CircleRightV3ActualPrice}>
                        {tickData.tickCurrentUSDPrice
                          ? "$" + formatMoneyUniV3(tickData.tickCurrentUSDPrice)
                          : `${formatMoneyUniV3(tickData.currentPrice)}`}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="block-content-btm">
            <p>Total value locked:</p>
            <div>
              {setupTokens.map((token, index) => (
                <React.Fragment key={token.address}>
                  <span>{token.symbol}</span>&nbsp;
                  {formatMoneyUniV3(fromDecimals(token.liquidity, token.decimals, true), 4)}
                  {index !== setupTokens.length - 1 ? <span className="opac">|&nbsp;</span> : ""}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default SetupComponent;
