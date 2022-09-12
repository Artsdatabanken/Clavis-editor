import React, { useState } from "react";
import { Draggable } from "react-beautiful-dnd";

import {
  CardContent, Select, Card, MenuItem, IconButton
} from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import { flattenTaxa, getBestString, getDraggableItemStyle } from "../Utils"


function Statement({ statement, characters, taxa, setStatementValue, setEditing, editing, replaceItem, deleteItem, index }) {
  const [removing, setRemoving] = useState(false);

  let character
  if (!!statement.character) {
    character = characters.find(x => x.id === statement.character)
  }

  return (
    <Draggable key={statement.id} draggableId={statement.id} index={index}>
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


            <CardContent className="sideBySide">
              <div style={{ flexGrow: "1" }}>

                <p><b>Taxon:</b>&nbsp;
                  {
                    editing.id === statement.id && editing.field === "taxon" &&
                    <Select
                      fullWidth
                      sx={{ m: 0, marginY: "5px" }}
                      id="statement-taxon"
                      value={statement["taxon"]}
                      onChange={(e) => { setStatementValue("taxon", statement, e.target.value) }}
                      onClose={(e) => { setEditing(false) }}

                    >
                      {flattenTaxa(taxa).map(taxon =>
                        <MenuItem value={taxon["id"]}>{taxon["level"]}{taxon["scientificName"] || getBestString(taxon["label"])}</MenuItem>
                      )}
                    </Select>
                  }
                  {
                    (editing.id !== statement.id || editing.field !== "taxon") &&
                    <span onClick={() => setEditing({ "id": statement.id, "field": "taxon" })}>
                      {
                        !!statement.taxon &&
                        <i>{flattenTaxa(taxa).find(x => x.id === statement.taxon)["scientificName"]}</i>
                      }
                      <IconButton aria-label="edit" size="small"><EditIcon fontSize="inherit" /></IconButton></span>
                  }
                </p>


                <p><b>Character:</b>&nbsp;
                  {
                    editing.id === statement.id && editing.field === "character" &&
                    <Select
                      fullWidth
                      sx={{ m: 0, marginY: "5px" }}
                      id="statement-character"
                      value={statement["character"]}
                      onChange={(e) => { setStatementValue("character", statement, e.target.value) }}
                      onClose={(e) => { setEditing(false) }}

                    >
                      {characters.map(character =>
                        <MenuItem value={character["id"]}>{getBestString(character["title"])}</MenuItem>
                      )}
                    </Select>
                  }
                  {
                    (editing.id !== statement.id || editing.field !== "character") &&
                    <span onClick={() => setEditing({ "id": statement.id, "field": "character" })}>
                      {
                        !!statement.character &&
                        <span>{getBestString(character["title"])}</span>
                      }
                      <IconButton aria-label="edit" size="small"><EditIcon fontSize="inherit" /></IconButton></span>
                  }
                </p>


                <p><b>State:</b>&nbsp;
                  {
                    editing.id === statement.id && editing.field === "state" &&
                    <Select
                      fullWidth
                      sx={{ m: 0, marginY: "5px" }}
                      id="statement-value"
                      value={statement["value"]}
                      disabled={!statement["character"]}
                      onChange={(e) => { setStatementValue("value", statement, e.target.value) }}
                      onClose={(e) => { setEditing(false) }}

                    >
                      {statement["character"] &&
                        characters.find(char => char["id"] === statement["character"])["states"].map(state =>
                          <MenuItem value={state["id"]}>{getBestString(state["title"])}</MenuItem>
                        )}
                    </Select>
                  }
                  {
                    (editing.id !== statement.id || editing.field !== "state") && !!statement.character &&
                    <span onClick={() => setEditing({ "id": statement.id, "field": "state" })}>
                      {
                        !!statement.value &&
                        <span>{getBestString(character["states"].find(x => x.id === statement.value)["title"])}</span>
                      }
                      <IconButton aria-label="edit" size="small"><EditIcon fontSize="inherit" /></IconButton></span>
                  }
                </p>

                <p><b>Frequency:</b>&nbsp;
                  {
                    editing.id === statement.id && editing.field === "frequency" &&
                    <Select
                      fullWidth
                      sx={{ m: 0, marginY: "5px" }}
                      id="statement-frequency"
                      value={statement["frequency"] || .5}
                      onChange={(e) => { setStatementValue("frequency", statement, e.target.value) }}
                      onClose={(e) => { setEditing(false) }}
                    >
                      <MenuItem value={1}>Always</MenuItem>
                      <MenuItem value={.5}>In some cases</MenuItem>
                      <MenuItem value={0}>Never</MenuItem>

                    </Select>
                  }
                  {
                    (editing.id !== statement.id || editing.field !== "frequency") &&
                    <span onClick={() => setEditing({ "id": statement.id, "field": "frequency" })}>
                      <span>{statement.frequency === 1 ? "Always" : (statement.frequency === 0 ? "Never" : "In some cases")}</span>
                      <IconButton aria-label="edit" size="small"><EditIcon fontSize="inherit" /></IconButton></span>
                  }
                </p>
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
            </CardContent>

          </Card >
        </div>
      )}

    </Draggable >
  );
}

export default Statement;
