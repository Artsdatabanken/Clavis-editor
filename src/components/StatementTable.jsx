import React, { useState, useCallback, memo } from "react";

import { getBestString, getStatementIcon, getNumericalDisplay } from "../Utils";

import Card from "@mui/material/Card";

function StatementTable({
  languages,
  statementsObject,
  taxaFlattened,
  characters,
  openStatements,
}) {
  const [highlightedTaxon, setHighlightedTaxon] = useState(false);
  const [highlightedCharacter, setHighlightedCharacter] = useState(false);

  const language = languages[0];

  const highlightTaxon = useCallback((taxon) => {
    setHighlightedTaxon((prev) => (prev === taxon.id ? false : taxon.id));
  }, []);

  const highlightCharacter = useCallback((character) => {
    setHighlightedCharacter((prev) =>
      prev === character.id ? false : character.id
    );
  }, []);

  const TaxonHeaders = () => {
    return (
      <>
        {taxaFlattened.map((taxon) => (
          <th
            key={taxon.id}
            onClick={() => highlightTaxon(taxon)}
            style={{
              verticalAlign: "bottom",
              textAlign: "center",
              position: "sticky",
              top: 0,
              zIndex: 2,
              backgroundColor: highlightedTaxon === taxon.id ? "yellow" : "white",
              borderBottom: "2px solid #333",
            }}
            title={`${taxon.scientificName || ""}${taxon.label?.[language] ? ` (${taxon.label[language]})` : ""}`}
          >
            <span
              style={{
                msWritingMode: "tb-rl",
                WebkitWritingMode: "vertical-rl",
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
                whiteSpace: "nowrap",
                width: "16pt",
                fontSize: "12px",
              }}
            >
              {taxon.level}
              {!taxon.hasOwnProperty("label") && taxon.scientificName}
              {taxon.label &&
                taxon.label[language] &&
                taxon.label[language].length > 0 &&
                " (" + taxon.label[language] + ")"}
              {taxon.hasOwnProperty("label") &&
                (!taxon.label[language] ||
                  taxon.label[language].length === 0) &&
                " (default)"}
            </span>
          </th>
        ))}
      </>
    );
  };

  const Statement = ({ character, state, taxon, lastLevel, lastResult }) => {
    if (
      statementsObject[taxon.id] &&
      statementsObject[taxon.id][character.id] &&
      statementsObject[taxon.id][character.id][state.id]
    ) {
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
            {getStatementIcon(
              statementsObject[taxon.id][character.id][state.id]["frequency"]
            )}
          </td>
        ),
        lastLevel: taxon.level,
        lastResult: statementsObject[taxon.id][character.id][state.id],
      };
    }

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
    }

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

  const Statements = ({ character, state }) => {
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

  const States = ({ character }) => (
    <>
      {character.states.map((state) => (
        <tr key={state.id}>
          <td
            onClick={() => highlightCharacter(character)}
            title={getBestString(state.title, languages)}
            style={{
              paddingLeft: "25px",
              fontSize: "14px",
              borderBottom: "1px solid #ccc",
              borderRight: "2px solid #333",
              backgroundColor:
                highlightedCharacter === character.id ? "yellow" : "white",
              position: "sticky",
              left: 0,
              zIndex: 1,
              cursor: "pointer",
            }}
          >
            {getBestString(state.title, languages)}
          </td>
          <Statements character={character} state={state} />
        </tr>
      ))}
    </>
  );

  // Component for rendering numerical character values
  const NumericalStatements = ({ character }) => {
    let lastLevel = "";
    let lastResult;

    return taxaFlattened.map((taxon) => {
      const hasStatement =
        statementsObject[taxon.id] &&
        statementsObject[taxon.id][character.id];

      if (hasStatement) {
        // Get the first (and should be only) statement for this numerical character
        const statementData = Object.values(
          statementsObject[taxon.id][character.id]
        )[0];
        lastLevel = taxon.level;
        lastResult = statementData;

        return (
          <td
            key={taxon.id + character.id}
            onClick={() => openStatements(character, taxon)}
            style={{
              cursor: "pointer",
              border: "1px solid grey",
              textAlign: "center",
              fontSize: "11px",
              backgroundColor:
                "rgba(255, 255, 0, " +
                (0.5 * (highlightedTaxon === taxon.id) +
                  0.5 * (highlightedCharacter === character.id)) **
                  2 +
                ")",
            }}
          >
            {getNumericalDisplay(statementData.value, character, languages)}
          </td>
        );
      }

      // Check for inheritance from parent
      if (lastResult !== undefined && lastLevel.length < taxon.level.length) {
        return (
          <td
            key={taxon.id + character.id}
            style={{
              cursor: "not-allowed",
              border: "1px solid grey",
              opacity: "0.3",
              color: "lightgrey",
              textAlign: "center",
              fontSize: "11px",
              backgroundColor:
                "rgba(255, 255, 0, " +
                (0.5 * (highlightedTaxon === taxon.id) +
                  0.5 * (highlightedCharacter === character.id)) **
                  2 +
                ")",
            }}
          >
            {getNumericalDisplay(lastResult.value, character, languages)}
          </td>
        );
      }

      lastLevel = taxon.level;
      lastResult = undefined;

      return (
        <td
          key={taxon.id + character.id}
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
      );
    });
  };

  const Characters = () => (
    <>
      {characters.map((character) => (
        <React.Fragment key={character.id}>
          <tr>
            <td
              onClick={() => highlightCharacter(character)}
              title={getBestString(character.title, languages)}
              style={{
                borderBottom: "1px solid black",
                borderRight: "2px solid #333",
                fontSize: "15px",
                backgroundColor:
                  highlightedCharacter === character.id ? "yellow" : "white",
                position: "sticky",
                left: 0,
                zIndex: 1,
                cursor: "pointer",
              }}
            >
              <span style={{ fontWeight: "bold" }}>
                {getBestString(character.title, languages)}
              </span>
              {character.type === "numerical" && character.unit && (
                <span style={{ fontWeight: "normal", marginLeft: "4px", color: "#666" }}>
                  ({getBestString(character.unit, languages)})
                </span>
              )}
            </td>
            {character.type === "numerical" && (
              <NumericalStatements character={character} />
            )}
          </tr>
          {character.type !== "numerical" && <States character={character} />}
        </React.Fragment>
      ))}
    </>
  );

  return (
    <Card style={{ overflow: "hidden" }}>
      <div
        style={{
          maxWidth: "calc(100vw - 300px)",
          maxHeight: "80vh",
          overflow: "auto",
        }}
      >
        <table
          style={{
            tableLayout: "fixed",
            fontSize: "12pt",
            borderCollapse: "separate",
            borderSpacing: 0,
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  width: "300px",
                  minWidth: "300px",
                  position: "sticky",
                  left: 0,
                  top: 0,
                  zIndex: 3,
                  backgroundColor: "white",
                  borderBottom: "2px solid #333",
                  borderRight: "2px solid #333",
                }}
              >
                <div style={{ width: "300px" }} />
              </th>
              <TaxonHeaders />
            </tr>
          </thead>
          <tbody>
            <Characters />
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default memo(StatementTable);
