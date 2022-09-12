import React, { useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import { DragDropContext, Droppable } from "react-beautiful-dnd";

import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';

import { Fab, Alert, AlertTitle, TextField, InputAdornment } from "@mui/material";

import { search, deepClone, flattenTaxa, reorder } from "../Utils"


import Statement from "./Statement";

function Statements({ statements, characters, taxa, languages, replaceItem, deleteItem}) {
  const [editing, setEditing] = useState(false);
  const [filtered, setFiltered] = useState(statements);

  const deleteStatement = (statement) => {
    setFiltered(replaceItem(deleteItem(statement), "statements"))
  }


  const addStatement = () => {
    statements = deepClone(statements);
    let id = "statement:" + uuidv4().replaceAll("-", "")
    statements.push(
      {
        "id": id,
        "frequency": 1
      }
    )
    replaceItem(statements)
    setEditing(id)
    setFiltered(statements)
  }

  const setStatementValue = (field, statement, value) => {
    statement[field] = value
    replaceItem(statement)
  }

  const addObjects = (items) => {
    return items.map(s => {
      s["taxonObject"] = flattenTaxa(deepClone(taxa)).find(t => t.id === s["taxon"])
      if (!!s["taxonObject"]) {
        s["taxonObject"]["children"] = undefined
      }

      const character = characters.find(t => t.id === s["character"])
      s["characterObject"] = deepClone(character)

      if (!!s["characterObject"]) {
        s["characterObject"]["states"] = []
        if (!!s["value"]) {
          s["stateObject"] = deepClone(character["states"].find(t => t.id === s["value"]))
        }

      }
      return s
    })
  }

  const removeObjects = (items) => {
    return items.map(s => {
      s["taxonObject"] = undefined
      s["characterObject"] = undefined
      s["stateObject"] = undefined
      return s
    })
  }

  const onDragEnd = (result) => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }

    const items = reorder(
      statements,
      result.source.index,
      result.destination.index
    );
    
    replaceItem(items)
    setFiltered(items)
  }

  return (
    <div>
      <h1 className="bp4-heading">Statements</h1>
      <Alert severity="info">
        <AlertTitle>About statements</AlertTitle>
        Statements are knowledge about taxa needed to separate them from other taxa. In Clavis, this knowledge is a connection between a taxon (such as a species), a character (e.g. "Color"), a state (e.g. "Red"), and a frequency ("always", "in some cases", or "never"). This way, one can make statements reflecting that "The color of a polar bear is always white" and "The color of a brown bear is always brown" so the two can be distinguished. Through three additional statements it can be stated that "The color of an arctic fox is, in some cases, white", "The color of an arctic fox is, in some cases, brown", and "The color of an arctic fox is, in some cases, grey". The combination of these example statements makes it so that more statements with other characters are needed to distinguish white arctic foxes from polar bears; for example using a character regarding their size. Redundant statements are allowed and in fact encouraged, so the number of toes can be added as an alternative to distinguish polar bears from arctic foxes.
      </Alert>

      {!!languages.length && !!statements.length &&
        <TextField
          sx={{ m: 0, marginY: "5px" }}
          fullWidth
          key={"taxon-query"}
          id={"taxon-query"}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          placeholder="Search by taxa, characters and states"
          onChange={(e) => { setFiltered(removeObjects(search(addObjects(deepClone(statements)), e.target.value))) }}
        />
      }



      {!languages.length && <Alert severity="error">Add at least one language first under "General information".</Alert>}
      {!taxa.length && <Alert severity="error">Create at least one taxon first.</Alert>}
      {!characters.length && <Alert severity="error">Create at least one character first.</Alert>}

      {!statements.length && !!languages.length && !!taxa.length && !!characters.length &&
        <p>No statements yet, click below to add some.</p>
      }


      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="droppable" type={"ROOT"}>
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {filtered.map(function (statement, index) {
                return <Statement statement={statement} characters={characters} taxa={taxa} languages={languages} setStatementValue={setStatementValue} setEditing={setEditing} editing={editing} deleteItem={deleteStatement} replaceItem={replaceItem} index={index} />
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>




      {!!languages.length && !!taxa.length && !!characters.length &&
        <Fab color="primary" aria-label="add statement" onClick={addStatement}><AddIcon /></Fab>
      }
    </div>


  );
}

export default Statements;
