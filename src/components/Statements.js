import React, { useState } from "react";
import { v4 as uuidv4 } from 'uuid';

import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';

import {
  Fab, Alert, AlertTitle, TextField, InputAdornment, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Button, Select, MenuItem



} from "@mui/material";

import { search, deepClone, flattenTaxa, getBestString, changeStatement } from "../Utils"


import Statement from "./Statement";

function Statements({ statements, characters, taxa, languages, replaceItem, deleteItem }) {
  const [editing, setEditing] = useState(false);
  const [filtered, setFiltered] = useState(statements);
  const [newItem, setNewItem] = useState(false);

  const pool = (items) => {
    let pooled = []

    items.forEach(item => {
      if (!pooled.length || pooled[pooled.length - 1][0].taxon !== item.taxon || pooled[pooled.length - 1][0].character !== item.character) {
        pooled = [...pooled, [item]]
      }
      else {
        pooled[pooled.length - 1].push(item)
      }
    })
    return pooled
  }

  const deleteStatement = (statement) => {
    setFiltered(replaceItem(deleteItem(statement), "statements"))
  }

  // Adds a new character to the list of characters and replaces that list to this updated one
  const addStatement = () => {
    statements = deepClone(statements);
    const character = characters.find(x => x.id === newItem.character)

    character.states.forEach(state => {
      let adding = deepClone(newItem)
      adding.value = state.id
      adding.id = "statement:" + uuidv4().replaceAll("-", "")
      statements.push(
        adding
      )
    });

    replaceItem(statements)
    setFiltered(statements)
    setNewItem(false)
  }

  const createStatement = () => {
    const id = "statement:" + uuidv4().replaceAll("-", "")
    setNewItem({
      "id": id
    })
  }




  const setStatementValue = (field, statement, value) => {
    if(field === "frequency") {
      const character = characters.find(c => c.id === statement.character)
      replaceItem(changeStatement(statements, statement.id, value, character))
    }
    else {
      statement[field] = value
      replaceItem(statement)
    }



    



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


      <div>
        {pool(filtered).map(function (statement, index) {
          return <Statement key={index} statement={statement} characters={characters} taxa={taxa} languages={languages} setStatementValue={setStatementValue} setEditing={setEditing} editing={editing} deleteItem={deleteStatement} replaceItem={replaceItem} index={index} />
        })}
      </div>


      {!!languages.length && !!taxa.length && !!characters.length &&
        <Fab color="primary" aria-label="add statement" onClick={createStatement}><AddIcon /></Fab>
      }



      {!!newItem &&
        <Dialog open={true}>
          <DialogTitle>Add character</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Specify the title of the new character
            </DialogContentText>


            <p><b>Taxon:</b>&nbsp;
              <Select
                fullWidth
                sx={{ m: 0, marginY: "5px" }}
                id="statement-taxon"
                value={newItem["taxon"]}
                onChange={(e) => {
                  let statement = deepClone(newItem)
                  statement.taxon = e.target.value
                  setNewItem(statement)
                }}
              >
                {flattenTaxa(taxa).map(taxon =>
                  <MenuItem value={taxon["id"]}>{taxon["level"]}{taxon["scientificName"] || getBestString(taxon["label"])}</MenuItem>
                )}
              </Select>
            </p>

            <p><b>Character:</b>&nbsp;
              <Select
                fullWidth
                sx={{ m: 0, marginY: "5px" }}
                id="statement-character"
                value={newItem["character"]}
                onChange={(e) => {
                  let statement = deepClone(newItem)
                  statement.character = e.target.value
                  setNewItem(statement)
                }}
              >
                {characters.map(character =>
                  <MenuItem value={character["id"]}>{getBestString(character["title"])}</MenuItem>
                )}
              </Select>
            </p>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setNewItem(false) }}>Cancel</Button>
            <Button onClick={() => { addStatement() }}>Add</Button>
          </DialogActions>
        </Dialog>
      }


    </div>


  );
}

export default Statements;
