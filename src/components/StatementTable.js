import React, { useState, useCallback, useMemo, memo, useRef } from "react";
import { Grid } from "react-window";

import { getBestString, getStatementIcon } from "../Utils";

import Card from "@mui/material/Card";

const LABEL_COLUMN_WIDTH = 350;
const CELL_WIDTH = 24;
const ROW_HEIGHT = 36;
const CHARACTER_ROW_HEIGHT = 40;
const HEADER_HEIGHT = 150;

// Cell component for react-window v2 API
const CellComponent = ({
  columnIndex,
  rowIndex,
  style,
  flattenedRows,
  taxaFlattened,
  inheritedStatements,
  highlightedTaxon,
  highlightedCharacter,
  highlightCharacter,
  openStatements,
  languages,
}) => {
  const row = flattenedRows[rowIndex];

  // Label column (first column)
  if (columnIndex === 0) {
    if (row.type === "character") {
      return (
        <div
          style={{
            ...style,
            display: "flex",
            alignItems: "center",
            fontWeight: "bold",
            fontSize: "13px",
            borderBottom: "1px solid black",
            backgroundColor: highlightedCharacter === row.character.id ? "yellow" : "white",
            cursor: "pointer",
            paddingLeft: "4px",
            paddingRight: "4px",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
          onClick={() => highlightCharacter(row.character.id)}
          title={getBestString(row.character.title, languages)}
        >
          <span style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            display: "block",
            width: "100%",
          }}>
            {getBestString(row.character.title, languages)}
          </span>
        </div>
      );
    } else {
      return (
        <div
          style={{
            ...style,
            display: "flex",
            alignItems: "center",
            fontSize: "12px",
            paddingLeft: "20px",
            paddingRight: "4px",
            borderBottom: "1px solid #ccc",
            backgroundColor: highlightedCharacter === row.character.id ? "yellow" : "white",
            cursor: "pointer",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
          onClick={() => highlightCharacter(row.character.id)}
          title={getBestString(row.state.title, languages)}
        >
          <span style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            display: "block",
            width: "100%",
          }}>
            {getBestString(row.state.title, languages)}
          </span>
        </div>
      );
    }
  }

  // Data cells (taxa columns)
  const taxonIndex = columnIndex - 1;
  const taxon = taxaFlattened[taxonIndex];

  if (!taxon) return <div style={style} />;

  // Character header row - no data cells
  if (row.type === "character") {
    return (
      <div
        style={{
          ...style,
          borderBottom: "1px solid black",
          backgroundColor: highlightedCharacter === row.character.id ? "#ffffcc" : "transparent",
        }}
      />
    );
  }

  // State row - render statement cell
  const cellData = inheritedStatements[rowIndex]?.[taxonIndex];
  const isHighlighted =
    highlightedTaxon === taxon.id || highlightedCharacter === row.character.id;
  const bgColor = isHighlighted
    ? `rgba(255, 255, 0, ${(0.5 * (highlightedTaxon === taxon.id) + 0.5 * (highlightedCharacter === row.character.id)) ** 2})`
    : "transparent";

  if (cellData?.type === "direct") {
    return (
      <div
        style={{
          ...style,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid grey",
          cursor: "pointer",
          backgroundColor: bgColor,
          boxSizing: "border-box",
        }}
        onClick={() => openStatements(row.character, taxon)}
      >
        {getStatementIcon(cellData.statement.frequency)}
      </div>
    );
  }

  if (cellData?.type === "inherited") {
    return (
      <div
        style={{
          ...style,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid grey",
          cursor: "not-allowed",
          opacity: 0.3,
          backgroundColor: bgColor,
          boxSizing: "border-box",
        }}
      >
        {getStatementIcon(cellData.statement.frequency)}
      </div>
    );
  }

  // Empty cell
  return (
    <div
      style={{
        ...style,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid grey",
        cursor: "pointer",
        backgroundColor: bgColor,
        boxSizing: "border-box",
      }}
      onClick={() => openStatements(row.character, taxon)}
    />
  );
};

function StatementTable({
  languages,
  statementsObject,
  taxaFlattened,
  characters,
  openStatements,
}) {
  const [highlightedTaxon, setHighlightedTaxon] = useState(false);
  const [highlightedCharacter, setHighlightedCharacter] = useState(false);
  const containerRef = useRef(null);

  const language = languages[0];

  const highlightTaxon = useCallback((taxonId) => {
    setHighlightedTaxon((prev) => (prev === taxonId ? false : taxonId));
  }, []);

  const highlightCharacter = useCallback((characterId) => {
    setHighlightedCharacter((prev) => (prev === characterId ? false : characterId));
  }, []);

  // Flatten rows: each row is either a character header or a state row
  const flattenedRows = useMemo(() => {
    const rows = [];
    characters.forEach((character) => {
      // Character header row
      rows.push({ type: "character", character });
      // State rows
      character.states.forEach((state) => {
        rows.push({ type: "state", character, state });
      });
    });
    return rows;
  }, [characters]);

  // Pre-compute statement inheritance for each state row
  const inheritedStatements = useMemo(() => {
    const inherited = {};
    flattenedRows.forEach((row, rowIndex) => {
      if (row.type !== "state") return;

      inherited[rowIndex] = {};
      let lastLevel = "";
      let lastResult = undefined;

      taxaFlattened.forEach((taxon, colIndex) => {
        const statement = statementsObject[taxon.id]?.[row.character.id]?.[row.state.id];
        if (statement) {
          lastLevel = taxon.level;
          lastResult = statement;
          inherited[rowIndex][colIndex] = { type: "direct", statement };
        } else if (lastResult !== undefined && lastLevel.length < taxon.level.length) {
          inherited[rowIndex][colIndex] = { type: "inherited", statement: lastResult, lastLevel };
        } else {
          lastLevel = taxon.level;
          lastResult = undefined;
          inherited[rowIndex][colIndex] = { type: "empty" };
        }
      });
    });
    return inherited;
  }, [flattenedRows, taxaFlattened, statementsObject]);

  // Header row component (sticky)
  const HeaderRow = useMemo(() => (
    <div
      style={{
        display: "flex",
        height: HEADER_HEIGHT,
        borderBottom: "1px solid black",
        position: "sticky",
        top: 0,
        zIndex: 2,
        backgroundColor: "white",
      }}
    >
      <div style={{ width: LABEL_COLUMN_WIDTH, minWidth: LABEL_COLUMN_WIDTH, flexShrink: 0 }} />
      {taxaFlattened.map((taxon) => (
        <div
          key={taxon.id}
          onClick={() => highlightTaxon(taxon.id)}
          style={{
            width: CELL_WIDTH,
            minWidth: CELL_WIDTH,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            cursor: "pointer",
            backgroundColor: highlightedTaxon === taxon.id ? "yellow" : "white",
          }}
        >
          <span
            style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              whiteSpace: "nowrap",
              fontSize: "10px",
              padding: "2px",
            }}
          >
            {taxon.level}
            {!taxon.hasOwnProperty("label") && taxon.scientificName}
            {taxon.label &&
              taxon.label[language] &&
              taxon.label[language].length > 0 &&
              " (" + taxon.label[language] + ")"}
            {taxon.hasOwnProperty("label") &&
              (!taxon.label[language] || taxon.label[language].length === 0) &&
              " (default)"}
          </span>
        </div>
      ))}
    </div>
  ), [taxaFlattened, highlightedTaxon, highlightTaxon, language]);

  // Calculate grid dimensions
  const columnCount = taxaFlattened.length + 1;
  const rowCount = flattenedRows.length;
  const totalWidth = LABEL_COLUMN_WIDTH + taxaFlattened.length * CELL_WIDTH;

  // Get column width - first column is wider
  const getColumnWidth = useCallback(
    (index) => (index === 0 ? LABEL_COLUMN_WIDTH : CELL_WIDTH),
    []
  );

  // Get row height - character headers are taller
  const getRowHeight = useCallback(
    (index) => {
      const row = flattenedRows[index];
      return row?.type === "character" ? CHARACTER_ROW_HEIGHT : ROW_HEIGHT;
    },
    [flattenedRows]
  );

  // Calculate total height for the grid
  const totalGridHeight = useMemo(() => {
    return flattenedRows.reduce((sum, row) => {
      return sum + (row.type === "character" ? CHARACTER_ROW_HEIGHT : ROW_HEIGHT);
    }, 0);
  }, [flattenedRows]);

  // Cell props for the Grid
  const cellProps = useMemo(() => ({
    flattenedRows,
    taxaFlattened,
    inheritedStatements,
    highlightedTaxon,
    highlightedCharacter,
    highlightCharacter,
    openStatements,
    languages,
  }), [
    flattenedRows,
    taxaFlattened,
    inheritedStatements,
    highlightedTaxon,
    highlightedCharacter,
    highlightCharacter,
    openStatements,
    languages,
  ]);

  // If no data, show empty state
  if (!characters.length || !taxaFlattened.length) {
    return (
      <Card>
        <div style={{ padding: "20px", textAlign: "center" }}>
          No data to display. Please add characters and taxa first.
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          overflow: "auto",
          maxHeight: "80vh",
        }}
      >
        {HeaderRow}
        <Grid
          columnCount={columnCount}
          columnWidth={getColumnWidth}
          rowCount={rowCount}
          rowHeight={getRowHeight}
          cellComponent={CellComponent}
          cellProps={cellProps}
          style={{
            height: Math.min(totalGridHeight, 600),
            width: Math.min(totalWidth, window.innerWidth - 100),
            overflowX: "auto",
          }}
        />
      </div>
    </Card>
  );
}

export default memo(StatementTable);
