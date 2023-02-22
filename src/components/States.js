import React, { useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  CardContent, IconButton, Card, Avatar, Button
} from "@mui/material";
import { getImgSrc, getEditableItems, deepClone, getBestString, reorder, getDraggableItemStyle } from "../Utils"
import ImageSelector from "./ImageSelector";


function States({ character, statements, languages, mediaElements, newImage, replaceItem, deleteItem }) {
  const [addingImageTo, setAddingImageTo] = useState(false);
  const [editingField, setEditingField] = useState({});
  const [removing, setRemoving] = useState(false);


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

  const addState = () => {
    let states = deepClone(character["states"]);

    const lastState = !!states.length ? states[states.length-1]["id"] : false
    const lastStatement = statements.find(x => x.value === lastState)

    const id = "state:" + uuidv4().replaceAll("-", "")
    states.push(
      {
        "id": id
      }
    )
    character["states"] = states

    replaceItem(character)
    

    if(!!lastStatement) {
      let updatedStatements = deepClone(statements)
      updatedStatements.splice(statements.findIndex(x => x.id === lastStatement.id)+1, 0, {
        "id": "statement:" + uuidv4().replaceAll("-", ""),
        "taxon": lastStatement.taxon,
        "character": lastStatement.character,
        "value": id
      })
      replaceItem(updatedStatements);
    }
  }

  const remove = (state) => {
    replaceItem(deleteItem(state))
    replaceItem(deepClone(statements).filter(x => x.value !== state.id))
  }


  // Adds an (existing) image to an item by referring to its id. Generic enough for copy-paste
  const addImage = (imageId) => {
    if(imageId !== false) {
      addingImageTo["media"] = imageId
      replaceItem(addingImageTo)
    }

    setAddingImageTo(false)
  }

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

    character["states"] = items
    replaceItem(character)
  }

  const renderState = (state, index) => {
    let media = "";

    if (state["media"]) {
      let mediaElement = mediaElements.filter(m => m["id"] === state["media"])[0]
      media = <Avatar onClick={() => { setAddingImageTo(state) }} sx={{ width: 64, height: 64 }} src={getImgSrc(mediaElement)} />
    }
    else {
      media = <div><IconButton sx={{ width: 64, height: 64 }} aria-label="add image" onClick={() => { setAddingImageTo(state) }}><AddPhotoAlternateIcon sx={{ fontSize: 42 }} /></IconButton></div>
    }

    return (<Draggable key={state.id} draggableId={state.id} index={index}>
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
              {media}
              <div style={{ flexGrow: "1" }}>
                <h4>{getBestString(state["title"])}
                  <IconButton aria-label="delete" color={removing === state ? "error" : "default"}
                    onClick={() => {
                      if (removing === state) {
                        remove(state)
                      }
                      else {
                        setRemoving(state)
                      }
                    }} variant="contained"><DeleteIcon /></IconButton>
                </h4>
                



                {getEditableItems({
                  "item": state,
                  "field": "title",
                  "placeholder": "E.g. 'Green'",
                  "languages": languages,
                  "callback": setValue,
                  "editingField": editingField,
                  "setEditingField": setEditingField
                })}

              </div>

            </CardContent>

          </Card >
        </div>
      )}

    </Draggable >

    );
  }



  return (
    <p>
      <h2 className="bp4-heading">States</h2>

      {!character["states"].length &&
        <p>No states yet.</p>
      }


      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="droppable" type={"ROOT"}>
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {character["states"].map(function (state, index) {
                return renderState(state, index)
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>




      {<Button onClick={addState}>New state</Button>}

      {!!addingImageTo &&
        <ImageSelector callback={addImage} newImage={newImage} />
      }

    </p>
  );
}

export default States;
