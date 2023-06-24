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
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';


import {
  CardContent, IconButton, Avatar, Alert, Accordion, AccordionSummary, FormGroup, FormControlLabel, Switch, InputAdornment,
  TextField, FormControl, Fab, AlertTitle, AccordionDetails, FormLabel, Select, MenuItem, FormHelperText, ButtonGroup, Button,
  Paper, Popper, MenuList, Grow, ClickAwayListener
} from "@mui/material";
import { search, getBestString, getImgSrc, deepClone, getEditableItems, reorder, getDraggableItemStyle } from "../Utils"

function Characters({ clavis, newImage, replaceItem, deleteItem }) {
  const languages = clavis["language"]
  const mediaElements = clavis["mediaElements"]
  let characters = clavis["characters"]


  const [addingImageTo, setAddingImageTo] = useState(false);
  const [filtered, setFiltered] = useState(characters);
  const [editingField, setEditingField] = useState({});
  const [newItem, setNewItem] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [searchString, setSearchString] = useState("");
  const [expandedItem, setExpandedItem] = useState(false);



  const replaceAndFilter = (item, type) => {
    let result = replaceItem(item, type)

    if (Array.isArray(result) && result.length && result[0]["id"].split(":")[0] === "character") {
      console.warn("redoing search")
      setFiltered(search(result, searchString))
    }
    else if ("$schema" in item) {
      setFiltered(search(item.characters, searchString))
    }
  }

  // Adds a new character to the list of characters and replaces that list to this updated one
  // const addCharacter = () => {
  //   characters = deepClone(characters);
  //   characters.push(
  //     newItem
  //   )
  //   replaceAndFilter(characters)
  //   setNewItem(false)
  // }

  const toggleExpansion = (itemId) => {
    setExpandedItem(itemId !== expandedItem ? itemId : false)
  }

  const createCharacter = () => {
    const id = "character:" + uuidv4().replaceAll("-", "")
    setNewItem({
      "id": id,
      "title": {},
      "states": []
    })
    setExpandedItem(id)
  }

  const remove = (item) => {
    replaceAndFilter(deleteItem(item), "characters")

  }

  // Adds an (existing) image to an item by referring to its id. Generic enough for copy-paste
  const addImage = (imageId) => {
    if (imageId !== false) {
      addingImageTo["media"] = imageId
      replaceAndFilter(addingImageTo)
    }
    setAddingImageTo(false)
  }

  // Sets or adds the value of a field in the character. Can have a language and/or an external service
  const setValue = (field, item, l, value, service) => {
    setNewItem(false)

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
    replaceAndFilter(item)
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

    replaceAndFilter(items)
  }

  const SplitButton = () => {
    const options = ['Multiple choice', 'Numerical'];
    const [open, setOpen] = React.useState(false);
    const anchorRef = React.useRef(null);
    const [selectedIndex, setSelectedIndex] = React.useState(0);
  
    const handleClick = () => {
      console.info(`You clicked ${options[selectedIndex]}`);
    };
  
    const handleMenuItemClick = (event, index) => {
      setSelectedIndex(index);
      setOpen(false);
    };
  
    const handleToggle = () => {
      setOpen((prevOpen) => !prevOpen);
    };
  
    const handleClose = (event) => {
      if (anchorRef.current && anchorRef.current.contains(event.target)) {
        return;
      }
  
      setOpen(false);
    };
  
    return (
      <React.Fragment>
        <ButtonGroup variant="contained" ref={anchorRef} aria-label="split button">
          <Button onClick={handleClick}>{options[selectedIndex]}</Button>
          <Button
            size="small"
            aria-controls={open ? 'split-button-menu' : undefined}
            aria-expanded={open ? 'true' : undefined}
            aria-label="select merge strategy"
            aria-haspopup="menu"
            onClick={handleToggle}
          >
            <ArrowDropDownIcon />
          </Button>
        </ButtonGroup>
        <Popper
          sx={{
            zIndex: 1,
          }}
          open={open}
          anchorEl={anchorRef.current}
          role={undefined}
          transition
          disablePortal
        >
          {({ TransitionProps, placement }) => (
            <Grow
              {...TransitionProps}
              style={{
                transformOrigin:
                  placement === 'bottom' ? 'center top' : 'center bottom',
              }}
            >
              <Paper>
                <ClickAwayListener onClickAway={handleClose}>
                  <MenuList id="split-button-menu" autoFocusItem>
                    {options.map((option, index) => (
                      <MenuItem
                        key={option}
                        disabled={index === 2}
                        selected={index === selectedIndex}
                        onClick={(event) => handleMenuItemClick(event, index)}
                      >
                        {option}
                      </MenuItem>
                    ))}
                  </MenuList>
                </ClickAwayListener>
              </Paper>
            </Grow>
          )}
        </Popper>
      </React.Fragment>
    );
  }

  const renderCharacter = (character, index) => {
    let media = "";

    if (character["media"]) {
      let mediaElement = mediaElements.filter(m => m["id"] === character["media"])[0]
      media = <Avatar onClick={() => { setAddingImageTo(character) }} sx={{ width: 64, height: 64 }} src={getImgSrc(mediaElement, 64, 64)} />
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
          <Accordion expanded={expandedItem === character.id} onChange={() => toggleExpansion(character.id)}>
            <AccordionSummary {...provided.dragHandleProps} expandIcon={<ExpandMoreIcon />} style={{ backgroundColor: '#455a6433' }}>
              <h3>
                <IconButton ><DragIndicatorIcon /></IconButton> {getBestString(character["title"])}
              </h3>
            </AccordionSummary>
            <AccordionDetails className="sideBySide">
              {media}
              <FormControl component="fieldset" variant="standard" fullWidth>
                <CardContent>
                  <FormControl component="fieldset" variant="standard" fullWidth>
                    <FormLabel component="legend">Title</FormLabel>
                    <FormGroup>
                      {getEditableItems({
                        "item": character,
                        "field": "title",
                        "placeholder": "E.g. 'Color of the wings'",
                        "languages": languages,
                        "callback": setValue,
                        "editingField": editingField,
                        "setEditingField": setEditingField
                      })}
                    </FormGroup>
                  </FormControl>

                  <FormControl component="fieldset" variant="standard" fullWidth>
                    <FormLabel component="legend">Description</FormLabel>
                    <FormGroup>
                      {getEditableItems({
                        "item": character,
                        "field": "description",
                        "placeholder": "Optional short further explanation",
                        "languages": languages,
                        "callback": setValue,
                        "editingField": editingField,
                        "setEditingField": setEditingField
                      })}
                    </FormGroup>
                  </FormControl>


                  <FormControl component="fieldset" variant="standard" fullWidth>
                    <FormLabel component="legend">Description ID</FormLabel>
                    <FormGroup>
                      {getEditableItems({
                        "item": character,
                        "field": "descriptionUrl",
                        "placeholder": "The ID of a page at NBIC",
                        "languages": languages,
                        "callback": setValue,
                        "editingField": editingField,
                        "setEditingField": setEditingField
                      })}
                    </FormGroup>
                  </FormControl>
                </CardContent>

                <CardContent>
                  <States clavis={clavis} character={character} newImage={newImage} replaceItem={replaceAndFilter} deleteItem={deleteItem} mediaElements={mediaElements} />
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
                  <FormHelperText>A state that has to be true before this character can be asked about.</FormHelperText>

                </CardContent>
                <CardContent>
                  <FormControl component="fieldset" variant="standard" fullWidth>
                    <FormGroup>
                      <FormControlLabel control={<Switch id={character.id + "_nonexclusive"} key={character.id + "_nonexclusive"} onChange={(e) => { setValue("type", character, false, e.target.checked ? "non-exclusive" : undefined) }} checked={character.type === "non-exclusive"} />} label="Non-exclusive" />
                    </FormGroup>
                    <FormHelperText>Whether multiple states can be true simultaneously for this character.</FormHelperText>
                  </FormControl>
                </CardContent>


                <CardContent>

                  <IconButton aria-label="delete" color={removing === character ? "error" : "default"}
                    onClick={() => {
                      if (removing === character) {
                        remove(character)
                      }
                      else {
                        setRemoving(character)
                      }
                    }} variant="contained" style={{ float: "right" }}><DeleteIcon />{removing === character ? "Are you sure?" : ""}</IconButton>
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
          onChange={(e) => { setSearchString(e.target.value); setFiltered(search(deepClone(characters), e.target.value)) }}
        />
      }

      {!languages.length && <Alert severity="error">Choose a main language first under "General information".</Alert>}

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
              {!!filtered && filtered
                .concat(newItem ? [newItem] : [])
                .map((char, index) => renderCharacter(char, index))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {!!languages.length &&
        <SplitButton />



        // <Fab color="primary" aria-label="add character" onClick={createCharacter}><AddIcon /></Fab>
      }

      {!!addingImageTo &&
        <ImageSelector callback={addImage} newImage={newImage} />
      }

      {/* {!!newItem &&
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
      } */}
    </div>


  );
}

export default Characters;
