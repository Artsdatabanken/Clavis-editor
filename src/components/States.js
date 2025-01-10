import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import AddIcon from "@mui/icons-material/Add";

import { IconButton, Avatar, Button, FormHelperText } from "@mui/material";

import {
  getImgSrc,
  deepClone,
  reorder,
  getDraggableItemStyle,
  getMultipleLanguageInputs
} from "../Utils";
import ImageSelector from "./ImageSelector";

function States({
  clavis,
  character,
  mediaElements,
  newImage,
  replaceItem,
}) {
  let statements = clavis["statements"];
  let languages = clavis["language"];

  const [addingImageTo, setAddingImageTo] = useState(false);
  const [removing, setRemoving] = useState(false);

  // Sets or adds the value of a field in the character. Can have a language and/or an external service
  const setValue = (field, item, l, value, service) => {
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
    replaceItem(item);
  };

  const addState = () => {
    let c = deepClone(clavis);

    const id = "state:" + uuidv4().replaceAll("-", "");

    c.characters.map((char) => {
      if (char.id === character.id) {
        char.states = char.states.concat([
          {
            id: id,
          },
        ]);
      }
      return char;
    });

    // Add empty statements for all taxa that already have at least one statement for this character
    const taxaWithCharacter = [
      ...new Set(
        statements
          .filter((x) => x.character === character.id)
          .map((x) => x.taxon)
      ),
    ];

    taxaWithCharacter.forEach(
      (taxon) =>
        (c.statements = c.statements.concat([
          {
            id: "statement:" + uuidv4().replaceAll("-", ""),
            taxon: taxon,
            character: character.id,
            value: id,
          },
        ]))
    );
    replaceItem(c);
  };

  const remove = (state) => {
    let c = deepClone(clavis);
    c.statements = c.statements.filter((s) => s.value !== state.id);
    c.characters.map((c) => {
      c.states = c.states.filter((s) => s.id !== state.id);
      return c;
    });
    replaceItem(c);

    // replaceItem(deleteItem(state))
    // replaceItem(deepClone(statements).filter(x => x.value !== state.id))
  };

  // Adds an (existing) image to an item by referring to its id. Generic enough for copy-paste
  const addImage = (imageId) => {
    if (imageId !== false) {
      addingImageTo["media"] = imageId;
      replaceItem(addingImageTo);
    }

    setAddingImageTo(false);
  };

  const onDragEnd = (result) => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }

    const items = reorder(
      character["states"],
      result.source.index,
      result.destination.index
    );

    character["states"] = items;
    replaceItem(character);
  };

  const renderState = (state, index) => {
    let media = "";

    if (state["media"]) {
      let mediaElement = mediaElements.filter(
        (m) => m["id"] === state["media"]
      )[0];
      media = (
        <Avatar
          onClick={() => {
            setAddingImageTo(state);
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
              setAddingImageTo(state);
            }}
          >
            <AddPhotoAlternateIcon sx={{ fontSize: 42 }} />
          </IconButton>
        </div>
      );
    }

    return (
      <Draggable key={state.id} draggableId={state.id} index={index}>
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
            <div className="formCard" {...provided.dragHandleProps}>
              <div className="sideBySide">
                <div style={{ marginBottom: "auto", marginTop: "auto" }}>
                  <IconButton>
                    <DragIndicatorIcon />
                  </IconButton>
                </div>
                {media}
                <div style={{ flexGrow: "1" }}>
                  {getMultipleLanguageInputs({
                    item: state,
                    field: "title",
                    placeholder: "E.g. 'Green'",
                    languages: languages,
                    required: false,
                    handleChange: setValue,
                  })}

                </div>
                <div style={{ marginBottom: "auto", marginTop: "auto" }}>
                  <IconButton
                    aria-label="delete"
                    color={removing === state ? "error" : "default"}
                    onClick={() => {
                      if (removing === state) {
                        remove(state);
                      } else {
                        setRemoving(state);
                      }
                    }}
                    variant="contained"
                  >
                    <DeleteIcon />
                    {removing === state ? "Are you sure?" : ""}
                  </IconButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </Draggable>
    );
  };

  return (
    <p>
      <h2 className="bp4-heading">States</h2>
      <FormHelperText>The possible answers to this character.</FormHelperText>

      {!character["states"].length && <p>No states yet.</p>}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="droppable" type={"ROOT"}>
          {(provided, snapshot) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {character["states"].map(function (state, index) {
                return renderState(state, index);
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {
        <Button
          variant="outlined"
          style={{ marginLeft: "165px" }}
          onClick={addState}
          placeholder="Add new state"
          startIcon={<AddIcon />}
        >
          Add new state
        </Button>
      }

      {!!addingImageTo && (
        <ImageSelector callback={addImage} newImage={newImage} />
      )}
    </p>
  );
}

export default States;
