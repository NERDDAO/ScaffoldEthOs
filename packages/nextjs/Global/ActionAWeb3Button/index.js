import React from 'react';

import style from "../../all.module.css";
import OurCircularProgress from '../OurCircularProgress';

const ActionAWeb3Button = ({ setLoading, loading, removeDiv, children, onClick, type, onSuccess, className, disabled }) => {

    var realType = type && (type = type[0].toUpperCase() + type.substring(1))

    async function onButtonClick() {
        if (!onClick) {
            return
        }
        var errorMessage;
        try {
            var elem = onClick()
            elem && (elem = !elem.then ? elem : (await elem))
            onSuccess && setTimeout(() => {
                onSuccess(elem);
                if(setLoading) setLoading(false);
            })
        } catch (e) {
            errorMessage = e.message || e
        }
        errorMessage && setTimeout(() => {
            alert(errorMessage);
            if(setLoading) setLoading(false);
        })
    }

    return (
        <React.Fragment>
            {removeDiv
                ? <button disabled={disabled} className={(!realType ? style.ActionAMain : style["ActionAWeb3Button" + realType]) + (className ? ' ' + className : '') + (disabled ? style.disabled : '')} onClick={onButtonClick}>
                    {loading ? <OurCircularProgress /> : null}
                    {children}
                </button>
                : <div className={!realType ? style.ActionAWeb3Button : style["ActionAWeb3Button" + realType]}>
                    <button disabled={disabled} className={(!realType ? style.ActionAMain : style["ActionAWeb3Button" + realType]) + (className ? ' ' + className : '') + (disabled ? style.disabled : '')} onClick={onButtonClick}>
                        {loading ? <OurCircularProgress /> : null}
                        {children}
                    </button>
                </div>
            }
        </React.Fragment>
    )
}

export default ActionAWeb3Button