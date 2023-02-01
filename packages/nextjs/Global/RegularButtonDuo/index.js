import React from 'react'
import { usePlaceholder } from '@ethereansos/interfaces-core'
import { Link } from 'next/link'
import { Typography } from '@ethereansos/interfaces-ui'

import style from '../../all.module.css'

const RegularButtonDuo  = ({className, children, onClick}) => {
    return (
        <button className={className} onClick={onClick}>{children}</button>
    )
}

export default RegularButtonDuo