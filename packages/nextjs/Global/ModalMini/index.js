import React from 'react'
import { usePlaceholder } from '@ethereansos/interfaces-core'
import { Link } from 'next/link'
import { Typography } from '@ethereansos/interfaces-ui'

import style from '../../all.module.css'
import TokensSelector from './tokens-selector.js'

const ModalMini  = (props) => {
    return (
        <div className={style.ModalBack}>
            <div className={style.ModalMiniBox}>
                <TokensSelector></TokensSelector>
            </div>
        </div>
    )
}

    export default ModalMini