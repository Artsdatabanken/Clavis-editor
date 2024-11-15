import React from "react";
import { TextField, InputAdornment, IconButton } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import { v4 as uuidv4 } from "uuid";

export const languageNames = {
  en: "English",
  nb: "Bokmål",
  nn: "Nynorsk",
};

export const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

export const getDraggableItemStyle = (isDragging, draggableStyle) => ({
  userSelect: "none",
  marginBottom: 4,
  ...draggableStyle,
});

export const taxonNames = [
  "kingdom",
  "phylum",
  "subphylum",
  "class",
  "order",
  "family",
  "genus",
  "species",
  "subspecies",
];

export const getImgSrc = (mediaElement, width, height) => {
  if (!mediaElement) {
    return "";
  }

  if (mediaElement["mediaElement"]["file"]["url"]["externalId"]) {
    return (
      "https://www.artsdatabanken.no/Media/" +
      mediaElement["mediaElement"]["file"]["url"]["externalId"] +
      "?mode=" +
      parseInt(width) +
      "x" +
      parseInt(height)
    );
  }

  if (mediaElement["mediaElement"]["file"]["url"].includes("/")) {
    return mediaElement["mediaElement"]["file"]["url"];
  }
  return "";
};

export const getBestString = (ob) => {
  if (typeof ob === "string") {
    return ob;
  }

  return !!ob ? ob.en || ob.nb || ob.nn || "" : "";
};

export const flattenTaxa = (taxa, level = " ", as_list = false, ancestry = [], parent) => {
  let returning = [];
  taxa.forEach((taxon) => {
    let t = deepClone(taxon);

    if (!t.scientificName && parent) {
      t.scientificName = parent.scientificName
    }

    if (!t.scientificName && parent) {
      t.scientificName = parent.scientificName
    }

    if (!t.externalReference && parent) {
      t.externalReference = parent.externalReference
    }

    if (!t.media && parent) {
      t.media = parent.media
    }

    if (!t.descriptionUrl && parent) {
      t.descriptionUrl = parent.descriptionUrl
    }


    t["children"] = undefined;
    if (!as_list) {
      t["level"] = level;
    }

    if (!as_list || !taxon["children"] || taxon["children"].length === 0) {
      if (as_list) {
        t["ancestry"] = [...ancestry, taxon["id"]];
      }
      returning.push(t);
    }
    
    if (taxon["children"] && taxon["children"].length) {
      returning = [
        ...returning,
        ...flattenTaxa(
          taxon["children"],
          ("│ " + level).replaceAll("│  ", "└─ "),
          as_list,
          [...ancestry, taxon["id"]],
          t
        ),
      ];
    }
  });
  return returning;
};

export const getTaxon = (taxa, taxonId) => {
  for (let index = 0; index < taxa.length; index++) {
    const taxon = taxa[index];
    if (taxon["id"] === taxonId) {
      return taxon;
    }
    if (taxon["children"] && taxon["children"].length) {
      const childTaxon = getTaxon(taxon["children"], taxonId);
      if (childTaxon) {
        return childTaxon;
      }
    }
  }
  return undefined;
};

export const cleanStatements = (clavis) => {
  console.log("Cleaning statements...");

  let warnings = [];

  const findState = (characterId, stateId) => {
    let character = clavis["characters"].find((c) => c.id === characterId);
    if (!character) return false;

    let state = character["states"].find((s) => s.id === stateId);
    if (!state) return false;

    return true;
  };

  let statements = clavis["statements"];

  for (let i = 0; i < statements.length; i++) {
    let statement = statements[i];

    // add a new ID to each statement
    statement.id = "statement:" + uuidv4().replaceAll("-", "");
    statements[i] = statement;

    // remove any statements that don't have a frequency
    if (!statement.hasOwnProperty("frequency")) {
      statements.splice(i, 1);
      // console.log("Removed statement " + i + ": no frequency");
      i--;
      continue;
    }

    // remove any statements that refer to non-existent characters or states
    if (!findState(statement["character"], statement["value"])) {
      statements.splice(i, 1);
      // console.log("Removed statement " + i + ": no such state");
      i--;
      continue;
    }

    // remove any statements that refer to non-existent taxa
    if (!getTaxon(clavis.taxa, statements[i]["taxon"])) {
      statements.splice(i, 1);
      // console.log("Removed statement " + i + ": no such taxon");
      i--;
      continue;
    }

    // remove any duplicate statements
    for (let j = i + 1; j < statements.length; j++) {
      if (
        statements[j]["value"] === statement["value"] &&
        statements[j]["taxon"] === statement["taxon"]
      ) {
        if (statements[j]["frequency"] !== statement["frequency"]) {
          let taxon = getTaxon(clavis.taxa, statement["taxon"]);
          console.log(
            "Warning: removing last added  out of two statements for " +
              taxon.scientificName +
              " with different frequencies"
          );
          let character = clavis.characters.find(
            (c) => c.id === statement["character"]
          );
          let state = character.states.find((s) => s.id === statement["value"]);

          console.log("Character: " + character.title?.nb);
          console.log("State: " + state.title?.nb);
          console.log("Keeping frequency: " + statements[j]["frequency"]);
          console.log("Removing frequency: " + statement["frequency"]);

          warnings.push(
            "Warning: " +
              taxon.scientificName +
              ' had conflicting statements for "' +
              character.title?.nb +
              '": "' +
              state.title?.nb +
              '". It is now set to the following, check if this is correct:'
          );

          warnings.push(getStatementIcon(statements[j]["frequency"]));

          statements.splice(i, 1);
          i--;
          j--;
        } else {
          console.log("Removed statement " + j + ": duplicate");
          statements.splice(j, 1);
          j--;
        }
      }
    }
  }

  console.log("... done");

  return {
    statements: statements,
    warnings: warnings,
  };
};

export const getLanguageInput = (
  item,
  field,
  placeholder,
  l,
  required,
  handleChange,
  service,
  doneCallback
) => {
  let endAdornment;
  if (doneCallback) {
    endAdornment = (
      <InputAdornment position="end">
        <IconButton onClick={doneCallback}>
          <CheckIcon />
        </IconButton>
      </InputAdornment>
    );
  }

  return (
    <TextField
      sx={{ m: 1 }}
      fullWidth
      label={required ? "Required" : ""}
      InputProps={{
        endAdornment: endAdornment,
      }}
      key={item["id"] + "-" + field + "-" + l}
      id={"key-" + field + "-" + l}
      placeholder={placeholder}
      onChange={(e) => {
        handleChange(field, item, l, e.target.value, service);
      }}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === "Escape") && doneCallback) {
          doneCallback({});
        }
      }}
      value={
        field in item && l in item[field]
          ? !!service
            ? item[field][l]["externalId"]
            : item[field][l]
          : ""
      }
    />
  );
};

export const getEditableItems = (props) => {
  return propsToField(props, props.languages[0]);
};

export const getEditingItems = (props) => {
  return props.languages.map((l) => {
    return propsToField(props, l);
  });
};

const propsToField = (props, l) => {
  return getLanguageInput(
    props.item,
    props.field,
    props.placeholder,
    l,
    props.required,
    props.callback,
    props.service,
    props.setEditingField
  );
};

export const search = (items, value) => {
  if (!value) {
    return items;
  } else {
    return items.filter(
      (i) => JSON.stringify(i).toLowerCase().indexOf(value.toLowerCase()) > -1
    );
  }
};

export const deepClone = (item) => {
  if (!item) {
    return item;
  }
  return JSON.parse(JSON.stringify(item));
};

export const changeStatement = (
  statements,
  statetmentId,
  frequency,
  character
) => {
  let taxonId = 0;

  // Set the character
  statements = statements.map((statement) => {
    if (statement.id === statetmentId) {
      statement.frequency = frequency;
      taxonId = statement.taxon;
    }
    return statement;
  });

  // If the character is non-exclusive, the rest is not affected and we return as is
  if (character.type === "non-exclusive") {
    return statements;
  }

  // Otherwise, they are mutually exclusive
  // If the new frequency is 1, all others are 0
  if (frequency === 1) {
    return statements.map((statement) => {
      if (
        statement.character === character.id &&
        statement.taxon === taxonId &&
        statement.id !== statetmentId
      ) {
        statement.frequency = 0;
      }
      return statement;
    });
  }
  // If the new frequency is 0, and there is one other, that other has to be 1
  else if (frequency === 0 && character.states.length === 2) {
    // for loop is more efficient as we want to break when finding the right one
    for (let index = 0; index < statements.length; index++) {
      const statement = statements[index];

      if (
        statement.character === character.id &&
        statement.taxon === taxonId &&
        statement.id !== statetmentId
      ) {
        statements[index].frequency = 1;
        break;
      }
    }
    return statements;
  }
  // If the new frequency is 0, and there are 2 or more others but they are all zero, delete those others
  else if (
    frequency === 0 &&
    statements.filter(
      (s) =>
        s.character === character.id && s.taxon === taxonId && s.frequency !== 0
    ).length === 0
  ) {
    return statements.map((s) => {
      if (
        s.character === character.id &&
        s.taxon === taxonId &&
        s.id !== statetmentId
      ) {
        s.frequency = undefined;
      }
      return s;
    });
  }
  // If the frequency is >0 and <1, and there is one other, that needs to be the reverse
  else if (frequency > 0 && frequency < 1 && character.states.length === 2) {
    // for loop is more efficient as we want to break when finding the right one
    for (let index = 0; index < statements.length; index++) {
      const statement = statements[index];
      if (
        statement.character === character.id &&
        statement.taxon === taxonId &&
        statement.id !== statetmentId
      ) {
        statements[index].frequency = 1.0 - frequency;
        break;
      }
    }
    return statements;
  }
  // If the frequency is >0 and <1, there can be no siblings with frequency 1, so make those the reverse
  else if (
    frequency > 0 &&
    frequency < 1 &&
    statements.filter(
      (s) =>
        s.character === character.id && s.taxon === taxonId && s.frequency === 1
    ).length > 0
  ) {
    return statements.map((s) => {
      if (
        s.character === character.id &&
        s.taxon === taxonId &&
        s.frequency === 1
      ) {
        s.frequency = 1.0 - frequency;
      }
      return s;
    });
  }
  // If the frequency is >0 and <1, not all others can be 0, so nullify them if this is the case
  else if (
    frequency > 0 &&
    frequency < 1 &&
    statements.filter(
      (s) =>
        s.character === character.id && s.taxon === taxonId && s.frequency === 0
    ).length ===
      character.states.length - 1
  ) {
    return statements.map((s) => {
      if (
        s.character === character.id &&
        s.taxon === taxonId &&
        s.frequency === 0
      ) {
        s.frequency = undefined;
      }
      return s;
    });
  }
  // If the frequenct is 0 and all but one siblings are also 0, the last one has to be 1
  else if (
    frequency === 0 &&
    statements.filter(
      (s) =>
        s.character === character.id && s.taxon === taxonId && s.frequency === 0
    ).length ===
      character.states.length - 1
  ) {
    // for loop is more efficient as we want to break when finding the right one
    for (let index = 0; index < statements.length; index++) {
      const statement = statements[index];
      if (
        statement.character === character.id &&
        statement.taxon === taxonId &&
        statement.frequency !== 0
      ) {
        statements[index].frequency = 1;
        break;
      }
    }
    return statements;
  }

  // Otherwise, it is a special case somehow
  console.warn("No logic found for sibling statements");
  return statements;
};

export const getStatementIcon = (freq) => {
  const alwaysIcon = (
    <span role="img" aria-label="Checkmark">
      ✅
    </span>
  );
  const sometimesIcon = (
    <span role="img" aria-label="Checkmark">
      🟨
    </span>
  );
  const neverIcon = (
    <span role="img" aria-label="Checkmark">
      ❌
    </span>
  );
  if (freq === 1) {
    return alwaysIcon;
  } else if (freq === 0) {
    return neverIcon;
  } else if (freq > 0) {
    return sometimesIcon;
  }
  return "";
};
