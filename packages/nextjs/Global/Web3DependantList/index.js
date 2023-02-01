import { useWeb3 } from "@ethereansos/interfaces-core";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { customContractAddress } from "../../constants";

import OurCircularProgress from "../OurCircularProgress";

export const Web3DependantList = ({
  discriminant,
  Renderer,
  emptyMessage,
  provider,
  searchText,
  renderedProperties,
  rendererIsContainer,
  allowEmpty,
  fixedList,
  sortOrder,
  filter,
}) => {
  const { chainId } = useWeb3();

  const [elements, setElements] = useState(null);

  const [error, setError] = useState("");

  useEffect(() => {
    refreshElements(true);
  }, [chainId, discriminant]);

  const refreshElements = useCallback(
    async withLoader => {
      withLoader === true && setElements(null);
      setError("");
      setTimeout(async () => {
        while (true) {
          try {
            var els = provider();
            els = els.then ? await els : els;
            els = els instanceof Array ? els : [els];
            return setElements(els);
          } catch (e) {
            console.log(e);
            var message = (e.stack || e.message || e).toLowerCase();
            if (message.indexOf("header not found") === -1 && message.indexOf("response has no error") === -1) {
              return setError("Error while loading: " + (e.message || e));
            }
            await new Promise(ok => setTimeout(ok, 3000));
          }
        }
      });
    },
    [provider],
  );

  var outputElements = elements;

  var message = error ? (
    <h2>{error}</h2>
  ) : emptyMessage !== undefined && emptyMessage !== null ? (
    typeof emptyMessage === "string" ? (
      <h2>{emptyMessage}</h2>
    ) : (
      emptyMessage
    )
  ) : (
    <h2>No elements to display</h2>
  );

  const Row = useCallback(
    ({ data, index, style }) => (
      <div style={style}>
        <Renderer {...{ refreshElements, ...renderedProperties }} element={data[index]} />
      </div>
    ),
    [Renderer, refreshElements, renderedProperties],
  );

  if (outputElements) {
    outputElements = outputElements.filter(o => o.address.toLowerCase() === customContractAddress.toLowerCase());
    outputElements = [...new Map(outputElements.map(m => [m.address.toLowerCase(), m])).values()];
  }

  return !error && !outputElements ? (
    <div className="loader-wrap-text">
      <OurCircularProgress />
      <p>Fetching data...</p>
    </div>
  ) : outputElements && outputElements.length > 0 ? (
    <div className="list">
      {outputElements.map((element, index) => (
        <Renderer {...{ refreshElements, ...renderedProperties }} key={index} element={element} />
      ))}
    </div>
  ) : (
    message
  );
};

export default Web3DependantList;
