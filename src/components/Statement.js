import React, { useState } from "react";
import { Draggable } from "react-beautiful-dnd";

import {
  Card, IconButton, ButtonGroup, Button, Accordion, AccordionSummary, AccordionDetails
} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import { flattenTaxa, getBestString, getDraggableItemStyle } from "../Utils"


function Statement({ statement, characters, taxa, setStatementValue, setEditing, editing, replaceItem, deleteItem, index }) {
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
    <Draggable key={statement[0].id} draggableId={statement[0].id} index={index}>
      {(provided, snapshot) => (
        <div
          className="taxonContainer"
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={getDraggableItemStyle(
            snapshot.isDragging,
            provided.draggableProps.style
          )}
        >
          <Card className="formCard"  {...provided.dragHandleProps}>

            <Accordion>
              <AccordionSummary {...provided.dragHandleProps} expandIcon={<ExpandMoreIcon />}>
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
                        <Button variant={fact.frequency !== 1 && fact.frequency !== 0 ? "contained" : "outlined"} color="warning" onClick={e => setStatementValue("frequency", fact, .5)}>In some cases</Button>
                        <Button variant={fact.frequency === 0 ? "contained" : "outlined"} color="error" onClick={e => setStatementValue("frequency", fact, 0)}>Never</Button>
                      </ButtonGroup>
                    </div>
                  )}
                </div>
              </AccordionDetails>


            </Accordion>
          </Card >
        </div>
      )}

    </Draggable >
  );
}

export default Statement;
