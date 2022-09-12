import React, { useState } from "react";

import ChatIcon from '@mui/icons-material/Chat';
import DeleteIcon from '@mui/icons-material/Delete';

import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Card from '@mui/material/Card';
import {
    FormGroup, FormControlLabel, FormControl, FormLabel, FormHelperText, Radio,
    RadioGroup, CardContent, Alert, Select, MenuItem, IconButton
} from "@mui/material";
import { languageNames } from "../Utils"

function Home({ clavis, replaceItem, newPerson, newImage }) {
    const [removing, setRemoving] = useState(false);

    const onFieldChange = (e) => {
        const language = e.target.id.slice(-2);
        const field = e.target.id.slice(0, -3).replace("key-", "");
        const value = e.target.value

        if (!(field in clavis) && field !== "creator") {
            clavis[field] = {}
        }

        if (field === "geography") {
            if (!("name" in clavis["geography"])) {
                clavis["geography"]["name"] = {}
            }
            clavis["geography"]["name"][language] = value
        }
        else if (field === "descriptionUrl") {
            clavis["descriptionUrl"][language] = {
                "serviceId": "service:nbic_page",
                "externalId": value
            }
        }
        else if (field === "creator") {
            if (!clavis["creator"]) {
                let personId = newPerson()
                clavis["creator"] = personId
            }
            clavis["persons"].map(p => {
                if (p["id"] === clavis["creator"]) {
                    p["name"][language] = value
                }
                return p
            })
        }
        else {
            clavis[field][language] = value
        }
        replaceItem(clavis)


    }

    const addLanguage = (l) => {
        if (!!l && !clavis["language"].includes(l)) {
            clavis["language"].push(l)
            replaceItem(clavis)
        }
    }

    const removeLanguage = (l) => {
        if (!!l && clavis["language"].includes(l)) {
            clavis["language"] = clavis["language"].filter(x => x !== l)
            replaceItem(clavis)
        }
    }

    const setLicense = (e) => {
        clavis["license"] = e.target.value
        replaceItem(clavis)
    }

    const getLanguageInput = (name, placeholder, l, required) => {
        let value = ""
        if (name in clavis) {
            if (name === "geography")
                value = clavis["geography"]["name"][l]
            else if (name === "descriptionUrl" && clavis["descriptionUrl"][l])
                value = clavis["descriptionUrl"][l]["externalId"]
            else if (name === "creator")
                value = clavis["persons"].filter(p => p["id"] === clavis["creator"])[0]["name"][l]
            else
                value = clavis[name][l]
        }

        return <TextField
            sx={{ m: 1 }}
            fullWidth
            label={required ? "Required" : ""}
            InputProps={{
                startAdornment: <InputAdornment position="start">{languageNames[l]}</InputAdornment>,
            }}
            key={"key-" + name + "-" + l}
            id={"key-" + name + "-" + l}
            placeholder={placeholder}
            onChange={onFieldChange}
            value={value} />;
    }

    return (
        <div className='content-section'>
            <h1 className="bp4-heading">General information</h1>

            <Card className="formCard">
                <CardContent>
                    <FormControl component="fieldset" variant="standard" fullWidth>
                        <FormLabel component="legend">Languages</FormLabel>

                        {clavis["language"].map(l =>
                            <h4 style={{ "margin": "0.5em" }}>
                                <ChatIcon fontSize="inherit" /> {languageNames[l]}
                                <IconButton aria-label="delete" color={removing === l ? "error" : "default"}
                                    onClick={() => {
                                        if (removing === l) {
                                            removeLanguage(l)
                                        }
                                        else {
                                            setRemoving(l)
                                        }
                                    }} variant="contained"><DeleteIcon /></IconButton>
                            </h4>
                        )}

                        {
                            clavis["language"].length < Object.keys(languageNames).length &&
                            <FormGroup>
                                <Select
                                    fullWidth
                                    sx={{ m: 0, marginY: "5px" }}
                                    id="statement-taxon"
                                    value={false}
                                    onChange={(e) => { addLanguage(e.target.value) }}
                                >
                                    <MenuItem value={false}>Add a language...</MenuItem>
                                    {
                                        Object.entries(languageNames)
                                            .filter(([key, value]) => {
                                                return !clavis["language"].includes(key)
                                            })
                                            .map(([key, value]) =>
                                                <MenuItem value={key}>{value}</MenuItem>

                                            )
                                    }

                                </Select>

                            </FormGroup>

                        }

                        <FormHelperText>The languages supported by the key. Select at least one.</FormHelperText>
                    </FormControl>
                </CardContent>
            </Card>

            <Card className="formCard" >
                <CardContent>
                    <FormControl component="fieldset" variant="standard" fullWidth>
                        <FormLabel component="legend">Title</FormLabel>
                        <FormGroup>

                            {clavis["language"].map(function (l) {
                                return getLanguageInput("title", "E.g. 'Birds of Norway'", l, true)
                            })}
                            {
                                !clavis["language"].length &&
                                <Alert severity="error">Add at least one language first.</Alert>
                            }
                        </FormGroup>

                        <FormHelperText>Appears as the name of the key.</FormHelperText>
                    </FormControl>
                </CardContent>
            </Card >

            <Card className="formCard" >
                <CardContent>
                    <FormControl component="fieldset" variant="standard" fullWidth>
                        <FormLabel>License</FormLabel>
                        <RadioGroup
                            name="key-license"
                            onChange={setLicense}
                            value={clavis["license"] || ""}
                        >
                            <FormControlLabel label="CC BY 4.0" control={<Radio />} value="https://creativecommons.org/licenses/by/4.0/" />
                            <FormControlLabel label="CC BY-SA 4.0" control={<Radio />} value="https://creativecommons.org/licenses/by-sa/4.0/" />
                        </RadioGroup>
                        <FormHelperText>Determines how others may reuse this key. Required.</FormHelperText>
                    </FormControl>
                </CardContent>
            </Card>

            <Card className="formCard" >
                <CardContent>
                    <FormControl component="fieldset" variant="standard" fullWidth>
                        <FormLabel component="legend">Creator</FormLabel>
                        <FormGroup>

                            {clavis["language"].map(function (l) {
                                return getLanguageInput("creator", "E.g. 'Wouter Koch'", l)
                            })}
                            {
                                !clavis["language"].length &&
                                <Alert severity="error">Add at least one language first.</Alert>
                            }
                        </FormGroup>

                        <FormHelperText>The name of the creator of the key.</FormHelperText>
                    </FormControl>
                </CardContent>
            </Card >

            <Card className="formCard" >
                <CardContent>
                    <FormControl component="fieldset" variant="standard" fullWidth>
                        <FormLabel component="legend">Audience</FormLabel>
                        <FormGroup>
                            {clavis["language"].map(function (l) {
                                return getLanguageInput("audience", "E.g. 'Undergraduate students and up'", l)
                            })}
                            {
                                !clavis["language"].length &&
                                <Alert severity="error">Add at least one language first.</Alert>
                            }
                        </FormGroup>

                        <FormHelperText>Description of the intended audience for the key.</FormHelperText>
                    </FormControl>
                </CardContent>
            </Card >


            <Card className="formCard" >
                <CardContent>
                    <FormControl component="fieldset" variant="standard" fullWidth>
                        <FormLabel component="legend">Region name</FormLabel>
                        <FormGroup>
                            {clavis["language"].map(function (l) {
                                return getLanguageInput("geography", "E.g. 'Norway', 'Europe', 'Trøndelag', etc.", l)
                            })}
                            {
                                !clavis["language"].length &&
                                <Alert severity="error">Add at least one language first.</Alert>
                            }
                        </FormGroup>

                        <FormHelperText>The name of the region for which the key is valid (e.g. covers all subtaxa).</FormHelperText>
                    </FormControl>
                </CardContent>
            </Card>

            <Card className="formCard" >
                <CardContent>
                    <FormControl component="fieldset" variant="standard" fullWidth>
                        <FormLabel component="legend">Description</FormLabel>
                        <FormGroup>
                            {clavis["language"].map(function (l) {
                                return getLanguageInput("description", "Describe the key", l)
                            })}
                            {
                                !clavis["language"].length &&
                                <Alert severity="error">Add at least one language first.</Alert>
                            }
                        </FormGroup>

                        <FormHelperText>Short description of the key.</FormHelperText>
                    </FormControl>
                </CardContent>
            </Card >

            <Card className="formCard" >
                <CardContent>
                    <FormControl component="fieldset" variant="standard" fullWidth>
                        <FormLabel component="legend">Description ID</FormLabel>
                        <FormGroup>
                            {clavis["language"].map(function (l) {
                                return getLanguageInput("descriptionUrl", "Provide and ID", l)
                            })}
                            {
                                !clavis["language"].length &&
                                <Alert severity="error">Add at least one language first.</Alert>
                            }
                        </FormGroup>

                        <FormHelperText>ID of an article describing the key on NBIC's site.</FormHelperText>
                    </FormControl>
                </CardContent>
            </Card >

        </div >


    );
}

export default Home;
