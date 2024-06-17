
import * as React from "react";
import {ClavisViewer} from "@artsdatabanken/clavis-viewer-web";

import { deepClone } from "../Utils";

function TestView({ clavis }) {

    const workingClavis = deepClone(clavis)

    return (
        <div className="testview">
            <ClavisViewer clavis={workingClavis} />
        </div>
    );
}

export default TestView;
