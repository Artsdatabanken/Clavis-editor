import React, { useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

import ImageSelector from "./ImageSelector";
import States from "./States"

import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';

import {
  CardContent, IconButton, Avatar, Alert, Accordion, AccordionSummary, FormGroup, FormControlLabel, Switch, InputAdornment,
  TextField, FormControl, Fab, AlertTitle, AccordionDetails, FormLabel, Select, MenuItem, FormHelperText, Button,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from "@mui/material";
import { search, getBestString, getImgSrc, deepClone, getEditableItems, getEditingItems, reorder, getDraggableItemStyle } from "../Utils"

function Characters({ characters, statements, mediaElements, languages, newImage, replaceItem, deleteItem }) {
  const [addingImageTo, setAddingImageTo] = useState(false);
  const [filtered, setFiltered] = useState(characters);
  const [editingField, setEditingField] = useState({});
  const [newItem, setNewItem] = useState(false);
  const [removing, setRemoving] = useState(false);

  // Adds a new character to the list of characters and replaces that list to this updated one
  const addCharacter = () => {
    characters = deepClone(characters);
    characters.push(
      newItem
    )
    replaceCharacter(characters)
    setNewItem(false)
  }

  const createCharacter = () => {
    const id = "character:" + uuidv4().replaceAll("-", "")
    setNewItem({
      "id": id,
      "title": {},
      "states": []
    })
  }

  const remove = (item) => {
    setFiltered(replaceItem(deleteItem(item), "characters"))

  }

  // Adds an (existing) image to an item by referring to its id. Generic enough for copy-paste
  const addImage = (imageId) => {
    if(imageId !== false) {
      addingImageTo["media"] = imageId
      replaceItem(addingImageTo)
    }
    setAddingImageTo(false)
  }

  // Sets or adds the value of a field in the character. Can have a language and/or an external service
  const setValue = (field, item, l, value, service) => {
    if (l) {
      if (!(field in item)) {
        item[field] = {}
      }
      if (!!service) {
        item[field][l] = {
          "serviceId": service,
          "externalId": value
        }
      }
      else {
        item[field][l] = value
      }
    }
    else {
      if (!!service) {
        item[field] = {
          "serviceId": service,
          "externalId": value
        }
      }
      else {
        item[field] = value
      }
    }
    replaceItem(item)
  }

  const replaceCharacter = (item) => {
    setFiltered(replaceItem(item))
  }

  const onDragEnd = (result) => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }

    const items = reorder(
      characters,
      result.source.index,
      result.destination.index
    );

    setFiltered(replaceItem(items))
  }

  const renderCharacter = (character, index) => {
    let media = "";

    if (character["media"]) {
      let mediaElement = mediaElements.filter(m => m["id"] === character["media"])[0]
      media = <Avatar onClick={() => { setAddingImageTo(character) }} sx={{ width: 64, height: 64 }} src={getImgSrc(mediaElement)} />
    }
    else {
      media = <div><IconButton sx={{ width: 64, height: 64 }} aria-label="add image" onClick={() => { setAddingImageTo(character) }}><AddPhotoAlternateIcon sx={{ fontSize: 42 }} /></IconButton></div>
    }

    return (<Draggable key={character.id} draggableId={character.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={getDraggableItemStyle(
            snapshot.isDragging,
            provided.draggableProps.style
          )}
        >
          <Accordion>
            <AccordionSummary {...provided.dragHandleProps} expandIcon={<ExpandMoreIcon />}>
              <h3>{getBestString(character["title"])}
                <IconButton aria-label="delete" color={removing === character ? "error" : "default"}
                  onClick={() => {
                    if (removing === character) {
                      remove(character)
                    }
                    else {
                      setRemoving(character)
                    }
                  }} variant="contained"><DeleteIcon /></IconButton>

              </h3>
            </AccordionSummary>
            <AccordionDetails className="sideBySide">
              {media}
              <FormControl component="fieldset" variant="standard" fullWidth>
                <CardContent>
                  {getEditableItems({
                    "item": character,
                    "field": "title",
                    "placeholder": "E.g. 'Color of the wings'",
                    "languages": languages,
                    "callback": setValue,
                    "editingField": editingField,
                    "setEditingField": setEditingField
                  })}


                  {getEditableItems({
                    "item": character,
                    "field": "description",
                    "placeholder": "Optional short further explanation",
                    "languages": languages,
                    "callback": setValue,
                    "editingField": editingField,
                    "setEditingField": setEditingField
                  })}

                  {getEditableItems({
                    "item": character,
                    "field": "descriptionUrl",
                    "placeholder": "Provide an ID",
                    "languages": languages,
                    "callback": setValue,
                    "editingField": editingField,
                    "setEditingField": setEditingField
                  })}
                </CardContent>
                <CardContent>
                  <FormLabel component="legend">Logical requirement</FormLabel>
                  <Select
                    fullWidth
                    sx={{ m: 0, marginY: "5px" }}
                    id="taxon-parent"
                    value={character["logicalPremise"] || false}
                    onChange={(e) => { setValue("logicalPremise", character, false, e.target.value) }}
                  >
                    <MenuItem value={false}>None</MenuItem>
                    {characters.map(char => {
                      if (char["id"] !== character["id"]) {
                        return char["states"].map(state => {
                          return <MenuItem value={state["id"]}>{getBestString(char["title"]) + " - " + getBestString(state["title"])}</MenuItem>
                        })
                      }
                      return true
                    })}

                  </Select>

                </CardContent>
                <CardContent>
                  <FormControl component="fieldset" variant="standard" fullWidth>
                    <FormGroup>
                      <FormControlLabel control={<Switch id={character.id + "_nonexclusive"} key={character.id + "_nonexclusive"} onChange={(e) => { setValue("type", character, false, e.target.checked ? "non-exclusive" : undefined) }} checked={character.type === "non-exclusive"} />} label="Non-exclusive" />
                    </FormGroup>
                    <FormHelperText>Whether multiple states can be true simultaneously.</FormHelperText>
                  </FormControl>
                </CardContent>
                <CardContent>
                  <States character={character} statements={statements} languages={languages} mediaElements={mediaElements} newImage={newImage} replaceItem={replaceCharacter} deleteItem={deleteItem} />
                </CardContent>
              </FormControl>
            </AccordionDetails>
          </Accordion >
        </div>
      )}

    </Draggable >
    );
  }

  return (
    <div>
      <h1 className="bp4-heading">Characters</h1>

      <Alert severity="info">
        <AlertTitle>About characters</AlertTitle>
        Characters are properties that can be tied to taxa, for example "Color of the ears". The possible values of such a property, such as "Red", "Green", "Black", are the states belonging to the character. One can view characters as questions, where the states are the possible answers.
      </Alert>

      {!!languages.length && !!characters.length &&
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
          placeholder="Search by characters and states"
          onChange={(e) => { setFiltered(search(deepClone(characters), e.target.value)) }}
        />
      }

      {!languages.length && <Alert severity="error">Add at least one language first under "General information".</Alert>}

      {!!languages.length && !characters.length &&
        <p>No characters yet, click below to add some.</p>
      }

      {!!languages.length && !!characters.length && !filtered.length &&
        <p>No characters match the search string.</p>
      }

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="droppable">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {filtered.map((char, index) => renderCharacter(char, index))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {!!languages.length &&
        <Fab color="primary" aria-label="add character" onClick={createCharacter}><AddIcon /></Fab>
      }

      {!!addingImageTo &&
        <ImageSelector callback={addImage} newImage={newImage} />
      }

      {!!newItem &&
        <Dialog open={true}>
          <DialogTitle>Add character</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Specify the title of the new character
            </DialogContentText>

            {getEditingItems({
              "item": newItem,
              "field": "title",
              "placeholder": "E.g. 'Color of the wings'",
              "languages": languages,
              "callback": setValue
            })}

          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setNewItem(false) }}>Cancel</Button>
            <Button onClick={() => { addCharacter() }}>Add</Button>
          </DialogActions>
        </Dialog>
      }
    </div>


  );
}

export default Characters;
