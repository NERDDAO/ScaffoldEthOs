import React from 'react'

import OurCircularProgress from '../OurCircularProgress'
import RegularModal from '../../Global/RegularModal'
import ConnectWidget from './widget'

import { useWeb3, web3States } from '@ethereansos/interfaces-core'
import { connectModalTitle } from '../../constants'

const Connect = ({ children }) => {
  const { web3, setConnector, errorMessage, connectors, connectionStatus } = useWeb3()

  return <React.Fragment>
    {
      connectionStatus === web3States.CONNECTED
        ? web3 ? children : <OurCircularProgress />
        : <RegularModal>
          <ConnectWidget
            title={connectModalTitle}
            {...{ connectionStatus, connectors, setConnector, errorMessage }}
          />
        </RegularModal>
    }
  </React.Fragment>
}

export default Connect
