
import * as React from "react";
import {languageNames} from "../Utils"

import Card from '@mui/material/Card';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

function Resources({ clavis, setValue }) {

    const onFieldChange = (e) => {
        const l = e.target.id.slice(-2);
        const field = e.target.id.split(":")[0];
        const id = e.target.id.slice(0, -3);
        setValue(field, e.target.value, l, id)
    }

    const getPerson = (p) => {
        return (<Card >
            <TextField id={"key-personId"} disabled={true} value={p["id"]} />
            {clavis["language"].map(function (l) {
                return getLanguageInput(p, l)
            })}
        </Card>);

    }

    const getLanguageInput = (person, l) => {
        return <p><TextField key={person["id"] + "-" + l} id={person["id"] + "-" + l} InputProps={{
            startAdornment: <InputAdornment minimal={true}>{languageNames[l]}</InputAdornment>
        }} onChange={onFieldChange} value={person["name"][l]} /></p>;

    }


    return (
        <div>
            <h1 className="bp4-heading">Resources</h1>

            <Card >
                <div
                    helperText="The persons referred to in the key"
                    label="Persons"
                >
                    {clavis["persons"].map(function (p) {
                        return getPerson(p)
                    })}
                </div>
            </Card>

        </div>


    );
}

export default Resources;
