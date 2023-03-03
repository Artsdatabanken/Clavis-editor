import React, { useState } from "react";

import ChatIcon from '@mui/icons-material/Chat';
import DeleteIcon from '@mui/icons-material/Delete';

import Card from '@mui/material/Card';
import {
  FormGroup, FormControl, FormLabel, FormHelperText,
  CardContent, Select, MenuItem, IconButton
} from "@mui/material";
import { languageNames } from "../Utils"

function Translations({ clavis, replaceItem }) {
  const [removing, setRemoving] = useState(false);

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

  return (
    <div className='content-section'>
      <h1 className="bp4-heading">Translations</h1>

      <Card className="formCard">
        <CardContent>
          <FormControl component="fieldset" variant="standard" fullWidth>
            <FormLabel component="legend">Languages</FormLabel>

            {clavis["language"].slice(1).map(l =>
              <h4 style={{ "margin": "0.5em" }} key={l}>
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
                        <MenuItem value={key} key={key}>{value}</MenuItem>

                      )
                  }

                </Select>

              </FormGroup>

            }

            <FormHelperText>The languages supported by the key, in addition to the main language. Select at least one to start adding translations of texts.</FormHelperText>
          </FormControl>
        </CardContent>
      </Card>



    </div >


  );
}

export default Translations;
