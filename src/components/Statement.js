import React, { useState } from "react";

import {
  Card, IconButton, ButtonGroup, Button, Accordion, AccordionSummary, AccordionDetails
} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import { flattenTaxa, getBestString } from "../Utils"


function Statement({ statement, characters, taxa, setStatementValue, deleteItem, index }) {
  const [removing, setRemoving] = useState(false);

  let character
  if (!!statement[0].character) {
    character = characters.find(x => x.id === statement[0].character)
  }

  let taxon
  if (!!statement[0].taxon) {
    taxon = flattenTaxa(taxa).find(x => x.id === statement[0].taxon)
  }
  
  return (
    <div key={statement[0].id} index={index}>
      {
        <div
          className="taxonContainer"
        >
          <Card className="formCard">
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <div className="sideBySide" style={{ flexGrow: "1" }}>
                  <div style={{ flexGrow: "1" }}>
                    <div><b>Taxon:</b>&nbsp;
                      <i>{taxon["scientificName"]}</i>
                      { !!taxon.label &&
                        <span>({getBestString(taxon.label)})</span>
                      }
                    </div>

                    <div><b>Character:</b>&nbsp;
                      <span>{getBestString(character["title"])}</span>
                    </div>
                  </div>

                  <div className="cardActions">
                    <IconButton aria-label="delete" color={removing === statement ? "error" : "default"}
                      onClick={() => {
                        if (removing === statement) {
                          deleteItem(statement)
                        }
                        else {
                          setRemoving(statement)
                        }
                      }} variant="contained"><DeleteIcon /></IconButton>
                  </div>
                </div>

              </AccordionSummary>
              <AccordionDetails style={{ flexGrow: "1" }}>
                <div style={{ flexGrow: "1" }}>

                  {statement.map(fact =>
                    <div style={{ flexGrow: "1" }} className="sideBySide">
                      <div>{getBestString(character["states"].find(x => x.id === fact.value)["title"])}</div>
                      <ButtonGroup size="small" aria-label="outlined primary button group">
                        <Button variant={fact.frequency === 1 ? "contained" : "outlined"} color="success" onClick={e => setStatementValue("frequency", fact, 1)}>Always</Button>
                        <Button variant={fact.frequency !== 1 && fact.frequency > 0 ? "contained" : "outlined"} color="warning" onClick={e => setStatementValue("frequency", fact, .5)}>In some cases</Button>
                        <Button variant={fact.frequency === 0 ? "contained" : "outlined"} color="error" onClick={e => setStatementValue("frequency", fact, 0)}>Never</Button>
                      </ButtonGroup>
                    </div>
                  )}
                </div>
              </AccordionDetails>


            </Accordion>
          </Card >
        </div>
      }

    </div >
  );
}

export default Statement;
