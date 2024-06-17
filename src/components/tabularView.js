import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

import StatementTable from "./StatementTable";
import StatementEditDialogue from "./StatementEditDialogue";
import { FormControlLabel, FormGroup, Switch } from "@mui/material";

import { flattenTaxa, deepClone, changeStatement } from "../Utils";

function TabularView({
  clavis,
  replaceItem,
  deleteItem,
  languages,
  setLoadingPage,
  taxonFilter,
}) {
  const [currentTaxon, setCurrentTaxon] = useState(false);
  const [currentCharacter, setCurrentCharacter] = useState(false);
  const [currentStatements, setCurrentStatements] = useState([]);
  const [statementsAreNew, setStatementsAreNew] = useState(false);
  const [taxaFlattened, setTaxaFlattened] = useState([]);
  const [statementsObject, setStatementsObject] = useState({});
  const [filterActive, setFilterActive] = useState(true);

  /**
   * Sets the current character and taxon, and opens the statements for these, or creates
   * them if they don't exist.
   *
   * @param {object} character - The character parameter.
   * @param {object} taxon - The taxon parameter.
   */
  const openStatements = (character, taxon) => {
    console.log("openStatements");
    let filteredStatements = [];

    if (
      statementsObject[taxon.id] &&
      statementsObject[taxon.id][character.id]
    ) {
      for (const [key, value] of Object.entries(
        statementsObject[taxon.id][character.id]
      )) {
        filteredStatements.push({
          taxon: taxon.id,
          character: character.id,
          value: key,
          frequency: value.frequency,
          id: value.id,
        });
      }
    }

    if (!filteredStatements.length) {
      setStatementsAreNew(true);

      character.states.forEach((state) => {
        let adding = {};
        adding.taxon = taxon.id;
        adding.character = character.id;
        adding.value = state.id;
        adding.id = "statement:" + uuidv4().replaceAll("-", "");
        filteredStatements.push(adding);
      });
    } else if (filteredStatements.length < character.states.length) {
      character.states.forEach((state) => {
        if (!filteredStatements.find((x) => x.value === state.id)) {
          let adding = {};
          adding.taxon = taxon.id;
          adding.character = character.idsetStatementsAreNew;
          adding.value = state.id;
          adding.id = "statement:" + uuidv4().replaceAll("-", "");
          filteredStatements.push(adding);
        }
      });
    }

    setCurrentStatements(filteredStatements);
    setCurrentCharacter(character);
    setCurrentTaxon(taxon);
    console.log("openStatements done");
  };

  const objectifyStatements = (statements) => {
    console.log("objectifyStatements");
    let object = {};
    statements.forEach((statement) => {
      if (!object[statement.taxon]) {
        object[statement.taxon] = {};
      }
      if (!object[statement.taxon][statement.character]) {
        object[statement.taxon][statement.character] = {};
      }
      object[statement.taxon][statement.character][statement.value] = {
        id: statement.id,
        frequency: statement.frequency,
      };
    });

    console.log("objectifyStatements done");
    return object;
  };

  const setStatements = () => {
    if (statementsAreNew) {
      console.log(currentStatements);
      replaceItem(deepClone(clavis.statements).concat(currentStatements));
    } else {
      replaceItem(currentStatements, null, true);
    }

    setCurrentStatements([]);
    setStatementsAreNew(false);
  };

  /**
   * Deletes the current statements and updates the state.
   *
   * @return {undefined} No return value
   */
  const deleteStatements = () => {
    replaceItem(deleteItem(currentStatements), "statements");
    setCurrentStatements([]);
    setStatementsAreNew(false);
  };

  const setStatementValue = (field, fact, value) => {
    setCurrentStatements(
      changeStatement(currentStatements, fact.id, value, currentCharacter)
    );

    // setCurrentStatements(currentStatements.map(statement => {
    //     if (fact.id === statement.id) {
    //         fact[field] = value
    //         return fact
    //     }
    //     else if (field === "frequency" && value === 1 && (currentCharacter.type !== "exclusive" || currentCharacter.type)) {
    //         statement["frequency"] = 0
    //     }
    //     else if (field === "frequency" && value > 0 && (currentCharacter.type !== "exclusive" || currentCharacter.type) && statement["frequency"] === 1) {
    //         statement["frequency"] = .5
    //     }

    //     return statement
    // }))
  };



  useEffect(() => {

    const filterTaxa = (flattenedTaxa, filter) => {
      if (!filter.length || !filterActive) {
        return flattenedTaxa;
      }
  
      let newTaxa = [];
  
      flattenedTaxa.forEach((taxon) => {
        if (filter.includes(taxon.id)) {
          newTaxa.push(taxon);
        }
      });
      return newTaxa;
    };

    console.log("Mounted");
    setLoadingPage("");

    console.log("Flatten");

    setTaxaFlattened(filterTaxa(flattenTaxa(clavis.taxa), taxonFilter));

    setStatementsObject(objectifyStatements(clavis.statements));

    return () => {
      console.log("Unmounted");
    };
  }, [setLoadingPage, clavis.taxa, clavis.statements, taxonFilter, filterActive]);

  return (
    <div>
      <h1 className="bp4-heading">Table view</h1>

      <FormGroup>
        <FormControlLabel control={<Switch onClick={() => setFilterActive(!filterActive)} checked={filterActive} />} label={"Taxon filter " + (filterActive ? "enabled" : "disabled")} />
      </FormGroup>



      <StatementTable
        statementsObject={statementsObject}
        taxaFlattened={taxaFlattened}
        characters={clavis.characters}
        languages={languages}
        openStatements={openStatements}
      />

      <StatementEditDialogue
        languages={languages}
        currentCharacter={currentCharacter}
        currentTaxon={currentTaxon}
        currentStatements={currentStatements}
        setStatementValue={setStatementValue}
        setStatements={setStatements}
        deleteStatements={deleteStatements}
        setCurrentStatements={setCurrentStatements}
      />
    </div>
  );
}

export default TabularView;
