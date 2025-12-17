import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  const [filterActive, setFilterActive] = useState(true);

  // Memoize expensive computations - only recalculate when dependencies change
  const taxaFlattened = useMemo(() => {
    const flattened = flattenTaxa(clavis.taxa);
    if (!taxonFilter.length || !filterActive) {
      return flattened;
    }
    return flattened.filter((taxon) => taxonFilter.includes(taxon.id));
  }, [clavis.taxa, taxonFilter, filterActive]);

  const statementsObject = useMemo(() => {
    const object = {};
    clavis.statements.forEach((statement) => {
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
    return object;
  }, [clavis.statements]);

  /**
   * Sets the current character and taxon, and opens the statements for these, or creates
   * them if they don't exist.
   *
   * @param {object} character - The character parameter.
   * @param {object} taxon - The taxon parameter.
   */
  const openStatements = useCallback((character, taxon) => {
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
          adding.character = character.id;
          adding.value = state.id;
          adding.id = "statement:" + uuidv4().replaceAll("-", "");
          filteredStatements.push(adding);
        }
      });
    }

    setCurrentStatements(filteredStatements);
    setCurrentCharacter(character);
    setCurrentTaxon(taxon);
  }, [statementsObject]);

  const setStatements = useCallback(() => {
    if (statementsAreNew) {
      console.log(currentStatements);
      replaceItem(deepClone(clavis.statements).concat(currentStatements));
    } else {
      replaceItem(currentStatements, null, true);
    }

    setCurrentStatements([]);
    setStatementsAreNew(false);
  }, [statementsAreNew, currentStatements, replaceItem, clavis.statements]);

  /**
   * Deletes the current statements and updates the state.
   *
   * @return {undefined} No return value
   */
  const deleteStatements = useCallback(() => {
    replaceItem(deleteItem(currentStatements), "statements");
    setCurrentStatements([]);
    setStatementsAreNew(false);
  }, [replaceItem, deleteItem, currentStatements]);

  const setStatementValue = useCallback((field, fact, value) => {
    setCurrentStatements(
      changeStatement(currentStatements, fact.id, value, currentCharacter)
    );
  }, [currentStatements, currentCharacter]);

  // Clear loading state on mount
  useEffect(() => {
    setLoadingPage("");
  }, [setLoadingPage]);

  return (
    <div>
      <h1 className="bp4-heading">Table view</h1>

      <FormGroup>
        <FormControlLabel
          control={
            <Switch
              onClick={() => setFilterActive(!filterActive)}
              checked={filterActive}
            />
          }
          label={"Taxon filter " + (filterActive ? "enabled" : "disabled")}
        />
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
