import React, { useState, useEffect } from "react";

import {
  getBestString,
  getStatementIcon,
} from "../Utils";

import Card from "@mui/material/Card";

function StatementTable({
  languages,
  statementsObject,
  taxaFlattened,
  characters,
  openStatements
}) {
  const [highlightedTaxon, setHighlightedTaxon] = useState(false);
  const [highlightedCharacter, setHighlightedCharacter] = useState(false);

  const language = languages[0];

  /**
   * Highlights or unhighlights a taxon based on its ID.
   *
   * @param {Object} taxon - The taxon object to highlight or unhighlight.
   * @return {void} Returns nothing.
   */
  const highlightTaxon = (taxon) => {
    setHighlightedTaxon(highlightedTaxon === taxon.id ? false : taxon.id);
  };

  /**
   * Highlights or unhighlights a character based on its ID.
   *
   * @param {object} character - The character object containing the ID.
   * @return {void} Returns nothing.
   */
  const highlightCharacter = (character) => {
    setHighlightedCharacter(
      highlightedCharacter === character.id ? false : character.id
    );
  };

  const TaxonHeaders = ({ taxaFlattened }) => {
    return (
      <>
        {taxaFlattened.map((taxon) => (
          <td
            key={taxon.id}
            onClick={() => highlightTaxon(taxon)}
            style={{ verticalAlign: "bottom", textAlign: "center" }}
          >
            <span
              style={{
                msWritingMode: "tb-rl",
                WebkitWritingMode: "vertical-rl",
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
                whiteSpace: "nowrap",
                width: "16pt",
                backgroundColor:
                  highlightedTaxon === taxon.id ? "yellow" : "white",
              }}
            >
              {taxon.level}
              {!taxon.hasOwnProperty("label") && taxon.scientificName}
              {taxon.label && taxon.label[language] && taxon.label[language].length > 0 &&
                " (" + taxon.label[language] + ")"
              }
              {taxon.hasOwnProperty("label") && (!taxon.label[language] || taxon.label[language].length === 0) &&
                " (default)"
              }

            </span>
          </td>
        ))}
      </>
    );
  }






  const Statement = ({ character, state, taxon, lastLevel, lastResult }) => {

    // If a statement is found in the statementsObject, use that
    if (statementsObject[taxon.id] && statementsObject[taxon.id][character.id] && statementsObject[taxon.id][character.id][state.id]) {
      return {
        html: (
          <td
            key={taxon.id + state.id}
            onClick={() => openStatements(character, taxon)}
            style={{
              cursor: "pointer",
              border: "1px solid grey",
              textAlign: "center",
              backgroundColor:
                "rgba(255, 255, 0, " +
                (0.5 * (highlightedTaxon === taxon.id) +
                  0.5 * (highlightedCharacter === character.id)) **
                2 +
                ")",
            }}
          >
            {getStatementIcon(statementsObject[taxon.id][character.id][state.id]["frequency"])}
          </td>
        ),
        lastLevel: taxon.level,
        lastResult: statementsObject[taxon.id][character.id][state.id],
      };
    }

    // If a statement is not found in the statementsObject, but there was a lastResult, use that
    if (lastResult !== undefined && lastLevel.length < taxon.level.length) {
      return {
        html: (
          <td
            key={taxon.id + state.id}
            style={{
              cursor: "not-allowed",
              border: "1px solid grey",
              opacity: "0.3",
              color: "lightgrey",
              textAlign: "center",
              backgroundColor:
                "rgba(255, 255, 0, " +
                (0.5 * (highlightedTaxon === taxon.id) +
                  0.5 * (highlightedCharacter === character.id)) **
                2 +
                ")",
            }}
          >
            {getStatementIcon(lastResult["frequency"])}
          </td>
        ),
        lastLevel: lastLevel,
        lastResult: lastResult,
      };
    };

    // otherwise, return a clickable cell
    return {
      html: (
        <td
          key={taxon.id + state.id}
          onClick={() => openStatements(character, taxon)}
          style={{
            cursor: "pointer",
            border: "1px solid grey",
            textAlign: "center",
            backgroundColor:
              "rgba(255, 255, 0, " +
              (0.5 * (highlightedTaxon === taxon.id) +
                0.5 * (highlightedCharacter === character.id)) **
              2 +
              ")",
          }}
        ></td>
      ),
      lastLevel: taxon.level,
      lastResult: undefined,
    };
  };

  const Statements = ({ character, state, taxaFlattened }) => {
    let lastLevel = "";
    let lastResult;
    let statement;

    return taxaFlattened.map((taxon) => {
      statement = Statement({
        character: character,
        state: state,
        taxon: taxon,
        lastLevel: lastLevel,
        lastResult: lastResult,
      });
      lastLevel = statement.lastLevel;
      lastResult = statement.lastResult;
      return statement.html;
    });
  };

  const States = ({ character, taxaFlattened }) => (
    <>
      {character.states.map((state) => (
        <tr key={state.id}>
          <td
            onClick={() => highlightCharacter(character)}
            style={{
              paddingLeft: "25px",
              borderBottom: "1px solid black",
              backgroundColor:
                highlightedCharacter === character.id ? "yellow" : "white",
            }}
          >
            {getBestString(state.title)}
          </td>
          <Statements character={character} state={state} taxaFlattened={taxaFlattened} />
        </tr>
      ))}
    </>
  );

  const Characters = ({ characters, taxaFlattened }) => (
    <>
      {characters.map((character) => (
        <React.Fragment key={character.id}>
          <tr>
            <td
              onClick={() => highlightCharacter(character)}
              style={{
                borderBottom: "1px solid black",
                backgroundColor:
                  highlightedCharacter === character.id ? "yellow" : "white",
              }}
            >
              <span style={{ fontWeight: "bold" }}>
                {character.title.en || character.title.nb || character.title.nn}
              </span>
            </td>
          </tr>
          <States character={character} taxaFlattened={taxaFlattened} />
        </React.Fragment>
      ))}
    </>
  );

  const Tabular = () => {
    return (
      <table
        style={{
          tableLayout: "fixed",
          fontSize: "12pt",
          borderCollapse: "collapse",
        }}
      >

        <tbody>
          <tr>
            <td style={{ width: "200px" }}>
              <div style={{ width: "400px" }} />
            </td>
            <TaxonHeaders taxaFlattened={taxaFlattened} />
          </tr>
          <Characters characters={characters} taxaFlattened={taxaFlattened} />

        </tbody>
      </table>
    )
  };

  useEffect(() => {
    console.log("Table mounted");

    return () => {
      console.log("Table unmounted");
    }
  }, []);

  return (
    <Card>
      <Tabular />
    </Card>

  );
}

export default StatementTable;
