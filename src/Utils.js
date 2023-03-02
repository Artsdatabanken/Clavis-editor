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


export const getImgSrc = (mediaElement, width, height) => {
  if (!mediaElement) {
    return ""
  }

  if (mediaElement["mediaElement"]["file"]["url"]["externalId"]) {
    return "https://www.artsdatabanken.no/Media/" + mediaElement["mediaElement"]["file"]["url"]["externalId"] + "?mode=" + parseInt(width) + "x" + parseInt(height)
  }

  if (mediaElement["mediaElement"]["file"]["url"].includes("/")) {
    return mediaElement["mediaElement"]["file"]["url"]
  }
  return ""
}

export const getBestString = (ob) => {
  if (typeof (ob) === "string") {
    return ob
  }

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
      returning = [...returning, ...flattenTaxa(taxon["children"], ("│ " + level).replaceAll('│  ', '└─ '))]
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
    return <Alert severity="warning">No {languageNames[l]} {fieldNames[props.field]}<IconButton aria-label="edit" size="small" onClick={() => doEdit(l)}><EditIcon fontSize="inherit" /></IconButton></Alert>
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


export const changeStatement = (statements, statetmentId, frequency, character) => {

  let taxonId = 0

  // Set the character
  statements = statements.map(statement => {
    if (statement.id === statetmentId) {
      statement.frequency = frequency
      taxonId = statement.taxon
    }
    return statement
  })

  // If the character is non-exclusive, the rest is not affected and we return as is
  if (character.type === "non-exclusive") {
    return statements
  }

  // Otherwise, they are mutually exclusive
  // If the new frequency is 1, all others are 0
  if (frequency === 1) {
    return statements.map(statement => {
      if (statement.character === character.id && statement.taxon === taxonId && statement.id !== statetmentId) {
        statement.frequency = 0
      }
      return statement
    })
  }
  // If the new frequency is 0, and there is one other, that other has to be 1
  else if (frequency === 0 && character.states.length === 2) {
    // for loop is more efficient as we want to break when finding the right one
    for (let index = 0; index < statements.length; index++) {
      const statement = statements[index];

      if (statement.character === character.id && statement.taxon === taxonId && statement.id !== statetmentId) {
        statements[index].frequency = 1
        break
      }
    }
    return statements
  }
  // If the new frequency is 0, and there are 2 or more others but they are all zero, delete those others
  else if (frequency === 0 && statements.filter(s => (s.character === character.id && s.taxon === taxonId && s.frequency !== 0)).length === 0) {

    return statements.map(s => {
      if (s.character === character.id && s.taxon === taxonId && s.id !== statetmentId) {
        s.frequency = undefined
      }
      return s
    })
  }
  // If the frequency is >0 and <1, and there is one other, that needs to be the reverse
  else if (frequency > 0 && frequency < 1 && character.states.length === 2) {
    // for loop is more efficient as we want to break when finding the right one
    for (let index = 0; index < statements.length; index++) {
      const statement = statements[index];
      if (statement.character === character.id && statement.taxon === taxonId && statement.id !== statetmentId) {
        statements[index].frequency = 1.0 - frequency
        break
      }
    }
    return statements
  }
  // If the frequency is >0 and <1, there can be no siblings with frequency 1, so make those the reverse
  else if (frequency > 0 && frequency < 1 && statements.filter(s => (s.character === character.id && s.taxon === taxonId && s.frequency === 1)).length > 0) {
    return statements.map(s => {
      if ((s.character === character.id && s.taxon === taxonId && s.frequency === 1)) {
        s.frequency = 1.0 - frequency
      }
      return s
    })
  }
  // If the frequency is >0 and <1, not all others can be 0, so nullify them if this is the case
  else if (frequency > 0 && frequency < 1 && statements.filter(s => (s.character === character.id && s.taxon === taxonId && s.frequency === 0)).length === character.states.length - 1) {
    return statements.map(s => {
      if ((s.character === character.id && s.taxon === taxonId && s.frequency === 0)) {
        s.frequency = undefined
      }
      return s
    })
  }
  // If the frequenct is 0 and all but one siblings are also 0, the last one has to be 1
  else if (frequency === 0 && statements.filter(s => (s.character === character.id && s.taxon === taxonId && s.frequency === 0)).length === character.states.length - 1) {
    // for loop is more efficient as we want to break when finding the right one
    for (let index = 0; index < statements.length; index++) {
      const statement = statements[index];
      if (statement.character === character.id && statement.taxon === taxonId && statement.frequency !== 0) {
        statements[index].frequency = 1
        break
      }
    }
    return statements
  }

  // Otherwise, it is a special case somehow
  console.warn("No logic found for sibling statements")
  return statements
}
