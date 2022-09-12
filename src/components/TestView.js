
import * as React from "react";
import Identification from "../key-player/components/Identification"
import { deepClone } from "../Utils";

function TestView({ clavis }) {

    const workingClavis = deepClone(clavis)

    return (
        <div className="testview">
            <Identification clavis={workingClavis} />
        </div>
    );
}

export default TestView;
