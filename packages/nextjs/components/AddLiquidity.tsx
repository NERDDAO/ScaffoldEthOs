import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import InputUI from "../components/scaffold-eth/Contract/InputUI";
import { WriteOnlyFunctionForm } from "../components/scaffold-eth/Contract/WriteOnlyFunctionForm";
import { Contract, BigNumber } from "ethers";
import { useRouter } from "next/router";
import { useContract, useNetwork, useProvider, useContractRead } from "wagmi";
import {
  getDeployedContract,
  getAllContractFunctions,
  getContractVariablesAndNoParamsReadMethods,
} from "~~/components/scaffold-eth/Contract/utilsContract";
import { useAppStore } from "~~/services/store/store";
import { TFarmingPositionRequest } from "~~/services/store/slices/farmingPositionRequestSlice";
import FarmingComponent from "~~/components/FarmingComponent";
import * as text from "../public/data/context.json";

import {
  useWeb3,
  useEthosContext,
  getNetworkElement,
  blockchainCall,
  VOID_ETHEREUM_ADDRESS,
  formatMoney,
  fromDecimals,
  web3Utils,
  abi,
  toDecimals,
  isEthereumAddress,
} from "@ethereansos/interfaces-core";
import { getFarming } from "../logic/farming";

function AddLiquidity() {
  const [isOpen, setIsOpen] = useState(false);
  // create form and setForm function
  const router = useRouter();
  const { pid } = router.query;

  const setTempState = useAppStore(state => state.tempSlice.setTempState);
  const [element, setElement] = useState();
  const context = text;

  // Add state for form
  const contractName = "FarmMainRegularMinStakeABI";
  const { chain } = useNetwork();
  const provider = useProvider();
  const web3Data = useWeb3();
  console.log("context: ", context);

  let contractAddress = "";
  let contractABI = [];
  const deployedContractData = getDeployedContract(chain?.id.toString(), contractName);

  if (deployedContractData) {
    ({ address: contractAddress, abi: contractABI } = deployedContractData);
  }

  const contract: Contract = useContract({
    addressOrName: contractAddress,
    contractInterface: contractABI,
    signerOrProvider: provider,
  });

  const displayedContractFunctions = getAllContractFunctions(contract);
  const contractMethodsDisplay = getContractVariablesAndNoParamsReadMethods(
    contract,
    displayedContractFunctions,
    false,
  );
  console.log("Contract: ", displayedContractFunctions);
  console.log("Contract contractABI: ", contractABI);
  console.log("Contract contractAddress: ", contractMethodsDisplay);

  const cRead = useContractRead({
    addressOrName: contractAddress,
    contractInterface: contractABI,
    functionName: "setup",
    chainId: 1,
    watch: true,
    cacheOnBlock: false,
    args: [BigNumber.from(pid)],
  });
  // sets contract state to app store
  useEffect(() => {
    if (cRead) {
      console.log("cRead", cRead);
      setTempState({ tempStuff: cRead?.data });
    }
  }, [cRead, setTempState]);

  // set element with the result of getFarming function using contractAddress

  // create a consst with a setter called element that

  // create an array of objects with the farmingPositionRequest declare type of tFarmingPositionRequest
  //TODO dynamically add values to the farmingPositionRequest
  // set farming request to appStore

  const setfarmPositionRequest = useAppStore(state => state.farmingPositionRequestSlice.setFarmingPositionRequest);

  useEffect(() => {
    const farmingPositionRequest: TFarmingPositionRequest = {
      setupIndex: 0,
      amount0: 0,
      amount1: 0,
      positionOwner: "yomama",
      amount0Min: 0,
      amount1Min: 0,
    };
    setfarmPositionRequest(farmingPositionRequest);
  }, [setfarmPositionRequest]);

  //console log the FarmingPositionRequestSlice
  const farmPositionRequest = useAppStore(state => state.farmingPositionRequestSlice.farmingPositionRequest);
  console.log("farmPositionRequest", farmPositionRequest);

  //Load the setupComponent using the current setupIndex and contract address
  const refresh = useCallback(() => {
    setElement();
    const address = contractAddress;
    address && isEthereumAddress(address) && getFarming({ context, ...web3Data }, address).then(setElement);
  }, [contractAddress]);

  useEffect(() => refresh, [refresh]);

  // load context

  function setContext(context: { address: string; chainId: number; network: string }) {
    console.log("context: ", context);
    setTempState({ tempStuff: context });
  }
  return (
    <div>
      <h1>Add Liquidity</h1>
      <div>
        <h2>Setup</h2>
        <div>
          {!element ? "loading..." : <FarmingComponent refresh={refresh} element={element} context={context} />}
        </div>
        ;
      </div>
    </div>
  );
}

export default AddLiquidity;
