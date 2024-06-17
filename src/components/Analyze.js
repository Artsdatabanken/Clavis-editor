import React, { useState, useEffect } from "react";
import { Card, Alert } from "@mui/material";

import { getBestString, getTaxon, cleanStatements } from "../Utils";

function Analyze({ clavis, setLoadingPage }) {
  const [analysis, setAnalysis] = useState({});
  const [cleaningWarnings, setCleaningWarnings] = useState([]);

  const getAncestry = (taxa, resultObject = {}, ancestry = []) => {
    taxa.forEach((taxon) => {
      resultObject[taxon.id] = ancestry.concat([taxon.id]);
      if (taxon.children) {
        resultObject = getAncestry(
          taxon.children,
          resultObject,
          resultObject[taxon.id]
        );
      }
    });
    return resultObject;
  };

  const taxonomy = getAncestry(clavis.taxa);

  const getFacts = (taxon, freq) => {
    return clavis.statements
      .filter((s) => taxonomy[taxon].includes(s.taxon) && s.frequency === freq)
      .map((s) => s.value);
  };

  const areDiscernable = (taxonX, taxonY) => {
    let all_facts = getFacts(taxonX, 1).concat(getFacts(taxonY, 0));

    for (let index = 0; index < all_facts.length; index++) {
      if (all_facts.lastIndexOf(all_facts[index]) !== index) {
        return true;
      }
    }

    all_facts = getFacts(taxonX, 0).concat(getFacts(taxonY, 1));

    for (let index = 0; index < all_facts.length; index++) {
      if (all_facts.lastIndexOf(all_facts[index]) !== index) {
        return true;
      }
    }

    return false;
  };

  const getEndpoints = (taxa) => {
    let result = [];

    taxa.forEach((taxon) => {
      if (taxon.isEndpoint || !taxon.children || !taxon.children.length) {
        result = result.concat([
          {
            id: taxon.id,
            name:
              taxon.scientificName || getBestString(taxon.label) || taxon.id,
          },
        ]);
      } else if (taxon.children && taxon.children.length) {
        result = result.concat(getEndpoints(taxon.children));
      }
    });

    return result;
  };

  const endpoints = getEndpoints(clavis.taxa);

  const getIndiscernables = (taxa) => {
    let results = [];

    if (taxa.length < 2) {
      return results;
    }

    const focal = taxa[0];
    const rest = taxa.slice(1);
    rest.forEach((restTaxon) => {
      if (!areDiscernable(focal.id, restTaxon.id)) {
        results = results.concat([[focal, restTaxon]]);
      }
    });

    results = results.concat(getIndiscernables(rest));
    return results;
  };

  // Returns characters for which there are taxa with a number of statements not matching the number of states (i.e. not fully scored)

  const getIncompleteStatements = () => {
    let result = clavis.characters.filter((character) => {
      // Get all statements for this character
      let statements = clavis.statements
        .filter((statement) => statement.frequency >= 0)
        .filter((statement) => statement.character === character.id);

      // Group those statements by taxon
      let groupByTaxon = statements.reduce((group, statement) => {
        const { taxon } = statement;
        group[taxon] = group[taxon] ?? [];
        group[taxon].push(statement);
        return group;
      }, {});

      // A character is incompletely scored when there are taxa with fewer statements than the character has states
      let incompletelyScored = Object.values(groupByTaxon).filter(
        (item) => item.length < character.states.length
      );

      return incompletelyScored.length > 0;
    });

    return result;
  };

  const getInvalidStatements = () => {
    let errors = [];

    clavis.characters.forEach((character) => {
      // Get all statements for this character
      let statements = clavis.statements
        .filter((statement) => statement.frequency >= 0)
        .filter((statement) => statement.character === character.id);

      // Group those statements by taxon
      let groupByTaxon = statements.reduce((group, statement) => {
        const { taxon } = statement;
        group[taxon] = group[taxon] ?? [];
        group[taxon].push(statement);
        return group;
      }, {});

      Object.values(groupByTaxon).forEach((item) => {
        // If there is a 1, there can't be anything else than 0
        if (
          item.filter((x) => x.frequency === 1).length > 0 &&
          item.filter((x) => x.frequency === 0).length !==
            character.states.length - 1
        ) {
          errors = errors.concat({
            character: character.title[clavis.language[0]],
            taxon: getTaxon(clavis.taxa, item[0].taxon),
            reason: "There is a 1, there can't be anything else than 0",
          });
        }

        // There cannot be only one 0.5
        if (
          item.filter((x) => x.frequency > 0 && x.frequency < 1).length === 1
        ) {
          errors = errors.concat({
            character: character.title[clavis.language[0]],
            taxon: getTaxon(clavis.taxa, item[0].taxon),
            reason: "There cannot be only one 0.5",
          });
        }

        // Only zeroes is not allowed
        if (
          item.filter((x) => x.frequency === 0).length ===
          character.states.length
        ) {
          errors = errors.concat({
            character: character.title[clavis.language[0]],
            taxon: getTaxon(clavis.taxa, item[0].taxon),
            reason: "Only zeroes is not allowed",
          });
        }
      });
    });

    return errors;
  };

  useEffect(() => {
    setLoadingPage("");
  }, [setLoadingPage]);

  if (!analysis.cleaned) {
    let cleaningLog = cleanStatements(clavis)
    clavis["statements"] = cleaningLog.statements;
    setCleaningWarnings(cleaningLog.warnings);
    setAnalysis((analysis) => Object.assign({}, analysis, { cleaned: true }));
  }

  if (analysis.cleaned && !analysis.indiscernables) {
    setAnalysis((analysis) =>
      Object.assign({}, analysis, { indiscernables: [] })
    );
    setAnalysis((analysis) =>
      Object.assign({}, analysis, {
        indiscernables: getIndiscernables(endpoints),
      })
    );
  }

  if (analysis.cleaned && !analysis.incompleteStatements) {
    setAnalysis((analysis) =>
      Object.assign({}, analysis, { incompleteStatements: [] })
    );
    setAnalysis((analysis) =>
      Object.assign({}, analysis, {
        incompleteStatements: getIncompleteStatements(),
      })
    );
  }

  if (analysis.cleaned && !analysis.invalidStatements) {
    setAnalysis((analysis) =>
      Object.assign({}, analysis, { invalidStatements: [] })
    );
    setAnalysis((analysis) =>
      Object.assign({}, analysis, {
        invalidStatements: getInvalidStatements(),
      })
    );
  }

  return (
    <div>
      <h1 className="bp4-heading">Analysis</h1>

      <Card>
        {cleaningWarnings &&
          cleaningWarnings.map((warning) => (
            <Alert severity="error">
              {warning}
            </Alert>
          ))}
      </Card>

      <Card>
        {analysis?.incompleteStatements &&
          analysis.incompleteStatements.map((character) => (
            <Alert severity="warning" key={character.id}>
              "{character.title[clavis.language[0]]}" has incomplete scoring
            </Alert>
          ))}
      </Card>

      <Card>
        {analysis?.invalidStatements &&
          analysis.invalidStatements.map((error) => (
            <Alert severity="warning">
              {error.taxon.scientificName} has invalid scoring for "
              {error.character}": {error.reason}
            </Alert>
          ))}
      </Card>

      <Card>
        {analysis?.indiscernables &&
          analysis.indiscernables.map((x) => (
            <Alert severity="warning" key={x[0].id + x[1].id}>
              {x[0].name} and {x[1].name} are not discernable
            </Alert>
          ))}
      </Card>
    </div>
  );
}

export default Analyze;
