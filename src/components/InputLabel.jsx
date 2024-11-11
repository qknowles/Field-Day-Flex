import classNames from "classnames";
import React from 'react';

export default function InputLabel({
                                       label,
                                       layout = "horizontal",
                                       input,
                                   }) {
    const containerClass = classNames("relative", {
        "flex flex-col": layout === "vertical",
        "flex items-center justify-end": layout === "horizontal",
    });

    const labelClass = classNames("text-sm text-left p-2");

    return (
        <div className={containerClass}>
            {label && <label className={labelClass}>{`${label}:`}</label>}
            {input}
        </div>
    );
}