/* eslint-disable react-hooks/rules-of-hooks */
import {
  formatMoney,
  fromDecimals,
  getNetworkElement,
  useEthosContext,
  useWeb3,
  VOID_ETHEREUM_ADDRESS,
} from "@ethereansos/interfaces-core";
import React, { useMemo, useState } from "react";
import Link from "next/link";

import style from "../all.module.css";
import LogoRenderer from "../Global/LogoRenderer";
import SetupComponent from "./SetupComponent";

const farmingComponent = props => {
  const { element, opened, setOpened, rewardTokenAddress, refresh } = props;

  const context = useEthosContext();

  const web3Data = useWeb3();

  const { chainId, account } = web3Data;

  const dailyReward = useMemo(() => element.rewardPerBlock.ethereansosMul(6400), [element && element.rewardPerBlock]);

  const logoContainer = useMemo(() => {
    var result = <LogoRenderer badge input={element.rewardToken} />;
    return element.rewardTokenAddress === VOID_ETHEREUM_ADDRESS ? (
      result
    ) : element.rewardToken.mainInterface ? (
      <Link to={`/items/dapp/items/${element.rewardToken.id}`}>{result}</Link>
    ) : (
      <a
        target="_blank"
        href={`${getNetworkElement({ context, chainId }, "etherscanURL")}token/${element.rewardToken.address}`}
        rel="noreferrer"
      >
        {result}
      </a>
    );
  }, [element && element.rewardTokenAddress]);

  const [edit, setEdit] = useState();

  return (
    <>
      <div className={style.FarmContent}>
        <div className="FarmingSetup-Row">
          {element.setups[element.setups.length - 1] && (
            <SetupComponent
              {...{
                ...props,
                setupInput: element.setups[element.setups.length - 1],
                element,
                refresh,
              }}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default farmingComponent;
