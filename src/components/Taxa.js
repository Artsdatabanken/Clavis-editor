import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
import LowPriorityIcon from "@mui/icons-material/LowPriority";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import Grid from "@mui/material/Grid";

import {
  IconButton,
  Avatar,
  Alert,
  AlertTitle,
  FormControlLabel,
  FormControl,
  CardContent,
  FormLabel,
  FormGroup,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  Fab,
  Select,
  MenuItem,
  FormHelperText,
} from "@mui/material";

import {
  deepClone,
  getBestString,
  getEditableItems,
  getImgSrc,
  reorder,
  getDraggableItemStyle,
  flattenTaxa,
  getTaxon,
} from "../Utils";
import TaxonSelector from "./TaxonSelector";
import ImageSelector from "./ImageSelector";

function Taxa({
  taxa,
  mediaElements,
  languages,
  newImage,
  replaceItem,
  deleteItem,
  filterStatements,
  replaceTaxon,
}) {
  const [addingImageTo, setAddingImageTo] = useState(false);
  const [editingField, setEditingField] = useState({});
  const [addingSubtaxon, setAddingSubtaxon] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [movingToTaxon, setMovingToTaxon] = useState(false);
  const [expanded, setExpanded] = useState([]);

  useEffect(() => {
    console.log("Mounted");
    return () => {
      console.log("Unmounted");
    };
  }, []);

  const addTaxon = (taxon, parent) => {
    if (parent) {
      taxa = insertTaxon(taxa, taxon, parent);
    } else {
      taxa = [...taxa, taxon];
    }
    replaceItem(taxa);
  };

  const toggleExpanded = (id) => {
    if (expanded.includes(id)) {
      setExpanded(expanded.filter((x) => x !== id));
    } else {
      setExpanded([...expanded, id]);
    }
  };

  const onDragEnd = (result) => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }

    const items = moveTo(
      result.draggableId,
      result.source.index,
      result.destination.index
    );

    replaceItem(items);
  };

  const manualMove = (id, to) => {
    let taxon = deepClone(getTaxon(taxa, id));
    let parent = getTaxon(taxa, to);

    if (!parent["children"]) {
      parent["children"] = [];
    }

    parent["children"].push(taxon);
    taxa = deleteItem(getTaxon(taxa, id));
    taxa = replaceTaxon(parent, taxa);

    replaceItem(taxa);
  };

  const moveTo = (id, from, to) => {
    const doMove = (items, id, from, to) => {
      items = deepClone(items);

      if (!!items.find((x) => x.id === id)) {
        return reorder(items, from, to);
      } else {
        items = items.map((x) => {
          if (!!x.children) {
            x.children = doMove(x.children, id, from, to);
          }
          return x;
        });
      }
      return items;
    };
    return doMove(taxa, id, from, to);
  };

  const insertTaxon = (taxa, taxon, parent) => {
    taxa.forEach((t) => {
      if (t["id"] === parent) {
        if (!t["children"]) {
          t["children"] = [];
        }
        t["children"].push(taxon);
        return taxa;
      } else if (t["children"]) {
        t["children"] = insertTaxon(t["children"], taxon, parent);
      }
    });
    return taxa;
  };

  const addImage = (imageId) => {
    // false means don't change at all, undefined means remove
    if (imageId !== false) {
      addingImageTo["media"] = imageId;
    }
    setAddingImageTo(false);
  };

  const toggleEndpoint = (t) => {
    t["isEndPoint"] = !t["isEndPoint"];
    replaceItem(t);
  };

  const remove = (item) => {
    deleteItem(item);
  };

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

  const renderTaxon = (t, index) => {
    let media = "";

    if (t["media"]) {
      let mediaElement = mediaElements.filter((m) => m["id"] === t["media"])[0];
      media = (
        <Avatar
          onClick={() => {
            setAddingImageTo(t);
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
              setAddingImageTo(t);
            }}
          >
            <AddPhotoAlternateIcon sx={{ fontSize: 42 }} />
          </IconButton>
        </div>
      );
    }

    let names = "";

    if (t.hasOwnProperty("scientificName")) {
      names = getEditableItems({
        item: t,
        field: "vernacularName",
        placeholder: "Vernacular name of this taxon'",
        languages: languages,
        callback: setValue,
        editingField: editingField,
        setEditingField: setEditingField,
      });
    } else {
      names = getEditableItems({
        item: t,
        field: "label",
        placeholder: "Name of this non-taxonomic unit",
        languages: languages,
        callback: setValue,
        editingField: editingField,
        setEditingField: setEditingField,
      });
    }

    let makeEndpoint = "";

    if (t["children"] && t["children"].length) {
      makeEndpoint = (
        <FormControlLabel
          control={
            <Switch
              id="en"
              key="en"
              onChange={() => toggleEndpoint(t)}
              checked={t["isEndPoint"]}
            />
          }
          label="Endpoint"
        />
      );
    }

    return (
      <Draggable key={t.id} draggableId={t.id} index={index}>
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
            <Accordion
              expanded={expanded.includes(t.id)}
              onChange={() => toggleExpanded(t.id)}
              {...provided.dragHandleProps}
            >
              <AccordionSummary
                style={{ backgroundColor: "#455a6433" }}
                expandIcon={<ExpandMoreIcon />}
              >
                <h3>
                  <IconButton>
                    <DragIndicatorIcon />
                  </IconButton>{" "}
                  <i>{t["scientificName"] || getBestString(t["label"]) || "(standard)"}</i>
                </h3>
              </AccordionSummary>

              <AccordionDetails className="sideBySide">

              {expanded.includes(t.id) && (
                <div>
                  

                {media}

                <FormControl component="fieldset" variant="standard" fullWidth>
                  <CardContent>
                    <FormControl
                      component="fieldset"
                      variant="standard"
                      fullWidth
                    >
                      <FormLabel component="legend">
                        {t.hasOwnProperty("scientificName")
                          ? "Vernacular name"
                          : "Label"}
                      </FormLabel>
                      <FormGroup>{names}</FormGroup>
                    </FormControl>

                    <FormControl
                      component="fieldset"
                      variant="standard"
                      fullWidth
                    >
                      <FormLabel component="legend">Description ID</FormLabel>
                      <FormGroup>
                        {getEditableItems({
                          item: t,
                          field: "descriptionUrl",
                          placeholder: "The ID of a page at NBIC",
                          languages: languages,
                          callback: setValue,
                          editingField: editingField,
                          setEditingField: setEditingField,
                          service: "service:nbic_page",
                        })}
                      </FormGroup>
                    </FormControl>

                    <Grid container spacing={10}>
                      <Grid item xs={12} md={4}>
                        <FormControl
                          component="fieldset"
                          variant="standard"
                          fullWidth
                        >
                          <FormLabel component="legend">
                            Choose if this is an endpoint. If it is, the user
                            will not be required to continue beyond this point.
                          </FormLabel>
                          <FormGroup>{makeEndpoint}</FormGroup>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <FormControl component="fieldset" variant="standard">
                          <FormLabel component="legend">
                            Add a subunit of this taxon. This can be a taxon or
                            a custom subdivision (morph, sex, taxon complex...)
                          </FormLabel>

                          <FormGroup>
                            <Button
                              aria-label="add subtaxon"
                              onClick={() => {
                                setAddingSubtaxon(t["id"]);
                              }}
                              variant="contained"
                              startIcon={<AddIcon />}
                            >
                              Add subtaxon
                            </Button>
                          </FormGroup>
                        </FormControl>{" "}
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <FormControl component="fieldset" variant="standard">
                          <FormLabel component="legend">
                            Move this taxon as a subtaxon of a different taxon.
                          </FormLabel>

                          <FormGroup>
                            <Select
                              fullWidth
                              sx={{ m: 0, marginY: "5px" }}
                              id="taxon-parent"
                              onChange={(e) => setMovingToTaxon(e.target.value)}
                              value={movingToTaxon}
                            >
                              <MenuItem value={false}>None</MenuItem>
                              {flattenTaxa(taxa," ", false, [], undefined, [t.id]).map((taxon) => (
                                <MenuItem value={taxon["id"]}>
                                  {taxon["level"]}
                                  {taxon["scientificName"]}
                                  {!!taxon["label"] &&
                                    getBestString(taxon["label"])}
                                </MenuItem>
                              ))}
                            </Select>
                            <FormHelperText>
                              Select a taxon that this one is to be a subunit
                              of.
                            </FormHelperText>

                            <Button
                              aria-label="add subtaxon"
                              onClick={() => {
                                manualMove(t["id"], movingToTaxon);
                              }}
                              variant="contained"
                              startIcon={<LowPriorityIcon />}
                            >
                              Move
                            </Button>
                          </FormGroup>
                        </FormControl>{" "}
                      </Grid>
                    </Grid>
                  </CardContent>

                  <CardContent>
                    <IconButton
                      aria-label="delete"
                      color={removing === t ? "error" : "default"}
                      onClick={() => {
                        if (removing === t) {
                          remove(t);
                        } else {
                          setRemoving(t);
                        }
                      }}
                      variant="contained"
                      style={{ float: "right" }}
                    >
                      <DeleteIcon />
                      {removing === t ? "Are you sure?" : ""}
                    </IconButton>
                  </CardContent>
                </FormControl>
                </div>
              )}
              </AccordionDetails>
            </Accordion>

            {t.hasOwnProperty("children") && (
              <div style={{ marginLeft: "2em" }}>
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="droppable" type={t.id}>
                    {(provided, snapshot) => (
                      <div {...provided.droppableProps} ref={provided.innerRef}>
                        {t["children"].map((c, index) => renderTaxon(c, index))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            )}
          </div>
        )}
      </Draggable>
    );
  };

  return (
    <div>
      <h1 className="bp4-heading">Taxa</h1>

      <Alert severity="info">
        <AlertTitle>About taxa</AlertTitle>
        Taxa are what the key is meant to distinguish between. They can be a
        simple flat list of species or other taxonomic entities, or have a
        hierarchy so that species fall under a genus, for example. All taxa can
        also have subdivisions below them, such as morphs, sexes, life stages,
        etc. By default, a key will keep asking for input from the user until
        only one item remains, without it having any more entities under it.
        This can be changed by marking a taxon as an endpoint. Then, if it is
        the only remaining option, that will be the outcome of the key, even
        when it has several subtaxa or -divisions under it which have not all
        been excluded. A key can for example have information on both the male
        and female of a species, but be made to stop as soon as the species is
        known, even when the sex is not yet determined. But one can also make a
        genus an end point, so that the genus is the answer when it has been
        determined, even when there is information on the species in that genus,
        which have not yet been determined.
      </Alert>

      {!languages.length && (
        <Alert severity="error">
          Specify the main language first under "General information".
        </Alert>
      )}

      {!!languages.length && !taxa.length && (
        <p>No taxa yet, click below to add some.</p>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="droppable" type={"ROOT"}>
          {(provided, snapshot) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {taxa.map(function (t, index) {
                return renderTaxon(t, index);
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {!!addingImageTo && (
        <ImageSelector
          scientificNameId={
            addingImageTo.externalReference
              ? addingImageTo.externalReference.externalId
              : undefined
          }
          callback={addImage}
          newImage={newImage}
        />
      )}

      {!!addingSubtaxon && (
        <TaxonSelector
          taxa={taxa}
          addTaxon={addTaxon}
          languages={languages}
          addingSubtaxon={addingSubtaxon}
          setAddingSubtaxon={setAddingSubtaxon}
        />
      )}

      {!!languages.length && (
        <Fab
          color="primary"
          aria-label="add character"
          onClick={() => {
            setAddingSubtaxon("root");
          }}
        >
          <AddIcon />
        </Fab>
      )}
    </div>
  );
}

export default Taxa;
