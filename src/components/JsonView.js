
import * as React from "react";
import Card from '@mui/material/Card';


function JsonView({ clavis }) {
    const PrettyPrintJson = ({ data }) => (<div><pre>{
        JSON.stringify(data, null, 2)}</pre></div>);

    return (
        <div>
            <h1 className="bp4-heading">JSON</h1>

            <Card >
                <PrettyPrintJson data={clavis} />
            </Card>

        </div>


    );
}

export default JsonView;
