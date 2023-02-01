import { sendAsync, useEthosContext, useWeb3 } from '@ethereansos/interfaces-core';
import React, { useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import { customNavItems, customNavLogo, customNavLogoAlt } from '../../constants';
import Web3Connect from '../Web3Connect';

const Header = (props) => {
  const context = useEthosContext()
  const web3Data = useWeb3()
  const { chainId, web3, dualChainId } = web3Data

  const history = useHistory()

  const switchToNetwork = useCallback(() => sendAsync(web3.currentProvider, 'wallet_switchEthereumChain', { chainId: "0x" + parseInt(dualChainId || Object.entries(context.dualChainId).filter(it => parseInt(it[1]) === chainId)[0][0]).toString(16) }).then(() => history.push('/dapp')), [chainId, dualChainId, history])

  const openMenu = () => {
    const body = document.body;
    if (body) {
      if (body.classList.contains('menu-open')) {
        body.classList.add('menu-ani');
        setTimeout(function () {
          body.classList.remove('menu-ani');
          body.classList.remove('menu-open');
        }, 300);
      } else {
        body.classList.add('menu-open');
      }
    }
  }

  return (
    <React.Fragment>
      <div id="bg-wrapper"></div>
      <div id="navbar">
        <div className="container">
          <div className="navbar-header">
            <a className="logo-main" href="/">
              <img src={customNavLogo} alt={customNavLogoAlt} />
            </a>
            <button type="button" className="nav-toggle nav-trigger" onClick={() => openMenu()}>
              <div className="nav-icon"><span></span></div>
            </button>
            <div className="nav-wrap">
              <nav id="nav-main" className="nav-full">
                <ul>
                  {
                    customNavItems.map((item) => {
                      return <li className={item.showMobile ? 'show-mob' : ''}><a href={item.url} target="_blank" title={item.text} rel="noreferrer">{item.text}</a></li>
                    })
                  }
                </ul>
              </nav>
              <nav id="nav-right">
                <div className="nav-right-buttons">
                  <Web3Connect />
                </div>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
    // <header className={style.Header}>
    //   <div className={style.FixedHeader}>
    //     {/* <Link to="/dapp" className={style.logoMain}><img src={`${process.env.PUBLIC_URL}/img/logo_main.png`}/></Link> */}
    //     {/* <Navigation menuName={props.menuName} isDapp={props.isDapp} selected={props.link}/> */}
    //   </div>
    //   <div className={style.RightMenu}>
    //     <div className={style.NetworkSelect}>
    //       <div>
    //         <a className={style.NetworkSelectL1 + (!dualChainId ? (' ' + style.opacity1) : '')} onClick={dualChainId && switchToNetwork}>
    //           <img src={`${process.env.PUBLIC_URL}/img/ethereum.png`}/>
    //           <p>ETH</p>
    //         </a>
    //         <a className={style.NetworkSelectL2 + (dualChainId ? (' ' + style.opacity1) : '')} onClick={!dualChainId && switchToNetwork}>
    //           <img src={`${process.env.PUBLIC_URL}/img/Optimism.png`}/>
    //           <p>OP</p>
    //         </a>
    //       </div>
    //     </div>
    //     <Web3Connect/>
    //     <div className={style.ThemeSelect}>
    //       <select value={theme} onChange={e => setTheme(e.currentTarget.value)}>
    //         {themes.map(it => <option key={it.value} value={it.value}>{it.name}</option>)}
    //       </select>
    //     </div>
    //   </div>
    //   <div className={style.BlurHeader}></div>
    // </header>
  )
}

export default Header