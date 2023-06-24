
import * as React from "react";
import Identification from "../Clavis-player/src/components/Identification"
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
