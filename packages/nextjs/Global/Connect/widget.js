import React, { useState, Fragment, useEffect } from 'react'

import { Button, Typography } from '@ethereansos/interfaces-ui'

import OurCircularProgress from '../OurCircularProgress'

import { web3States } from '@ethereansos/interfaces-core'
import { connectModalButtonText, connectModalDesc, connectModalHideRefresh } from '../../constants'

export const ConnectWidget = ({
  title,
  connectionStatus,
  connectors,
  setConnector,
  errorMessage
}) => {

  var previousConnector = null;

  try {
    var connectorId = window.localStorage.connector
    previousConnector = connectors.filter(it => it.id === connectorId)[0]
  } catch (e) {
  }

  const [activeConnector, setActiveConnector] = useState(previousConnector)

  useEffect(() => {
    setConnector(activeConnector)
    try {
      window.localStorage.setItem("connector", null)
      window.localStorage.setItem("connector", activeConnector.id)
    } catch (e) { }
  }, [activeConnector])

  return (
    <div className="widget-block">
      <h1>{title}</h1>
      {
        connectionStatus === web3States.CONNECTED &&
        <div>Connected</div>
      }
      {
        !errorMessage && connectionStatus === web3States.CONNECTING &&
        <p className="Web3" dangerouslySetInnerHTML={{ __html: connectModalDesc }}></p>
      }
      {
        errorMessage && connectionStatus === web3States.CONNECTING &&
        <p className="Web3" dangerouslySetInnerHTML={{ __html: connectModalDesc }}></p>
      }
      {
        connectionStatus === web3States.NOT_CONNECTED &&
        <p className="Web3" dangerouslySetInnerHTML={{ __html: connectModalDesc }}></p>
      }

      <div className="widget-block-btm">
        {
          !connectModalHideRefresh &&
          <button
            className="button l-btn"
            onClick={() => window.location.reload()}>
            Refresh
          </button>
        }
        {
          connectors.map(connector => (
            <Fragment key={connector.id}>
              <button
                disabled={(connectionStatus === web3States.CONNECTING && !errorMessage)}
                className={`button btn-main ${connectModalHideRefresh ? 'w-100' : ''}`}
                onClick={() => setActiveConnector(connector)}>
                {connectionStatus === web3States.CONNECTING && !errorMessage && <OurCircularProgress />}
                {connectModalButtonText.length > 0 ? connectModalButtonText : connector.buttonText}
              </button>
            </Fragment>
          ))
        }
      </div>

      {/* <br />
      <br />
      // {errorMessage &&
      //   <Typography variant="body1">{errorMessage}</Typography>
      // } */}
    </div>
  )
}

export default ConnectWidget;