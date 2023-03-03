import React from "react";

import ChatIcon from '@mui/icons-material/Chat';

import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Card from '@mui/material/Card';
import {
    FormGroup, FormControlLabel, FormControl, FormLabel, FormHelperText, Radio,
    RadioGroup, CardContent, Select, MenuItem
} from "@mui/material";
import { languageNames } from "../Utils"


function Home({ clavis, replaceItem, newPerson, newImage }) {

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

    const setMainLanguage = (l) => {
        if (!!l) {
            clavis["language"] = [l].concat(clavis["language"].filter(x => x !== l))
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

    const language = !!clavis["language"].length ? clavis["language"][0] : false

    return (
        <div className='content-section'>
            <h1 className="bp4-heading">General information</h1>

            <Card className="formCard">
                <CardContent>
                    <FormControl component="fieldset" variant="standard" fullWidth>
                        <FormLabel component="legend">Main language</FormLabel>

                        {
                            <FormGroup>
                                <Select
                                    fullWidth
                                    sx={{ m: 0, marginY: "5px" }}
                                    id="statement-taxon"
                                    value={language}
                                    onChange={(e) => { setMainLanguage(e.target.value) }}
                                >

                                    {!!clavis["language"].length && (
                                        <MenuItem value={clavis["language"][0]} key={clavis["language"][0]}>
                                            <ChatIcon fontSize="inherit" /> {languageNames[clavis["language"][0]]}
                                        </MenuItem>
                                    )}

                                    {!clavis["language"].length && (
                                        <MenuItem value={false}>Choose the main language...</MenuItem>
                                    )}


                                    {
                                        Object.entries(languageNames)
                                            .filter(([key, value]) =>
                                                clavis["language"].length === 0 || key !== clavis["language"][0]
                                            )
                                            .map(([key, value]) =>
                                                <MenuItem value={key} key={key}>{value}</MenuItem>
                                            )
                                    }

                                </Select>
                            </FormGroup>
                        }

                        <FormHelperText>The main language of the key. You can add secondary languages under "Translations".</FormHelperText>
                    </FormControl>
                </CardContent>
            </Card>

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

            {!!language &&
                <Card className="formCard" >
                    <CardContent>
                        <FormControl component="fieldset" variant="standard" fullWidth>
                            <FormLabel component="legend">Title</FormLabel>
                            <FormGroup>
                                {getLanguageInput("title", "E.g. 'Birds of Norway'", language, true)}
                            </FormGroup>

                            <FormHelperText>Appears as the name of the key.</FormHelperText>
                        </FormControl>
                    </CardContent>
                </Card >
            }

            {!!language &&
                <Card className="formCard" >
                    <CardContent>
                        <FormControl component="fieldset" variant="standard" fullWidth>
                            <FormLabel component="legend">Creator</FormLabel>
                            <FormGroup>
                                {getLanguageInput("creator", "E.g. 'Wouter Koch'", language)}
                            </FormGroup>

                            <FormHelperText>The name of the creator of the key.</FormHelperText>
                        </FormControl>
                    </CardContent>
                </Card >
            }

            {!!language &&
                <Card className="formCard" >
                    <CardContent>
                        <FormControl component="fieldset" variant="standard" fullWidth>
                            <FormLabel component="legend">Audience</FormLabel>
                            <FormGroup>
                                {getLanguageInput("audience", "E.g. 'Undergraduate students and up'", language)}

                            </FormGroup>

                            <FormHelperText>Description of the intended audience for the key.</FormHelperText>
                        </FormControl>
                    </CardContent>
                </Card >
            }

            {!!language &&
                <Card className="formCard" >
                    <CardContent>
                        <FormControl component="fieldset" variant="standard" fullWidth>
                            <FormLabel component="legend">Region name</FormLabel>
                            <FormGroup>
                                {getLanguageInput("geography", "E.g. 'Norway', 'Europe', 'Trøndelag', etc.", language)}
                            </FormGroup>
                            <FormHelperText>The name of the region for which the key is valid (e.g. covers all subtaxa).</FormHelperText>
                        </FormControl>
                    </CardContent>
                </Card>
            }


            {!!language &&
                <Card className="formCard" >
                    <CardContent>
                        <FormControl component="fieldset" variant="standard" fullWidth>
                            <FormLabel component="legend">Description</FormLabel>
                            <FormGroup>
                                {getLanguageInput("description", "Describe the key", language)}
                            </FormGroup>

                            <FormHelperText>Short description of the key.</FormHelperText>
                        </FormControl>
                    </CardContent>
                </Card >
            }
            {!!language &&

                <Card className="formCard" >
                    <CardContent>
                        <FormControl component="fieldset" variant="standard" fullWidth>
                            <FormLabel component="legend">Description ID</FormLabel>
                            <FormGroup>
                                {getLanguageInput("descriptionUrl", "Provide an ID", language)}
                            </FormGroup>

                            <FormHelperText>ID of an article describing the key on NBIC's site.</FormHelperText>
                        </FormControl>
                    </CardContent>
                </Card >
            }
        </div >


    );
}

export default Home;
