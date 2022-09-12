import React from "react";
import { TextField, InputAdornment, IconButton, Alert } from "@mui/material";
import CheckIcon from '@mui/icons-material/Check';
import EditIcon from '@mui/icons-material/Edit';


export const languageNames = {
  "en": "English",
  "nb": "Bokmål",
  "nn": "Nynorsk"
}

export const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

export const getDraggableItemStyle = (isDragging, draggableStyle) => ({
  userSelect: "none",
  marginBottom: 4,
  ...draggableStyle
});

const fieldNames = {
  "title": "title",
  "description": "description",
  "vernacularName": "vernacular name",
  "label": "label",
  "descriptionUrl": "description link"
}

export const taxonNames = [
  "kingdom",
  "phylum",
  "subphylum",
  "class",
  "order",
  "family",
  "genus",
  "species",
  "subspecies"
]

export const getImgSrc = (mediaElement) => {
  if (mediaElement["mediaElement"]["file"]["url"]["externalId"]) {
    return "https://www.artsdatabanken.no/Media/" + mediaElement["mediaElement"]["file"]["url"]["externalId"] + "?mode=128x128"
  }
  else if (mediaElement["mediaElement"]["file"]["url"].includes("/")) {
    return mediaElement["mediaElement"]["file"]["url"]
  }
  return ""
}

export const getBestString = (ob) => {
  return !!ob ? ob.en || ob.nb || ob.nn || "<empty>" : "<empty>"
}



export const flattenTaxa = (taxa, level = " ") => {
  let returning = []
  taxa.forEach(taxon => {
    let t = deepClone(taxon)
    t["children"] = undefined
    t["level"] = level
    returning.push(t)
    if (taxon["children"] && taxon["children"].length) {
      returning = [...returning, ...flattenTaxa(taxon["children"], "-" + level)]
    }
  })
  return returning;
}

export const getLanguageInput = (item, field, placeholder, l, required, handleChange, service, doneCallback) => {

  let endAdornment
  if (doneCallback) {
    endAdornment = <InputAdornment position="end"><IconButton onClick={doneCallback} ><CheckIcon /></IconButton></InputAdornment>
  }

  return <TextField
    sx={{ m: 1 }}
    fullWidth
    label={required ? "Required" : ""}
    InputProps={{
      startAdornment: <InputAdornment position="start">{languageNames[l]}</InputAdornment>,
      endAdornment: endAdornment
    }}
    key={item["id"] + "-" + field + "-" + l}
    id={"key-" + field + "-" + l}
    placeholder={placeholder}
    onChange={(e) => { handleChange(field, item, l, e.target.value, service) }}
    onKeyDown={(e) => {
      if ((e.key === "Enter" || e.key === "Escape") && doneCallback) { doneCallback({}) }
    }}
    value={
      (field in item && l in item[field])
        ?
        (!!service ? item[field][l]["externalId"] : item[field][l])
        :
        ""}
  />;
}


export const getEditableItems = (props) => {

  const doEdit = (l) => props.setEditingField({ "id": props.item.id, "field": props.field, "l": l })

  return props.languages.map((l) => {
    if (props.item.id === props.editingField.id && props.editingField.field === props.field && props.editingField.l === l) {
      return propsToField(props, l)
    }
    else if (props.item[props.field] && props.item[props.field][l] && props.service) {
      return <p>{languageNames[l]}: {props.item[props.field][l]["externalId"]}<IconButton aria-label="edit" size="small" onClick={() => doEdit(l)}><EditIcon fontSize="inherit" /></IconButton></p>

    }
    else if (props.item[props.field] && props.item[props.field][l]) {
      return <p>{languageNames[l]}: {props.item[props.field][l]}<IconButton aria-label="edit" size="small" onClick={() => doEdit(l)}><EditIcon fontSize="inherit" /></IconButton></p>
    }
    return <Alert fullWidth severity="warning">No {languageNames[l]} {fieldNames[props.field]}<IconButton aria-label="edit" size="small" onClick={() => doEdit(l)}><EditIcon fontSize="inherit" /></IconButton></Alert>
  })
}


export const getEditingItems = (props) => {
  return props.languages.map((l) => {
    return propsToField(props, l)
  })
}






const propsToField = (props, l) => {
  return getLanguageInput(props.item, props.field, props.placeholder, l, props.required, props.callback, props.service, props.setEditingField)
}


export const search = (items, value) => {

  if (!value) {
    return items
  }
  else {
    return items.filter(i => JSON.stringify(i).toLowerCase().indexOf(value.toLowerCase()) > -1)
  }
}

export const deepClone = (item) => {
  if (!item) {
    return item
  }
  return JSON.parse(JSON.stringify(item))
}