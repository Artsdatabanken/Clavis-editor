import React, { useState, useCallback, useMemo, memo } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import ImageSelector from "./ImageSelector";
import States from "./States";
import { v4 as uuidv4 } from "uuid";
import AddIcon from "@mui/icons-material/Add";

import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";

import {
  CardContent,
  IconButton,
  Avatar,
  Alert,
  Accordion,
  AccordionSummary,
  FormGroup,
  FormControlLabel,
  Switch,
  InputAdornment,
  Fab,
  TextField,
  FormControl,
  AlertTitle,
  AccordionDetails,
  FormLabel,
  Select,
  MenuItem,
  FormHelperText,
} from "@mui/material";
import {
  search,
  getBestString,
  getImgSrc,
  reorder,
  getDraggableItemStyle,
  getMultipleLanguageInputs,
} from "../Utils";

function Characters({ clavis, newImage, replaceItem, deleteItem }) {
  const languages = clavis["language"];
  const mediaElements = clavis["mediaElements"];
  let characters = clavis["characters"];

  const [addingImageTo, setAddingImageTo] = useState(false);
  const [filtered, setFiltered] = useState(characters);
  const [newItem, setNewItem] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [searchString, setSearchString] = useState("");
  const [expandedItem, setExpandedItem] = useState(false);

  const replaceAndFilter = useCallback((item, type) => {
    let result = replaceItem(item, type);

    if (
      Array.isArray(result) &&
      result.length &&
      result[0]["id"].split(":")[0] === "character"
    ) {
      setFiltered(search(result, searchString));
    } else if ("$schema" in item) {
      setFiltered(search(item.characters, searchString));
    }
  }, [replaceItem, searchString]);

  const toggleExpansion = useCallback((itemId) => {
    setExpandedItem((prev) => (itemId !== prev ? itemId : false));
  }, []);

  const createCharacter = useCallback(() => {
    const id = "character:" + uuidv4().replaceAll("-", "");
    setNewItem({
      id: id,
      title: {},
      states: [],
    });
    setExpandedItem(id);
  }, []);

  const remove = useCallback((item) => {
    replaceAndFilter(deleteItem(item), "characters");
  }, [replaceAndFilter, deleteItem]);

  // Adds an (existing) image to an item by referring to its id. Generic enough for copy-paste
  const addImage = useCallback((imageId) => {
    if (imageId !== false) {
      addingImageTo["media"] = imageId;
      replaceAndFilter(addingImageTo);
    }
    setAddingImageTo(false);
  }, [addingImageTo, replaceAndFilter]);

  // Sets or adds the value of a field in the character. Can have a language and/or an external service
  const setValue = useCallback((field, item, l, value, service) => {
    setNewItem(false);

    if (l) {
      if (!(field in item)) {
        item[field] = {};
      }
      if (!!service) {
        item[field][l] = {
          serviceId: service,
          externalId: value,
        };
      } else {
        item[field][l] = value;
      }
    } else {
      if (!!service) {
        item[field] = {
          serviceId: service,
          externalId: value,
        };
      } else {
        item[field] = value;
      }
    }
    replaceAndFilter(item);
  }, [replaceAndFilter]);

  const onDragEnd = useCallback((result) => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }

    const items = reorder(
      characters,
      result.source.index,
      result.destination.index
    );

    replaceAndFilter(items);
  }, [characters, replaceAndFilter]);

  // Memoize the logical requirement options to avoid recalculating on every render
  const logicalRequirementOptions = useMemo(() => {
    const options = [];
    characters.forEach((char) => {
      // Skip numerical characters (they don't have states)
      if (char.type === "numerical" || !char.states) return;
      char.states.forEach((state) => {
        options.push({
          characterId: char.id,
          stateId: state.id,
          label: getBestString(char.title, languages) + " - " + getBestString(state.title, languages),
        });
      });
    });
    return options;
  }, [characters, languages]);

  const renderCharacter = (character, index) => {
    let media = "";

    if (character["media"]) {
      let mediaElement = mediaElements.filter(
        (m) => m["id"] === character["media"]
      )[0];
      media = (
        <Avatar
          onClick={() => {
            setAddingImageTo(character);
          }}
          sx={{ width: 64, height: 64 }}
          src={getImgSrc(mediaElement, 64, 64)}
        />
      );
    } else {
      media = (
        <div>
          <IconButton
            sx={{ width: 64, height: 64 }}
            aria-label="add image"
            onClick={() => {
              setAddingImageTo(character);
            }}
          >
            <AddPhotoAlternateIcon sx={{ fontSize: 42 }} />
          </IconButton>
        </div>
      );
    }

    return (
      <Draggable key={character.id} draggableId={character.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            style={getDraggableItemStyle(
              snapshot.isDragging,
              provided.draggableProps.style
            )}
          >
            <Accordion
              expanded={expandedItem === character.id}
              onChange={() => toggleExpansion(character.id)}
            >
              <AccordionSummary
                {...provided.dragHandleProps}
                expandIcon={<ExpandMoreIcon />}
                style={{ backgroundColor: "#455a6433" }}
              >
                <h3>
                  <IconButton>
                    <DragIndicatorIcon />
                  </IconButton>{" "}
                  {getBestString(character["title"], languages)}
                </h3>
              </AccordionSummary>
              <AccordionDetails className="sideBySide">
                {/* Only render content when expanded for performance */}
                {expandedItem === character.id && (
                  <>
                    {media}
                    <FormControl component="fieldset" variant="standard" fullWidth>
                      <CardContent>
                        <FormControl
                          component="fieldset"
                          variant="standard"
                          fullWidth
                        >
                          <FormLabel component="legend">Title</FormLabel>
                          <FormGroup>
                            {getMultipleLanguageInputs({
                              item: character,
                              field: "title",
                              placeholder: "E.g. 'Color of the wings'",
                              languages: languages,
                              required: true,
                              handleChange: setValue,
                            })}
                          </FormGroup>
                        </FormControl>

                        <FormControl
                          component="fieldset"
                          variant="standard"
                          fullWidth
                        >
                          <FormLabel component="legend">Description</FormLabel>
                          <FormGroup>
                            {getMultipleLanguageInputs({
                              item: character,
                              field: "description",
                              placeholder: "Optional short further explanation",
                              languages: languages,
                              required: false,
                              handleChange: setValue,
                            })}
                          </FormGroup>
                        </FormControl>

                        <FormControl
                          component="fieldset"
                          variant="standard"
                          fullWidth
                        >
                          <FormLabel component="legend">Description ID</FormLabel>
                          <FormGroup>
                            {getMultipleLanguageInputs({
                              item: character,
                              field: "descriptionUrl",
                              placeholder: "The ID of a page at NBIC",
                              languages: languages,
                              required: false,
                              handleChange: setValue,
                            })}
                          </FormGroup>
                        </FormControl>
                      </CardContent>

                      <CardContent>
                        <FormControl
                          component="fieldset"
                          variant="standard"
                          fullWidth
                        >
                          <FormGroup>
                            <FormControlLabel
                              control={
                                <Switch
                                  id={character.id + "_numerical"}
                                  key={character.id + "_numerical"}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      // Switching to numerical - set type and remove states
                                      let c = structuredClone(character);
                                      c.type = "numerical";
                                      delete c.states;
                                      replaceAndFilter(c);
                                    } else {
                                      // Switching to categorical - remove numerical properties, add states
                                      let c = structuredClone(character);
                                      delete c.type;
                                      delete c.min;
                                      delete c.max;
                                      delete c.stepSize;
                                      delete c.unit;
                                      c.states = [];
                                      replaceAndFilter(c);
                                    }
                                  }}
                                  checked={character.type === "numerical"}
                                />
                              }
                              label="Numerical character"
                            />
                          </FormGroup>
                          <FormHelperText>
                            Whether this character uses numerical values instead of categorical states.
                          </FormHelperText>
                        </FormControl>
                      </CardContent>

                      {character.type === "numerical" ? (
                        <CardContent>
                          <FormControl
                            component="fieldset"
                            variant="standard"
                            fullWidth
                          >
                            <FormLabel component="legend">Numerical settings</FormLabel>
                            <FormGroup row style={{ gap: "16px", marginTop: "8px" }}>
                              <TextField
                                label="Min"
                                type="number"
                                value={character.min ?? ""}
                                onChange={(e) => {
                                  setValue(
                                    "min",
                                    character,
                                    false,
                                    e.target.value === "" ? undefined : parseFloat(e.target.value)
                                  );
                                }}
                                style={{ width: "120px" }}
                                InputProps={{ inputProps: { step: "any" } }}
                              />
                              <TextField
                                label="Max"
                                type="number"
                                value={character.max ?? ""}
                                onChange={(e) => {
                                  setValue(
                                    "max",
                                    character,
                                    false,
                                    e.target.value === "" ? undefined : parseFloat(e.target.value)
                                  );
                                }}
                                style={{ width: "120px" }}
                                InputProps={{ inputProps: { step: "any" } }}
                              />
                              <TextField
                                label="Step size"
                                type="number"
                                value={character.stepSize ?? ""}
                                onChange={(e) => {
                                  setValue(
                                    "stepSize",
                                    character,
                                    false,
                                    e.target.value === "" ? undefined : parseFloat(e.target.value)
                                  );
                                }}
                                style={{ width: "120px" }}
                                InputProps={{ inputProps: { step: "any", min: 0 } }}
                              />
                            </FormGroup>
                            <FormHelperText>
                              Define the valid range and increment for numerical values.
                            </FormHelperText>
                          </FormControl>

                          <FormControl
                            component="fieldset"
                            variant="standard"
                            fullWidth
                            style={{ marginTop: "16px" }}
                          >
                            <FormLabel component="legend">Unit</FormLabel>
                            <FormGroup>
                              {getMultipleLanguageInputs({
                                item: character,
                                field: "unit",
                                placeholder: "E.g. 'mm' or 'meters'",
                                languages: languages,
                                required: false,
                                handleChange: setValue,
                              })}
                            </FormGroup>
                            <FormHelperText>
                              The unit of measurement (can be localized).
                            </FormHelperText>
                          </FormControl>
                        </CardContent>
                      ) : (
                        <CardContent>
                          <States
                            clavis={clavis}
                            character={character}
                            newImage={newImage}
                            replaceItem={replaceAndFilter}
                            deleteItem={deleteItem}
                            mediaElements={mediaElements}
                          />
                        </CardContent>
                      )}
                      <CardContent>
                        <FormLabel component="legend">
                          Logical requirement
                        </FormLabel>
                        <Select
                          fullWidth
                          sx={{ m: 0, marginY: "5px" }}
                          id="taxon-parent"
                          value={character["logicalPremise"] || false}
                          onChange={(e) => {
                            setValue(
                              "logicalPremise",
                              character,
                              false,
                              e.target.value
                            );
                          }}
                        >
                          <MenuItem value={false}>None</MenuItem>
                          {logicalRequirementOptions
                            .filter((opt) => opt.characterId !== character.id)
                            .map((opt) => (
                              <MenuItem key={opt.stateId} value={opt.stateId}>
                                {opt.label}
                              </MenuItem>
                            ))}
                        </Select>
                        <FormHelperText>
                          A state that has to be true before this character can be
                          asked about.
                        </FormHelperText>
                      </CardContent>
                      {character.type !== "numerical" && (
                        <CardContent>
                          <FormControl
                            component="fieldset"
                            variant="standard"
                            fullWidth
                          >
                            <FormGroup>
                              <FormControlLabel
                                control={
                                  <Switch
                                    id={character.id + "_nonexclusive"}
                                    key={character.id + "_nonexclusive"}
                                    onChange={(e) => {
                                      setValue(
                                        "type",
                                        character,
                                        false,
                                        e.target.checked ? "non-exclusive" : undefined
                                      );
                                    }}
                                    checked={character.type === "non-exclusive"}
                                  />
                                }
                                label="Non-exclusive"
                              />
                            </FormGroup>
                            <FormHelperText>
                              Whether multiple states can be true simultaneously for
                              this character.
                            </FormHelperText>
                          </FormControl>
                        </CardContent>
                      )}

                      <CardContent>
                        <IconButton
                          aria-label="delete"
                          color={removing === character ? "error" : "default"}
                          onClick={() => {
                            if (removing === character) {
                              remove(character);
                            } else {
                              setRemoving(character);
                            }
                          }}
                          variant="contained"
                          style={{ float: "right" }}
                        >
                          <DeleteIcon />
                          {removing === character ? "Are you sure?" : ""}
                        </IconButton>
                      </CardContent>
                    </FormControl>
                  </>
                )}
              </AccordionDetails>
            </Accordion>
          </div>
        )}
      </Draggable>
    );
  };

  return (
    <div>
      <h1 className="bp4-heading">Characters</h1>

      <Alert severity="info">
        <AlertTitle>About characters</AlertTitle>
        Characters are properties that can be tied to taxa. They can be either
        categorical (with discrete states like "Red", "Green", "Black") or
        numerical (with a range like "10-20 mm"). For categorical characters,
        states are the possible answers. For numerical characters, you can
        define a valid range with min/max values, step size, and unit.
      </Alert>

      {!!languages.length && !!characters.length && (
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
          onChange={(e) => {
            setSearchString(e.target.value);
            setFiltered(search(characters, e.target.value));
          }}
        />
      )}

      {!languages.length && (
        <Alert severity="error">
          Choose a main language first under "General information".
        </Alert>
      )}

      {!!languages.length && !characters.length && (
        <p>No characters yet, click below to add some.</p>
      )}

      {!!languages.length && !!characters.length && !filtered.length && (
        <p>No characters match the search string.</p>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="droppable">
          {(provided, snapshot) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {!!filtered &&
                filtered
                  .concat(newItem ? [newItem] : [])
                  .map((char, index) => renderCharacter(char, index))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {!!languages.length && (
        <>
          <Fab
            color="primary"
            aria-label="add character"
            onClick={createCharacter}
          >
            <AddIcon />
          </Fab>
        </>
      )}

      {!!addingImageTo && (
        <ImageSelector callback={addImage} newImage={newImage} />
      )}
    </div>
  );
}

export default memo(Characters);
