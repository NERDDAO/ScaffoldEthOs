import { useEthosContext, useWeb3, web3States } from '@ethereansos/interfaces-core';
import makeBlockie from 'ethereum-blockies-base64';
import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
// import Modal from 'react-bootstrap/Modal';

const Web3Connect = () => {
  const context = useEthosContext()
  const { chainId, account, connectionStatus, setConnector, web3, newContract } = useWeb3()
  // const [openWalletInfo, setOpenWalletInfo] = useState(false);
  const [ensData, setEnsData] = useState()

  useEffect(() => {
    setTimeout(async () => {
      const address = account
      if (ensData && ensData.account === account && ensData.chainId === chainId) {
        return
      }
      var name
      try {
        const ethersProvider = new ethers.providers.Web3Provider(web3.currentProvider)
        name = await ethersProvider.lookupAddress(address)
      } catch (e) {
        var index = e.message.split('\n')[0].indexOf('value="')
        if (index !== -1) {
          name = e.message.substring(index + 7)
          name = name.substring(0, name.indexOf("\""))
        }
      }
      setEnsData(oldValue => ({ ...oldValue, name, account, chainId }))
    })
  }, [account, chainId, ensData])

  const blockie = !ensData?.name ? makeBlockie(account) : undefined

  const truncateFromCenter = (value) => {
    return value.substring(0, 8) + '...' + value.substring(value.length - 3, value.length);
  }

  return (
    <React.Fragment>
      {/* <Modal className='wallet-info-modal' show={openWalletInfo} onHide={() => setOpenWalletInfo(!openWalletInfo)}>
        <Modal.Body className='no-pad'>
          <div className="banner-sub-block ">
            <div className="banner-sub-main">
              <h3>WALLET INFORMATION</h3>
            </div>
            <div className="banner-address">{account}</div>
            <div className="banner-sub-buttons sub-buttons-right sub-buttons-single">
              <button className="button l-btn" onClick={() => setOpenWalletInfo(!openWalletInfo)}>
                <span>Close</span>
              </button>
            </div>
          </div>
        </Modal.Body>
      </Modal> */}
      <div className='button btn-main'>
        <p>{connectionStatus === web3States.NOT_CONNECTED ? "Connect Wallet" : truncateFromCenter(account)}</p>
      </div>
    </React.Fragment>
  )
}

export default Web3Connect
